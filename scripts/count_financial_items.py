#!/usr/bin/env python3
"""
財務3表のCSVファイルから項目数をカウント
CSVは横長フォーマット: 列名が項目名
"""

from pathlib import Path
import pandas as pd

def count_csv_items():
    base_path = Path('XBRL_output')
    companies = ['TEPCO', 'CHUBU', 'JERA']
    statements = ['PL', 'BS', 'CF']
    
    counts = {}
    
    for statement in statements:
        all_columns = set()
        
        for company in companies:
            csv_file = base_path / company / f'{statement}.csv'
            if not csv_file.exists():
                print(f"⚠️ File not found: {csv_file}")
                continue
            
            df = pd.read_csv(csv_file, encoding='utf-8')
            
            # 列名が項目名（fiscal_year, date, company_codeを除く）
            columns = [col for col in df.columns if col not in ['fiscal_year', 'date', 'company_code']]
            all_columns.update(columns)
            
            print(f"{company} {statement}: {len(columns)} columns")
        
        counts[statement] = len(all_columns)
        print(f"\n{statement} 合計ユニーク項目数: {counts[statement]}")
        print("=" * 60)
    
    print("\n【最終集計】")
    print(f"PL: {counts.get('PL', 0)} 項目")
    print(f"BS: {counts.get('BS', 0)} 項目")
    print(f"CF: {counts.get('CF', 0)} 項目")
    print(f"総計: {sum(counts.values())} 項目")
    
    # 目標との比較
    targets = {'PL': 398, 'BS': 273, 'CF': 118}
    print("\n【目標との差異】")
    for statement, target in targets.items():
        actual = counts.get(statement, 0)
        diff = actual - target
        status = "✅" if diff >= 0 else "❌"
        print(f"{statement}: 実際 {actual} vs 目標 {target} (差分: {diff:+d}) {status}")

if __name__ == '__main__':
    count_csv_items()
