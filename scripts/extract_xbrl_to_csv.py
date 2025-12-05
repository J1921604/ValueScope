# EDINET XBRL全解析 - PL/BS/CF CSV出力スクリプト
# Version: 1.0.0
# Date: 2025-12-15

import os
import json
import zipfile
import argparse
import csv
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from lxml import etree
from datetime import datetime

# 基本XBRL名前空間
BASE_NAMESPACES = {
    'xbrli': 'http://www.xbrl.org/2003/instance'
}

def calculate_fiscal_year(date_str: str) -> str:
    """
    決算日から会計年度を計算
    例: 2025-03-31 → FY2024
    日本企業は通常3月決算なので、決算日の年-1が会計年度
    """
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        # 3月決算の場合、FY2024は2024年4月1日～2025年3月31日
        # 決算日が2025-03-31の場合、会計年度は2024
        fiscal_year = date_obj.year - 1
        return str(fiscal_year)
    except:
        return "unknown"

def detect_namespaces(root: etree.Element) -> Dict[str, str]:
    """
    XBRLファイルから動的に名前空間を検出
    """
    namespaces = dict(BASE_NAMESPACES)
    
    for prefix, uri in root.nsmap.items():
        if prefix is None:
            continue
        
        # jppfs, jpcrp, jpdei などの名前空間を検出
        if prefix:
            namespaces[prefix] = uri
    
    return namespaces

def extract_xbrl_from_zip(zip_path: str, output_dir: str) -> str:
    """
    ZIPファイルからPublicDocのXBRLファイルを抽出
    """
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        xbrl_files = [f for f in zip_ref.namelist() if 'PublicDoc' in f and f.endswith('.xbrl')]
        if not xbrl_files:
            raise FileNotFoundError(f"PublicDoc XBRL file not found in {zip_path}")
        
        xbrl_name = xbrl_files[0]
        zip_ref.extract(xbrl_name, output_dir)
        return os.path.join(output_dir, xbrl_name)

def get_date_from_context(root: etree.Element, namespaces: Dict[str, str], context_type: str = 'Instant') -> str:
    """
    contextRefから決算日を抽出
    優先順位: CurrentYearInstant > 3月31日 > その他のInstant
    """
    contexts = root.findall('.//xbrli:context', namespaces)
    candidate_dates = []
    
    for ctx in contexts:
        ctx_id = ctx.get('id', '')
        
        if context_type == 'Instant':
            instant = ctx.find('.//xbrli:instant', namespaces)
            if instant is not None and instant.text:
                # CurrentYearInstant を最優先
                if 'CurrentYearInstant' in ctx_id or 'CurrentYearEnd' in ctx_id:
                    return instant.text
                # 3月31日を候補に追加（日本企業の決算日）
                if '-03-31' in instant.text:
                    candidate_dates.append(instant.text)
                else:
                    candidate_dates.append((instant.text, 1))  # 優先度低
        else:  # Duration
            end = ctx.find('.//xbrli:endDate', namespaces)
            if end is not None and end.text:
                if 'CurrentYear' in ctx_id:
                    return end.text
                if '-03-31' in end.text:
                    candidate_dates.append(end.text)
                else:
                    candidate_dates.append((end.text, 1))
    
    # 候補から選択（3月31日優先）
    fiscal_year_ends = [d for d in candidate_dates if isinstance(d, str) and '-03-31' in d]
    if fiscal_year_ends:
        return max(fiscal_year_ends)  # 最新の3月31日
    
    # 3月31日がなければ最新の日付
    if candidate_dates:
        all_dates = [d[0] if isinstance(d, tuple) else d for d in candidate_dates]
        return max(all_dates)
    
    return "unknown"

def extract_all_elements(root: etree.Element, namespaces: Dict[str, str], 
                         context_filter: str = 'Instant') -> Dict[str, float]:
    """
    XBRLからすべての数値要素を抽出
    """
    result = {}
    
    # すべての要素を走査
    for elem in root.iter():
        # 名前空間を持つ要素のみ処理
        if elem.tag.startswith('{'):
            tag_parts = elem.tag.split('}')
            if len(tag_parts) == 2:
                namespace_uri, local_name = tag_parts
                namespace_uri = namespace_uri[1:]  # '{' を除去
                
                # jppfs, jpcrp などの企業系名前空間のみ抽出
                is_relevant_ns = any(prefix in namespace_uri for prefix in ['jppfs', 'jpcrp', 'jpdei'])
                
                if is_relevant_ns and elem.text and elem.text.strip():
                    context_ref = elem.get('contextRef', '')
                    
                    # contextRefのフィルタリング
                    if context_filter in context_ref or context_filter == 'All':
                        try:
                            # 数値変換を試みる
                            value = float(elem.text.replace(',', ''))
                            
                            # タグ名をキーとして保存（百万円単位に変換）
                            if local_name not in result or abs(value) > abs(result.get(local_name, 0)):
                                result[local_name] = value / 1_000_000 if abs(value) > 1000 else value
                        except (ValueError, TypeError):
                            # 数値でない場合はスキップ
                            pass
    
    return result

def parse_balance_sheet(xbrl_path: str, company_code: str, fiscal_year: str) -> Dict[str, Any]:
    """
    貸借対照表（BS）を解析
    """
    tree = etree.parse(xbrl_path)
    root = tree.getroot()
    namespaces = detect_namespaces(root)
    
    date = get_date_from_context(root, namespaces, 'Instant')
    bs_elements = extract_all_elements(root, namespaces, 'Instant')
    
    # 基本項目
    bs_data = {
        'fiscal_year': fiscal_year,
        'date': date,
        'company_code': company_code,
    }
    
    # すべてのBS要素を追加
    bs_data.update(bs_elements)
    
    return bs_data

def parse_profit_loss(xbrl_path: str, company_code: str, fiscal_year: str) -> Dict[str, Any]:
    """
    損益計算書（PL）を解析
    """
    tree = etree.parse(xbrl_path)
    root = tree.getroot()
    namespaces = detect_namespaces(root)
    
    date = get_date_from_context(root, namespaces, 'Duration')
    pl_elements = extract_all_elements(root, namespaces, 'Duration')
    
    pl_data = {
        'fiscal_year': fiscal_year,
        'date': date,
        'company_code': company_code,
    }
    
    pl_data.update(pl_elements)
    
    return pl_data

def parse_cash_flow(xbrl_path: str, company_code: str, fiscal_year: str) -> Dict[str, Any]:
    """
    キャッシュフロー計算書（CF）を解析
    """
    tree = etree.parse(xbrl_path)
    root = tree.getroot()
    namespaces = detect_namespaces(root)
    
    date = get_date_from_context(root, namespaces, 'Duration')
    
    # CF関連要素のみ抽出（OpeCF, InvCF, FinCFなどを含む）
    cf_elements = {}
    for elem in root.iter():
        if elem.tag.startswith('{'):
            tag_parts = elem.tag.split('}')
            if len(tag_parts) == 2:
                namespace_uri, local_name = tag_parts
                namespace_uri = namespace_uri[1:]
                
                # CF関連タグを検出
                is_cf_tag = any(keyword in local_name for keyword in 
                               ['CashFlow', 'CF', 'NetCash', 'CashAndCash'])
                
                is_relevant_ns = any(prefix in namespace_uri for prefix in ['jppfs', 'jpcrp'])
                
                if is_cf_tag and is_relevant_ns and elem.text and elem.text.strip():
                    context_ref = elem.get('contextRef', '')
                    if 'Duration' in context_ref:
                        try:
                            value = float(elem.text.replace(',', ''))
                            if local_name not in cf_elements or abs(value) > abs(cf_elements.get(local_name, 0)):
                                cf_elements[local_name] = value / 1_000_000 if abs(value) > 1000 else value
                        except (ValueError, TypeError):
                            pass
    
    cf_data = {
        'fiscal_year': fiscal_year,
        'date': date,
        'company_code': company_code,
    }
    
    cf_data.update(cf_elements)
    
    return cf_data

def save_to_csv(data_list: List[Dict[str, Any]], output_file: Path):
    """
    データをCSV形式で保存
    """
    if not data_list:
        print(f"  ⚠ データが空のため、CSV出力をスキップします: {output_file}")
        return
    
    # すべてのキーを収集（順序保持）
    all_keys = []
    key_set = set()
    
    # 基本キーを最初に配置
    base_keys = ['fiscal_year', 'date', 'company_code']
    for key in base_keys:
        if key not in key_set:
            all_keys.append(key)
            key_set.add(key)
    
    # 残りのキーを追加
    for item in data_list:
        for key in item.keys():
            if key not in key_set:
                all_keys.append(key)
                key_set.add(key)
    
    # CSV書き込み
    with open(output_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=all_keys)
        writer.writeheader()
        writer.writerows(data_list)
    
    print(f"  ✓ CSV保存: {output_file} ({len(data_list)} 行)")

def main():
    parser = argparse.ArgumentParser(description='XBRL全解析 - PL/BS/CF CSV出力')
    parser.add_argument('--input', default='XBRL', help='入力ディレクトリ（デフォルト: XBRL）')
    parser.add_argument('--output', default='XBRL_output', help='出力ディレクトリ（デフォルト: XBRL_output）')
    args = parser.parse_args()
    
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"XBRL全解析開始: {input_dir} → {output_dir}")
    
    # 企業コードマッピング
    company_mapping = {
        'E04498': 'TEPCO',
        'E04502': 'CHUBU',
        'E34837': 'JERA',
    }
    
    for company_code, company_name in company_mapping.items():
        company_dir = input_dir / company_code
        if not company_dir.exists():
            print(f"⚠ {company_name} ({company_code}) のデータが見つかりません。スキップします。")
            continue
        
        print(f"\n{company_name} ({company_code}) を処理中...")
        
        zip_files = sorted(list(company_dir.glob('*.zip')))
        if not zip_files:
            print(f"⚠ ZIPファイルが見つかりません。")
            continue
        
        bs_data_list = []
        pl_data_list = []
        cf_data_list = []
        
        for zip_path in zip_files:
            print(f"  処理中: {zip_path.name}")
            
            try:
                # XBRL抽出
                temp_dir = output_dir / f"{company_code}_temp"
                temp_dir.mkdir(parents=True, exist_ok=True)
                xbrl_file = extract_xbrl_from_zip(str(zip_path), str(temp_dir))
                
                # 決算日を取得
                tree = etree.parse(xbrl_file)
                root = tree.getroot()
                namespaces = detect_namespaces(root)
                decision_date = get_date_from_context(root, namespaces, 'Instant')
                
                # 決算日から会計年度を計算
                fiscal_year = calculate_fiscal_year(decision_date)
                print(f"    決算日: {decision_date} → 会計年度: FY{fiscal_year}")
                
                # BS解析
                bs_data = parse_balance_sheet(xbrl_file, company_code, fiscal_year)
                bs_data_list.append(bs_data)
                
                # PL解析
                pl_data = parse_profit_loss(xbrl_file, company_code, fiscal_year)
                pl_data_list.append(pl_data)
                
                # CF解析
                cf_data = parse_cash_flow(xbrl_file, company_code, fiscal_year)
                cf_data_list.append(cf_data)
                
                # 一時ディレクトリ削除
                import shutil
                shutil.rmtree(temp_dir)
                
                print(f"    ✓ 解析完了: BS({len(bs_data)} 項目), PL({len(pl_data)} 項目), CF({len(cf_data)} 項目)")
                
            except Exception as e:
                print(f"    ❌ エラー: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # 企業別にCSV保存
        company_output_dir = output_dir / company_name
        company_output_dir.mkdir(parents=True, exist_ok=True)
        
        save_to_csv(bs_data_list, company_output_dir / 'BS.csv')
        save_to_csv(pl_data_list, company_output_dir / 'PL.csv')
        save_to_csv(cf_data_list, company_output_dir / 'CF.csv')
        
        print(f"  ✓ {company_name} 完了")
    
    print(f"\n✓ XBRL全解析完了: {output_dir}")

if __name__ == '__main__':
    main()
