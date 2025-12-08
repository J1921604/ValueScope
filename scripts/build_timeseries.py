#!/usr/bin/env python3
import sys
import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
try:
    import pandas as pd
except ImportError:
    print("pandas not found")
    sys.exit(1)

def load_json(path: Path) -> Optional[Any]:
    if not path.exists():
        return None
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as exc:
        print(f"⚠ JSON読込に失敗: {path} ({exc})")
        return None


def load_financials(company: str) -> List[Dict[str, Any]]:
    """財務データを読み込む"""
    file_path = Path(f'data/edinet_parsed/{company}_financials.json')
    if not file_path.exists():
        return []
    
    data = load_json(file_path)
    return data if isinstance(data, list) else []

def load_stock_prices(company: str) -> Optional[pd.DataFrame]:
    """株価データを読み込む"""
    # マッピング: TEPCO -> 9501.T, CHUBU -> 9502.T
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
        # 重複排除
        df = df[~df.index.duplicated(keep='last')]
        return df
    except Exception as e:
        print(f"Error loading stock prices for {company}: {e}")
        return None

def get_stock_price(df: pd.DataFrame, date_str: str) -> Optional[float]:
    """指定日（または直前営業日）の終値を取得"""
    if df is None or df.empty:
        return None
    
    try:
        target_date = pd.to_datetime(date_str)
        
        # データ範囲外チェック (古いデータは無視)
        if target_date < df.index[0]:
            return None
            
        # asofを使って直近の過去データを取得
        # df.index must be sorted
        found_date = df.index.asof(target_date)
        
        if pd.isna(found_date):
            return None
        
        # 日付が離れすぎていないかチェック（例: 10日以内）
        if (target_date - found_date).days > 10:
            return None
            
        return float(df.loc[found_date]['Close'])
    except Exception as e:
        print(f"Error getting stock price for {date_str}: {e}")
        return None

def calculate_kpi(record: Dict[str, Any], stock_df: Optional[pd.DataFrame]) -> Dict[str, Any]:
    """KPI計算（電力業界特化版）"""
    bs = record['bs']
    pl = record['pl']
    date_str = record['date']
    
    # ROIC計算（投下資本利益率）
    # ROIC = EBIT / (自己資本 + 有利子負債) × 100
    ebit = pl.get('operatingIncome', 0.0)  # 営業利益 ≈ EBIT
    invested_capital = bs['equity'] + bs['interestBearingDebt']
    roic = (ebit / invested_capital * 100) if invested_capital > 0 else 0.0
    
    # WACC計算（加重平均資本コスト）
    # WACC = (E/V × Re) + (D/V × Rd × (1-T))
    # E: 自己資本, D: 有利子負債, V: E+D, Re: 株主資本コスト（仮定6%）, Rd: 負債コスト, T: 税率（仮定30%）
    total_capital = bs['equity'] + bs['interestBearingDebt']
    if total_capital > 0:
        equity_ratio_wacc = bs['equity'] / total_capital
        debt_ratio_wacc = bs['interestBearingDebt'] / total_capital
        cost_of_equity = 6.0  # 株主資本コスト（仮定6%）
        interest_expenses = pl.get('interestExpenses', 0.0)
        cost_of_debt = (interest_expenses / bs['interestBearingDebt'] * 100) if bs['interestBearingDebt'] > 0 else 0.0
        tax_rate = 0.30  # 法人実効税率（仮定30%）
        wacc = (equity_ratio_wacc * cost_of_equity) + (debt_ratio_wacc * cost_of_debt * (1 - tax_rate))
    else:
        wacc = 0.0
    
    # EBITDAマージン計算
    # EBITDAマージン = EBITDA / 売上高 × 100
    ebitda = pl.get('ebitda', 0.0)
    revenue = pl.get('revenue', 0.0)
    ebitda_margin = (ebitda / revenue * 100) if revenue > 0 else 0.0
    
    # FCFマージン計算
    # FCFマージン = 営業CF / 売上高 × 100
    operating_cf = pl.get('operatingCashFlow', 0.0)
    fcf_margin = (operating_cf / revenue * 100) if revenue > 0 else 0.0
    
    # 営業CF（実データ優先）
    operating_cash_flow = operating_cf
    if operating_cash_flow == 0.0:
        # 実データがない場合は0とする（推定値排除）
        pass
    
    # 株価・時価総額・EV
    stock_price = get_stock_price(stock_df, date_str)
    issued_shares = bs.get('issuedShares', 0.0)
    
    market_cap = None
    enterprise_value = None
    ev_ebitda_ratio = None
    per = None
    pbr = None
    
    if stock_price is not None and issued_shares > 0:
        # 時価総額 = 株価 * 発行済株式数
        # bs['issuedShares'] は株数
        # market_cap は百万円単位に合わせるため / 1,000,000
        market_cap_val = stock_price * issued_shares
        market_cap = market_cap_val / 1_000_000 # 百万円
        
        net_debt = bs['interestBearingDebt'] - bs['cashAndDeposits']
        enterprise_value = market_cap + net_debt
        
        ev_ebitda_ratio = (enterprise_value / pl['ebitda']) if pl['ebitda'] > 0 else 0.0
        per = (market_cap / pl['netIncome']) if pl['netIncome'] > 0 else 0.0
        pbr = (market_cap / bs['equity']) if bs['equity'] > 0 else 0.0
    else:
        # 非上場またはデータ不足
        net_debt = bs['interestBearingDebt'] - bs['cashAndDeposits']
        # EV計算不可
    
    # 出力用辞書作成（Noneはnullとして出力される）
    result = {
        'date': record['date'],
        'roic': round(roic, 2),
        'wacc': round(wacc, 2),
        'ebitdaMargin': round(ebitda_margin, 2),
        'fcfMargin': round(fcf_margin, 2),
        'interestBearingDebt': round(bs['interestBearingDebt'] / 100, 0), # 億円単位
        'cashAndDeposits': round(bs['cashAndDeposits'] / 100, 0), # 億円単位
        'netDebt': round(net_debt / 100, 0), # 億円単位
        'operatingCashFlow': round(operating_cash_flow / 100, 0), # 億円単位
        'ebitda': round(pl['ebitda'] / 100, 0), # 億円単位
        'netIncome': round(pl['netIncome'] / 100, 0), # 億円単位
        'equity': round(bs['equity'] / 100, 0), # 億円単位
    }
    
    # Optional項目の追加
    if enterprise_value is not None:
        result['enterpriseValue'] = round(enterprise_value / 100, 0) # 億円
    else:
        result['enterpriseValue'] = None
        
    if market_cap is not None:
        result['marketCap'] = round(market_cap / 100, 0) # 億円
    else:
        result['marketCap'] = None
        
    if ev_ebitda_ratio is not None:
        result['evEbitdaRatio'] = round(ev_ebitda_ratio, 2)
    else:
        result['evEbitdaRatio'] = None
        
    if per is not None:
        result['per'] = round(per, 2)
    else:
        result['per'] = None
        
    if pbr is not None:
        result['pbr'] = round(pbr, 2)
    else:
        result['pbr'] = None
        
    if stock_price is not None:
        result['stockPrice'] = stock_price
    else:
        result['stockPrice'] = None

    return result

def build_timeseries(companies: List[str]) -> Dict[str, Any]:
    """時系列データ構築"""
    result = {}
    
    for company in companies:
        financials = load_financials(company)
        stock_df = load_stock_prices(company)
        
        if not financials:
            print(f"⚠ {company}のデータが見つかりません。")
            continue
        
        print(f"{company}を処理中... ({len(financials)} レコード)")
        
        # 年度別データを抽出（Annual＝03-31決算のみ）
        annual_records = [r for r in financials if r['date'].endswith('03-31')]
        
        # 時系列データを構築
        timeseries = []
        for record in sorted(annual_records, key=lambda x: x['date']):
            try:
                kpi = calculate_kpi(record, stock_df)
                # 日付をJavaScript互換フォーマットに変換
                date_obj = datetime.strptime(record['date'], '%Y-%m-%d')
                timeseries.append({
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'year': date_obj.year,
                    **kpi
                })
            except Exception as e:
                print(f"  ⚠ {record['date']}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        result[company] = timeseries
        print(f"  ✓ {len(timeseries)} 年分のデータ生成")
    
    return result

def build_valuation_snapshot(companies: List[str]) -> Dict[str, Any]:
    """最新の企業価値スナップショットを作成"""
    valuation_data = {
        'asOf': datetime.now().strftime('%Y-%m-%d'),
        'companies': {}
    }
    
    for company in companies:
        financials = load_financials(company)
        stock_df = load_stock_prices(company)
        
        if not financials:
            continue
            
        annual_records = [r for r in financials if r['date'].endswith('03-31')]
        if not annual_records:
            continue
            
        latest_record = sorted(annual_records, key=lambda x: x['date'])[-1]
        bs = latest_record['bs']
        pl = latest_record['pl']
        date_str = latest_record['date']
        
        stock_price = get_stock_price(stock_df, date_str)
        market_cap = None
        if stock_price is not None and bs.get('issuedShares'):
             market_cap = stock_price * bs['issuedShares'] / 1_000_000 # 百万円
        
        # 計算
        interest_bearing_debt = bs.get('interestBearingDebt', 0)
        cash = bs.get('cashAndDeposits', 0)
        net_debt = interest_bearing_debt - cash
        ebitda = pl.get('ebitda', 0)
        net_income = pl.get('netIncome', 0)
        equity = bs.get('equity', 0)
        
        enterprise_value = None
        ev_ebitda = None
        per = None
        pbr = None
        
        if market_cap is not None:
            enterprise_value = market_cap + net_debt
            ev_ebitda = enterprise_value / ebitda if ebitda > 0 else 0
            per = market_cap / net_income if net_income > 0 else 0
            pbr = market_cap / equity if equity > 0 else 0
            
        valuation_data['companies'][company] = {
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
            'dividendYield': 0, # 配当情報は現在ない
            'eps': 0, # EPS情報は現在ない
            'bps': 0, # BPS情報は現在ない
        }
        
    return valuation_data

def main():
    companies = ['TEPCO', 'CHUBU', 'JERA']
    
    print("=== 時系列データ生成開始 ===\n")
    
    timeseries_data = build_timeseries(companies)
    valuation_data = build_valuation_snapshot(companies)

    public_dir = Path('public/data')
    public_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = Path('data')
    cache_dir.mkdir(parents=True, exist_ok=True)

    def has_payload_data(name: str, data: Dict[str, Any]) -> bool:
        if not isinstance(data, dict):
            return False
        if name == 'valuation.json':
            companies = data.get('companies')
            if isinstance(companies, dict):
                return any(bool(value) for value in companies.values())
            return False
        return any(bool(value) for value in data.values())

    def ensure_data(name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if has_payload_data(name, data):
            return data
        fallback_path = public_dir / name
        fallback = load_json(fallback_path)
        if fallback:
            print(f"⚠ {name}を既存データで維持 (新規データが空のため)")
            return fallback
        fallback_path = cache_dir / name
        fallback = load_json(fallback_path)
        if fallback:
            print(f"⚠ {name}をキャッシュデータで維持 (新規データが空のため)")
            return fallback
        print(f"⚠ {name}の新規データが空ですが、既存データも見つかりませんでした")
        return data

    timeseries_data = ensure_data('timeseries.json', timeseries_data)
    valuation_data = ensure_data('valuation.json', valuation_data)
    
    # timeseries.json 保存
    output_file = cache_dir / 'timeseries.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(timeseries_data, f, ensure_ascii=False, indent=2)
    
    public_output_file = public_dir / 'timeseries.json'
    with open(public_output_file, 'w', encoding='utf-8') as f:
        json.dump(timeseries_data, f, ensure_ascii=False, indent=2)
    
    # valuation.json 保存
    val_output_file = cache_dir / 'valuation.json'
    with open(val_output_file, 'w', encoding='utf-8') as f:
        json.dump(valuation_data, f, ensure_ascii=False, indent=2)
        
    public_val_output_file = public_dir / 'valuation.json'
    with open(public_val_output_file, 'w', encoding='utf-8') as f:
        json.dump(valuation_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 時系列データ生成完了: {output_file}")
    print(f"✓ Public用データ保存: {public_output_file}")
    print(f"✓ Valuationデータ生成完了: {val_output_file}")

if __name__ == '__main__':
    main()
