# KPIスコアリングスクリプト
# Version: 1.0.0
# Date: 2025-12-15

import json
import argparse
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

def calculate_roe(bs_data: Dict[str, Any], pl_data: Dict[str, Any]) -> float:
    """ROE（自己資本利益率）を計算"""
    net_income = pl_data.get('netIncome', 0)
    equity = bs_data.get('equity', 0)
    return (net_income / equity * 100) if equity > 0 else 0.0

def calculate_equity_ratio(bs_data: Dict[str, Any]) -> float:
    """自己資本比率を計算"""
    equity = bs_data.get('equity', 0)
    total_assets = bs_data.get('totalAssets', 0)
    return (equity / total_assets * 100) if total_assets > 0 else 0.0

def calculate_dscr(pl_data: Dict[str, Any], bs_data: Dict[str, Any]) -> float:
    """DSCR（債務返済能力）を計算"""
    # 営業CF
    operating_cf = pl_data.get('operatingCashFlow', 0)
        
    # 年間返済額 = 1年内返済予定の固定負債 + 支払利息
    # 推定値（有利子負債の10%など）は使用しない
    current_portion_debt = bs_data.get('currentPortionOfNoncurrentLiabilities', 0)
    interest_expenses = pl_data.get('interestExpenses', 0)
    
    debt_service = current_portion_debt + interest_expenses
    
    return (operating_cf / debt_service) if debt_service > 0 else 0.0

def evaluate_score(value: float, thresholds: Dict[str, float]) -> str:
    """閾値に基づいてスコア評価"""
    if value >= thresholds['green']:
        return 'green'
    elif value >= thresholds['yellow']:
        return 'yellow'
    else:
        return 'red'

def determine_period(date_str: str) -> str:
    """日付から期間（Annual, Q1, Q2, Q3）を判定"""
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d')
        month = date.month
        
        # 3月決算企業を想定
        if month in [4, 5, 6]:
            return 'Annual' # 前年度末 (3/31) のデータが6月に提出される
        elif month in [7, 8, 9]:
            return 'Q1' # 6/30 のデータが8月に提出される -> Q1
        elif month in [10, 11, 12]:
            return 'Q2' # 9/30 のデータが11月に提出される -> Q2
        elif month in [1, 2, 3]:
            return 'Q3' # 12/31 のデータが2月に提出される -> Q3
        else:
            return 'Annual'
    except:
        return 'Annual'

def main():
    parser = argparse.ArgumentParser(description='KPIスコアリングスクリプト')
    parser.add_argument('--input', default='data/edinet_parsed', help='入力ディレクトリ（デフォルト: data/edinet_parsed）')
    parser.add_argument('--targets', default='public/data/kpi_targets.json', help='閾値定義ファイル（デフォルト: public/data/kpi_targets.json）')
    parser.add_argument('--output', default='data/scorecards.json', help='出力ファイル（デフォルト: data/scorecards.json）')
    args = parser.parse_args()
    
    input_dir = Path(args.input)
    targets_file = Path(args.targets)
    output_file = Path(args.output)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # 閾値定義を読み込み（複数の場所を試行）
    if not targets_file.exists():
        # フォールバック: public/data/kpi_targets.json
        targets_file = Path('public/data/kpi_targets.json')
    if not targets_file.exists():
        # フォールバック2: data/kpi_targets.json
        targets_file = Path('data/kpi_targets.json')
    
    with open(targets_file, 'r', encoding='utf-8') as f:
        targets_config = json.load(f)
    
    # 閾値を辞書形式に変換
    targets = {}
    for threshold in targets_config['thresholds']:
        kpi_name = threshold['kpiName']
        targets[kpi_name] = {
            'green': threshold['greenThreshold'],
            'yellow': threshold['yellowThreshold']
        }
    
    print(f"KPIスコアリング開始: {input_dir}")
    
    scorecard_data = {
        'asOf': datetime.now().strftime('%Y-%m-%d'),
        'companies': {}
    }
    
    companies = ['TEPCO', 'CHUBU', 'JERA']
    
    for company_name in companies:
        # 新しい形式のファイルをチェック
        financials_file = input_dir / f"{company_name}_financials.json"
        
        # 古い形式のファイルもチェック（互換性のため）
        bs_file = input_dir / f"{company_name}_bs.json"
        pl_file = input_dir / f"{company_name}_pl.json"
        
        financials = []
        
        if financials_file.exists():
            with open(financials_file, 'r', encoding='utf-8') as f:
                financials = json.load(f)
        elif bs_file.exists() and pl_file.exists():
            with open(bs_file, 'r', encoding='utf-8') as f:
                bs_data = json.load(f)
            with open(pl_file, 'r', encoding='utf-8') as f:
                pl_data = json.load(f)
            financials = [{'date': bs_data.get('date', '2025-09-30'), 'bs': bs_data, 'pl': pl_data}]
        else:
            print(f"⚠ {company_name} のデータが見つかりません。スキップします。")
            continue
        
        print(f"\n{company_name} を処理中... ({len(financials)} 件)")
        
        company_scores = {}
        
        # 日付でソート（新しい順）
        financials.sort(key=lambda x: x['date'], reverse=True)
        
        for item in financials:
            bs_data = item['bs']
            pl_data = item['pl']
            date_str = item['date']
            
            # KPI計算
            roe = calculate_roe(bs_data, pl_data)
            equity_ratio = calculate_equity_ratio(bs_data)
            dscr = calculate_dscr(pl_data, bs_data)
            
            # スコア評価
            roe_score = evaluate_score(roe, targets['roe'])
            equity_ratio_score = evaluate_score(equity_ratio, targets['equityRatio'])
            dscr_score = evaluate_score(dscr, targets['dscr'])
            
            score_entry = {
                'date': date_str,
                'companyCode': bs_data.get('companyCode', ''),
                'roe': {'value': round(roe, 2), 'score': roe_score, 'change': 0},
                'equityRatio': {'value': round(equity_ratio, 2), 'score': equity_ratio_score, 'change': 0},
                'dscr': {'value': round(dscr, 2), 'score': dscr_score, 'change': 0},
            }
            
            # 期間判定（簡易ロジック）
            # 実際にはXBRLのコンテキストから判定すべきだが、ここでは日付から推測
            # 3/31 -> Annual, 6/30 -> Q1, 9/30 -> Q2, 12/31 -> Q3
            # ただし、提出日ではなく対象期間末日が必要。
            # parse_edinet_xbrl.py で抽出した date は対象期間末日（Instant/EndDate）
            
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                month = date_obj.month
                if month == 3:
                    period = 'Annual'
                elif month == 6:
                    period = 'Q1'
                elif month == 9:
                    period = 'Q2'
                elif month == 12:
                    period = 'Q3'
                else:
                    period = 'Annual' # デフォルト
            except:
                period = 'Annual'
            
            # 同じ期間が複数ある場合は最新を優先（リストは新しい順なので最初に見つかったもの）
            if period not in company_scores:
                company_scores[period] = score_entry
        
        # 最新データをトップレベルに配置（互換性のため、またはデフォルト表示用）
        if financials:
            company_scores['latest'] = company_scores.get('Annual') or company_scores.get('Q2') or list(company_scores.values())[0]
            
        scorecard_data['companies'][company_name] = company_scores
        
        latest = company_scores.get('latest')
        if latest:
            print(f"  ✓ 最新データ ({latest['date']}):")
            print(f"    ROE: {latest['roe']['value']}%")
            print(f"    自己資本比率: {latest['equityRatio']['value']}%")
            print(f"    DSCR: {latest['dscr']['value']}x")
    
    # JSON保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(scorecard_data, f, ensure_ascii=False, indent=2)
    
    # publicにも保存
    public_output = Path('public/data/scorecards.json')
    public_output.parent.mkdir(parents=True, exist_ok=True)
    with open(public_output, 'w', encoding='utf-8') as f:
        json.dump(scorecard_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ KPIスコアリング完了: {output_file}")

if __name__ == '__main__':
    main()
