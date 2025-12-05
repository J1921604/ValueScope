# 企業価値計算スクリプト
# Version: 1.0.0
# Date: 2025-12-15

import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
import traceback

def load_stock_prices(company: str) -> Optional[pd.DataFrame]:
    """株価データを読み込む"""
    symbol_map = {'TEPCO': '9501.T', 'CHUBU': '9502.T'}
    symbol = symbol_map.get(company)
    if not symbol:
        return None
    
    csv_path = Path(f'data/prices/{symbol}.csv')
    if not csv_path.exists():
        return None
    
    try:
        df = pd.read_csv(csv_path, comment='#')
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)
        df.sort_index(inplace=True)
        return df
    except Exception as e:
        print(f"Error loading stock prices for {company}: {e}")
        return None

def get_stock_price(df: pd.DataFrame, date_str: str) -> Optional[float]:
    """指定日（または直前営業日）の終値を取得"""
    if df is None:
        return None
    
    target_date = pd.to_datetime(date_str)
    
    if target_date < df.index[0] or target_date > datetime.now():
        return None

    try:
        idx = df.index.get_indexer([target_date], method='pad')[0]
        if idx == -1:
            return None
        
        found_date = df.index[idx]
        if (target_date - found_date).days > 10:
            return None
            
        return float(df.iloc[idx]['Close'])
    except Exception:
        return None

def calculate_enterprise_value(bs_data: Dict[str, Any], pl_data: Dict[str, Any], market_cap: Optional[float]) -> Dict[str, Any]:
    """
    企業価値（EV）と関連指標を計算
    """
    # 純有利子負債 = 有利子負債 - 現金及び預金
    interest_bearing_debt = bs_data.get('interestBearingDebt', 0)
    cash = bs_data.get('cashAndDeposits', 0)
    net_debt = interest_bearing_debt - cash
    
    # EBITDA
    ebitda = pl_data.get('ebitda', 0)
    net_income = pl_data.get('netIncome', 0)
    equity = bs_data.get('equity', 0)

    enterprise_value = None
    ev_ebitda = None
    per = None
    pbr = None

    if market_cap is not None:
        # 企業価値（EV） = 時価総額 + 純有利子負債
        enterprise_value = market_cap + net_debt
        
        # EV/EBITDA倍率
        ev_ebitda = enterprise_value / ebitda if ebitda > 0 else 0
        
        # PER（株価収益率） = 時価総額 / 当期純利益
        per = market_cap / net_income if net_income > 0 else 0
        
        # PBR（株価純資産倍率） = 時価総額 / 純資産
        pbr = market_cap / equity if equity > 0 else 0
    
    return {
        'date': bs_data.get('date', '2025-09-30'),
        'marketCap': market_cap,
        'interestBearingDebt': interest_bearing_debt,
        'cashAndDeposits': cash,
        'netDebt': net_debt,
        'enterpriseValue': enterprise_value,
        'ebitda': ebitda,
        'evEbitdaRatio': ev_ebitda,
        'netIncome': net_income,
        'per': per,
        'equity': equity,
        'pbr': pbr,
    }

def main():
    parser = argparse.ArgumentParser(description='企業価値計算スクリプト')
    parser.add_argument('--input', default='data/edinet_parsed', help='入力ディレクトリ（デフォルト: data/edinet_parsed）')
    parser.add_argument('--output', default='data/valuation.json', help='出力ファイル（デフォルト: data/valuation.json）')
    args = parser.parse_args()
    
    input_dir = Path(args.input)
    output_file = Path(args.output)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"企業価値計算開始: {input_dir}")
    
    valuation_data = {
        'asOf': datetime.now().strftime('%Y-%m-%d'),
        'companies': {}
    }
    
    companies = ['TEPCO', 'CHUBU', 'JERA']
    
    for company_name in companies:
        financials_file = input_dir / f"{company_name}_financials.json"
        
        if not financials_file.exists():
            print(f"⚠ {company_name} のデータが見つかりません。スキップします。")
            continue
        
        print(f"\n{company_name} を処理中...")
        
        with open(financials_file, 'r', encoding='utf-8') as f:
            financials = json.load(f)
            
        # 最新のAnnualデータを取得
        annual_records = [r for r in financials if r['date'].endswith('03-31')]
        if not annual_records:
            print(f"  ⚠ Annualデータがありません。")
            continue
            
        latest_record = sorted(annual_records, key=lambda x: x['date'])[-1]
        bs_data = latest_record['bs']
        pl_data = latest_record['pl']
        
        # 株価取得
        stock_df = load_stock_prices(company_name)
        stock_price = get_stock_price(stock_df, latest_record['date'])
        
        market_cap = None
        if stock_price is not None and bs_data.get('issuedShares'):
             market_cap = stock_price * bs_data['issuedShares'] / 1_000_000 # 百万円
        
        company_valuation = calculate_enterprise_value(bs_data, pl_data, market_cap)
        valuation_data['companies'][company_name] = company_valuation
        
        ev_disp = f"¥{company_valuation['enterpriseValue']:,.0f} 百万円" if company_valuation['enterpriseValue'] is not None else "N/A"
        print(f"  ✓ EV: {ev_disp}")
    
    # JSON保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(valuation_data, f, ensure_ascii=False, indent=2)
    
    # publicにも保存
    public_output = Path('public/data/valuation.json')
    public_output.parent.mkdir(parents=True, exist_ok=True)
    with open(public_output, 'w', encoding='utf-8') as f:
        json.dump(valuation_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 企業価値計算完了: {output_file}")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        traceback.print_exc()
