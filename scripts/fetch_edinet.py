#!/usr/bin/env python3
"""
EDINET API v2からXBRLデータを取得するスクリプト

憲法遵守:
- 実データ取得（モックデータ作成禁止）
- EDINET API v2公式エンドポイント使用
- エラーハンドリング完備
- レート制限遵守（1秒間隔）
- .env.local環境変数対応

Version: 1.0.0
Date: 2025-12-15
"""

import requests
import zipfile
import io
import time
import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv


# .env.localから環境変数読み込み（ローカル環境のみ）
env_file = Path(__file__).parent.parent / ".env.local"
if env_file.exists():
    load_dotenv(env_file)

# EDINET API v2エンドポイント（環境変数を優先）
EDINET_API_BASE = os.getenv("EDINET_BASE_URL", "https://disclosure2.edinet-fsa.go.jp/api/v2")
EDINET_API_KEY = os.getenv("EDINET_API_KEY", "")
XBRL_DIR = Path(__file__).parent.parent / "XBRL"

# 企業コードマッピング（EDINETコード → 企業名）
COMPANY_MAPPING = {
    os.getenv("TEPCO_EDINET_CODE", "E04498"): "TEPCO",  # 東京電力ホールディングス
    os.getenv("CHUBU_EDINET_CODE", "E04502"): "CHUBU",  # 中部電力
    os.getenv("JERA_EDINET_CODE", "E34837"): "JERA",   # JERA
}


def get_document_list(date_str: str) -> list:
    """
    EDINET APIから書類一覧を取得
    
    Args:
        date_str: 取得日（YYYY-MM-DD）
    
    Returns:
        書類情報のリスト
    """
    url = f"{EDINET_API_BASE}/documents.json"
    params = {
        "date": date_str,
        "type": 2,  # 2=提出書類（メタデータ+本文）
    }
    
    # EDINET API v2ではAPIキーをクエリパラメータに追加
    if EDINET_API_KEY:
        params["Subscription-Key"] = EDINET_API_KEY
    
    headers = {
        "User-Agent": "ValueScope/1.0 (https://github.com/J1921604/ValueScope)"
    }
    
    # print(f"Fetching document list for {date_str}...")
    try:
        response = requests.get(url, params=params, headers=headers, timeout=30)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"  Error fetching list for {date_str}: {e}")
        return []


def download_xbrl(doc_id: str, company_code: str, date_str: str) -> Path:
    """
    EDINET APIからXBRL ZIPをダウンロード
    
    Args:
        doc_id: 書類管理番号
        company_code: EDINETコード
        date_str: 提出日
    
    Returns:
        保存先パス
    """
    url = f"{EDINET_API_BASE}/documents/{doc_id}"
    params = {"type": 1}  # 1=提出本文書及び監査報告書（XBRL含む）
    
    # EDINET API v2ではAPIキーをクエリパラメータに追加
    if EDINET_API_KEY:
        params["Subscription-Key"] = EDINET_API_KEY
    
    headers = {
        "User-Agent": "ValueScope/1.0 (https://github.com/J1921604/ValueScope)"
    }
    
    print(f"Downloading XBRL for {doc_id} ({date_str})...")
    response = requests.get(url, params=params, headers=headers, timeout=60)
    response.raise_for_status()
    
    # ZIPファイルを保存
    company_dir = XBRL_DIR / company_code
    company_dir.mkdir(parents=True, exist_ok=True)
    
    # ファイル名に日付を含める
    zip_path = company_dir / f"{date_str}_{doc_id}.zip"
    zip_path.write_bytes(response.content)
    
    print(f"  Saved to {zip_path}")
    return zip_path


def cleanup_non_annual_files(company_code: str):
    """
    有価証券報告書（通常6-7月提出）以外のファイルを削除する
    """
    company_dir = XBRL_DIR / company_code
    if not company_dir.exists():
        return
    
    print(f"Cleaning up non-annual files for {company_code}...")
    count = 0
    for zip_file in company_dir.glob("*.zip"):
        # Filename format: YYYY-MM-DD_docID.zip
        try:
            date_part = zip_file.name.split("_")[0]
            file_date = datetime.strptime(date_part, "%Y-%m-%d")
            # Keep only June and July files (Annual reports usually)
            # 3月決算企業の有報は6月末提出。訂正などで7月になることも考慮。
            if file_date.month not in [6, 7]:
                print(f"  Removing {zip_file.name} (Month: {file_date.month})")
                zip_file.unlink()
                count += 1
        except Exception:
            continue
    if count > 0:
        print(f"  Removed {count} non-annual files.")
    else:
        print("  No non-annual files found.")


def fetch_latest_xbrl(company_code: str, years_back: int = 3) -> list:
    """
    最新および過去のXBRLデータを取得（複数年対応）
    
    Args:
        company_code: EDINETコード
        years_back: 遡る年数
    
    Returns:
        ダウンロードしたZIPファイルパスのリスト
    """
    downloaded = []
    today = datetime.now()
    
    # 過去years_back年分をチェック
    for year_offset in range(years_back + 1):
        target_year = today.year - year_offset
        print(f"Checking year {target_year}...")
        
        # チェックする期間リスト (開始日, 終了日)
        # 有価証券報告書: 6月中旬〜6月下旬 (通常は6月末提出)
        # 余裕を持って6月1日〜7月31日を検索範囲とする
        
        check_periods = [
            (datetime(target_year, 6, 1), datetime(target_year, 7, 31)),   # Annual
        ]
        
        for start_date, end_date in check_periods:
            if start_date > today:
                continue
            
            current_date = start_date
            while current_date <= end_date and current_date <= today:
                date_str = current_date.strftime("%Y-%m-%d")
                
                # レート制限遵守（1秒間隔）
                time.sleep(1)
                
                docs = get_document_list(date_str)
                
                # 指定企業の書類をフィルタ
                # 有価証券報告書（有報）のみを対象とする。訂正有報(130)は除外。
                allowed_codes = ["120"]  # 120:有報
                
                target_docs = []
                for doc in docs:
                    if doc.get("edinetCode") != company_code:
                        continue
                    if doc.get("xbrlFlag") != "1":
                        continue

                    doc_type = doc.get("docTypeCode")
                    
                    # docTypeCode が許可リストに含まれる場合は取得候補
                    if doc_type in allowed_codes:
                        target_docs.append(doc)
                        continue
                
                for doc in target_docs:
                    doc_id = doc.get("docID")
                    doc_type = doc.get("docTypeCode")
                    doc_desc = doc.get("docDescription")
                    
                    # 既にダウンロード済みかチェック
                    company_dir = XBRL_DIR / company_code
                    company_dir.mkdir(parents=True, exist_ok=True)
                    zip_path = company_dir / f"{date_str}_{doc_id}.zip"

                    # args が利用可能であれば --force による上書きを尊重
                    force = globals().get('args', None) and getattr(globals().get('args'), 'force', False)

                    if not force:
                        existing = None
                        # docID を含むファイルを優先検出
                        for f in company_dir.glob(f"*{doc_id}*.zip"):
                            existing = f
                            break
                        # なければ同日付のファイル名を検出
                        if existing is None:
                            for f in company_dir.glob(f"{date_str}_*.zip"):
                                existing = f
                                break

                        if existing is not None and existing.exists():
                            print(f"  Already downloaded: {doc_id} ({date_str}) - {doc_desc} -> {existing.name}")
                            downloaded.append(existing)
                            continue

                    print(f"  Found document: {doc_desc} ({date_str})")
                    try:
                        zip_path = download_xbrl(doc_id, company_code, date_str)
                        downloaded.append(zip_path)
                    except Exception as e:
                        print(f"  Failed to download {doc_id}: {e}")
                
                current_date += timedelta(days=1)
                
    return downloaded


def main():
    parser = argparse.ArgumentParser(
        description="EDINET API v2からXBRLデータを取得"
    )
    parser.add_argument(
        "--companies",
        nargs="+",
        default=list(COMPANY_MAPPING.keys()),
        help="取得対象のEDINETコード"
    )
    parser.add_argument(
        "--years",
        type=int,
        default=10,
        help="遡る年数"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="既存のファイルがあっても強制的に再ダウンロードする"
    )
    parser.add_argument(
        "--ci",
        action="store_true",
        help="CIモード: 7月1日以外はスキップ"
    )
    
    args = parser.parse_args()
    
    # CIモードの場合、7月1日以外はスキップ
    if args.ci:
        today = datetime.now()
        if today.month != 7 or today.day != 1:
            print(f"CI Mode: Skipping execution because today ({today.strftime('%Y-%m-%d')}) is not July 1st.")
            return 0

    print("=== EDINET XBRL Fetcher ===")
    print(f"Target companies: {args.companies}")
    print(f"Years back: {args.years}")
    print(f"API Key: {'Set' if EDINET_API_KEY else 'Not set (using public API)'}")
    print()
    
    results = {}
    
    for company_code in args.companies:
        company_name = COMPANY_MAPPING.get(company_code, company_code)
        print(f"Fetching XBRL for {company_name} ({company_code})...")
        
        try:
            # まず不要なファイル（半期・四半期など）を削除
            cleanup_non_annual_files(company_code)
            
            downloaded = fetch_latest_xbrl(company_code, args.years)
            results[company_code] = {
                "company": company_name,
                "downloaded": len(downloaded),
                "files": [str(f) for f in downloaded]
            }
            print(f"  Downloaded {len(downloaded)} files")
        except Exception as e:
            print(f"  Error: {e}")
            results[company_code] = {
                "company": company_name,
                "error": str(e)
            }
        
        print()
    
    # 結果サマリ出力
    print("=== Summary ===")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    
    return 0


if __name__ == "__main__":
    exit(main())
