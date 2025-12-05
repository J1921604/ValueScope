# EDINET XBRL解析スクリプト（改良版 - 動的名前空間対応）
# Version: 1.0.0
# Date: 2025-12-15

import os
import json
import zipfile
import argparse
import re
from pathlib import Path
from typing import Dict, Any, List, Tuple
from lxml import etree

# 基本XBRL名前空間
BASE_NAMESPACES = {
    'xbrli': 'http://www.xbrl.org/2003/instance'
}

def detect_namespaces(root: etree.Element) -> Dict[str, str]:
    """
    XBRLファイルから動的に名前空間を検出
    """
    namespaces = dict(BASE_NAMESPACES)
    
    # ルート要素の名前空間マップから検出
    for prefix, uri in root.nsmap.items():
        if prefix is None:
            continue
        
        # jppfs_cor, jpcrp_corの名前空間を検出
        if 'jppfs' in uri and 'jppfs_cor' in uri:
            namespaces['jppfs'] = uri
        elif 'jpcrp' in uri and 'jpcrp_cor' in uri:
            namespaces['jpcrp'] = uri
    
    return namespaces

def extract_xbrl_from_zip(zip_path: str, output_dir: str) -> str:
    """
    ZIPファイルからPublicDocのXBRLファイルを抽出
    """
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # PublicDocのXBRLファイルを検索
        xbrl_files = [f for f in zip_ref.namelist() if 'PublicDoc' in f and f.endswith('.xbrl')]
        if not xbrl_files:
            raise FileNotFoundError(f"PublicDoc XBRL file not found in {zip_path}")
        
        # 最初のXBRLファイルを抽出
        xbrl_name = xbrl_files[0]
        zip_ref.extract(xbrl_name, output_dir)
        return os.path.join(output_dir, xbrl_name)

def extract_value_from_xbrl(root: etree.Element, namespaces: Dict[str, str], tag_name: str, context_filter: str = 'Instant') -> float:
    """
    XBRLから指定タグの値を抽出（動的名前空間対応）
    """
    # 検索する名前空間の優先順位
    prefixes = ['jppfs', 'jpcrp']
    
    for prefix in prefixes:
        if prefix not in namespaces:
            continue
            
        elements = root.findall(f'.//dict:{tag_name}'.replace('dict', prefix), namespaces)
        
        for elem in elements:
            context_ref = elem.get('contextRef', '')
            # 最新期間のデータを優先（Interim/Current）
            if context_filter in context_ref:
                try:
                    val = float(elem.text) if elem.text else 0.0
                    if val != 0.0:
                        return val
                except ValueError:
                    continue
    
    return 0.0

def parse_balance_sheet(xbrl_path: str, company_code: str) -> Dict[str, Any]:
    """
    貸借対照表（BS）を解析（動的名前空間対応）
    """
    tree = etree.parse(xbrl_path)
    root = tree.getroot()
    
    # 動的に名前空間を検出
    namespaces = detect_namespaces(root)
    
    # contextRefから日付を抽出
    contexts = root.findall('.//xbrli:context', namespaces)
    date = "2025-09-30"  # デフォルト値
    for ctx in contexts:
        if 'Interim' in ctx.get('id', ''):
            instant = ctx.find('.//xbrli:instant', namespaces)
            if instant is not None and instant.text:
                date = instant.text
                break
        elif 'Current' in ctx.get('id', ''): # Annual
             instant = ctx.find('.//xbrli:instant', namespaces)
             if instant is not None and instant.text:
                date = instant.text
                break

    # 発行済株式数の取得（複数のタグを試行）
    issued_shares = extract_value_from_xbrl(root, namespaces, 'TotalNumberOfIssuedShares', 'Instant')
    if issued_shares == 0.0:
        issued_shares = extract_value_from_xbrl(root, namespaces, 'TotalNumberOfIssuedSharesSummaryOfBusinessResults', 'Instant')
    if issued_shares == 0.0:
        issued_shares = extract_value_from_xbrl(root, namespaces, 'NumberOfIssuedSharesAsOfFiscalYearEndIssuedSharesTotalNumberOfSharesEtc', 'Instant')

    # 1年内返済予定の固定負債（複数のタグを試行）
    current_portion_debt = extract_value_from_xbrl(root, namespaces, 'CurrentPortionOfNoncurrentLiabilities', 'Instant')
    if current_portion_debt == 0.0:
        # 個別の項目を合算（社債 + 長期借入金）
        cp_bonds = extract_value_from_xbrl(root, namespaces, 'CurrentPortionOfBonds', 'Instant')
        cp_loans = extract_value_from_xbrl(root, namespaces, 'CurrentPortionOfLongTermLoansPayable', 'Instant')
        current_portion_debt = cp_bonds + cp_loans

    bs_data = {
        'date': date,
        'companyCode': company_code,
        'currentAssets': extract_value_from_xbrl(root, namespaces, 'CurrentAssets', 'Instant') / 1_000_000,  # 百万円
        'nonCurrentAssets': extract_value_from_xbrl(root, namespaces, 'NoncurrentAssets', 'Instant') / 1_000_000,
        'totalAssets': extract_value_from_xbrl(root, namespaces, 'Assets', 'Instant') / 1_000_000,
        'currentLiabilities': extract_value_from_xbrl(root, namespaces, 'CurrentLiabilities', 'Instant') / 1_000_000,
        'nonCurrentLiabilities': extract_value_from_xbrl(root, namespaces, 'NoncurrentLiabilities', 'Instant') / 1_000_000,
        'totalLiabilities': extract_value_from_xbrl(root, namespaces, 'Liabilities', 'Instant') / 1_000_000,
        'equity': extract_value_from_xbrl(root, namespaces, 'NetAssets', 'Instant') / 1_000_000,
        'interestBearingDebt': extract_value_from_xbrl(root, namespaces, 'BondsPayable', 'Instant') / 1_000_000,
        'cashAndDeposits': extract_value_from_xbrl(root, namespaces, 'CashAndDeposits', 'Instant') / 1_000_000,
        'currentPortionOfNoncurrentLiabilities': current_portion_debt / 1_000_000,
        'issuedShares': issued_shares
    }
    
    return bs_data

def parse_profit_loss(xbrl_path: str, company_code: str) -> Dict[str, Any]:
    """
    損益計算書（PL）を解析（動的名前空間対応）
    """
    tree = etree.parse(xbrl_path)
    root = tree.getroot()
    
    # 動的に名前空間を検出
    namespaces = detect_namespaces(root)
    
    # contextRefから日付を抽出
    contexts = root.findall('.//xbrli:context', namespaces)
    date = "2025-09-30"  # デフォルト値
    for ctx in contexts:
        if 'InterimDuration' in ctx.get('id', ''):
            end = ctx.find('.//xbrli:endDate', namespaces)
            if end is not None and end.text:
                date = end.text
                break
        elif 'CurrentYearDuration' in ctx.get('id', ''): # Annual
            end = ctx.find('.//xbrli:endDate', namespaces)
            if end is not None and end.text:
                date = end.text
                break
    
    # 売上高（電気事業営業収益） - 動的名前空間対応
    revenue_elements = root.findall('.//jppfs:ElectricUtilityOperatingRevenueELE', namespaces) if 'jppfs' in namespaces else []
    revenue = 0.0
    for elem in revenue_elements:
        if 'Duration' in elem.get('contextRef', ''):
            try:
                revenue = float(elem.text) if elem.text else 0.0
                break
            except ValueError:
                continue
    
    # 営業利益
    operating_income = extract_value_from_xbrl(root, namespaces, 'OperatingIncome', 'Duration')
    
    # 経常利益
    ordinary_income = extract_value_from_xbrl(root, namespaces, 'OrdinaryIncome', 'Duration')
    
    # 支払利息（営業外費用を優先）
    interest_expenses = extract_value_from_xbrl(root, namespaces, 'InterestExpensesNOE', 'Duration')
    if interest_expenses == 0.0:
        interest_expenses = extract_value_from_xbrl(root, namespaces, 'InterestExpenses', 'Duration')
    
    # 当期純利益
    net_income = extract_value_from_xbrl(root, namespaces, 'ProfitLoss', 'Duration')
    if net_income == 0.0:
        net_income = extract_value_from_xbrl(root, namespaces, 'ProfitLossAttributableToOwnersOfParent', 'Duration')
    
    # 減価償却費（営業活動によるキャッシュフロー計算書から取得）
    depreciation = extract_value_from_xbrl(root, namespaces, 'DepreciationAndAmortizationOpeCF', 'Duration')
    if depreciation == 0.0:
        # 別のタグ名も試行
        depreciation = extract_value_from_xbrl(root, namespaces, 'DepreciationAndAmortization', 'Duration')
    
    # 営業活動によるキャッシュフロー
    operating_cf = extract_value_from_xbrl(root, namespaces, 'NetCashProvidedByUsedInOperatingActivities', 'Duration')

    # EBITDA = 営業利益 + 減価償却費
    ebitda = operating_income + depreciation
    
    pl_data = {
        'date': date,
        'companyCode': company_code,
        'revenue': revenue / 1_000_000,  # 百万円
        'operatingIncome': operating_income / 1_000_000,
        'ordinaryIncome': ordinary_income / 1_000_000,
        'interestExpenses': interest_expenses / 1_000_000,
        'netIncome': net_income / 1_000_000,
        'ebitda': ebitda / 1_000_000,
        'depreciation': depreciation / 1_000_000,
        'operatingCashFlow': operating_cf / 1_000_000
    }
    
    return pl_data

def main():
    parser = argparse.ArgumentParser(description='XBRL解析スクリプト')
    parser.add_argument('--input', default='XBRL', help='入力ディレクトリ（デフォルト: XBRL）')
    parser.add_argument('--output', default='data/edinet_parsed', help='出力ディレクトリ（デフォルト: data/edinet_parsed）')
    args = parser.parse_args()
    
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"XBRLデータ解析開始: {input_dir}")
    
    # 企業コードマッピング
    company_mapping = {
        'E04498': 'TEPCO',  # 東京電力HD
        'E04502': 'CHUBU',  # 中部電力
        'E34837': 'JERA',   # JERA
    }
    
    for company_code, company_name in company_mapping.items():
        company_dir = input_dir / company_code
        if not company_dir.exists():
            print(f"⚠ {company_name} ({company_code}) のデータが見つかりません。スキップします。")
            continue
        
        print(f"\n{company_name} ({company_code}) を処理中...")
        
        # ZIPファイルを検索
        zip_files = list(company_dir.glob('*.zip'))
        if not zip_files:
            print(f"⚠ ZIPファイルが見つかりません。")
            continue
        
        financials = []
        
        for zip_path in sorted(zip_files):
            print(f"  ZIP: {zip_path.name}")
            
            try:
                # XBRL抽出
                temp_dir = output_dir / f"{company_code}_temp"
                temp_dir.mkdir(parents=True, exist_ok=True)
                xbrl_file = extract_xbrl_from_zip(str(zip_path), str(temp_dir))
                # print(f"  XBRL: {Path(xbrl_file).name}")
                
                # 貸借対照表解析
                bs_data = parse_balance_sheet(xbrl_file, company_code)
                
                # 損益計算書解析
                pl_data = parse_profit_loss(xbrl_file, company_code)
                
                financials.append({
                    'date': bs_data['date'],
                    'bs': bs_data,
                    'pl': pl_data
                })
                
                # 一時ディレクトリ削除
                import shutil
                shutil.rmtree(temp_dir)
                
            except Exception as e:
                print(f"  ❌ エラー: {str(e)}")
                continue
        
        # 結果を保存
        output_file = output_dir / f"{company_name}_financials.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(financials, f, ensure_ascii=False, indent=2)
        print(f"  ✓ 解析結果保存: {output_file}")

        # CSV保存
        csv_file = output_dir / f"{company_name}_financials.csv"
        if financials:
            import csv
            # ヘッダー作成 (日付 + BSキー + PLキー)
            # 最初の要素からキーを取得
            first_item = financials[0]
            bs_keys = [k for k in first_item['bs'].keys() if k not in ['date', 'companyCode']]
            pl_keys = [k for k in first_item['pl'].keys() if k not in ['date', 'companyCode']]
            
            headers = ['date'] + [f"bs_{k}" for k in bs_keys] + [f"pl_{k}" for k in pl_keys]
            
            with open(csv_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                
                for item in financials:
                    row = [item['date']]
                    # BS values
                    for k in bs_keys:
                        row.append(item['bs'].get(k, ''))
                    # PL values
                    for k in pl_keys:
                        row.append(item['pl'].get(k, ''))
                    writer.writerow(row)
            print(f"  ✓ CSV保存: {csv_file}")
    
    print(f"\n✓ XBRL解析完了: {output_dir}")

if __name__ == '__main__':
    main()
