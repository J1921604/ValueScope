#!/usr/bin/env python3
"""
不適切な日本語ラベルを修正
"""

from pathlib import Path
import re

def fix_labels():
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    # 修正するラベル
    fixes = {
        # GrossProfit: 「総」→「売上総利益」
        "GrossProfit: '総',": "GrossProfit: '売上総利益',",
        # IncomeTaxExpense: 「利益」→「法人税等費用」
        "IncomeTaxExpense: '利益',": "IncomeTaxExpense: '法人税等費用',",
        # CONSIGNMENTCHARGECALCULATION: 空白ではなく適切な和訳
        "CONSIGNMENTCHARGECALCULATION: 'CONSIGNMENTCHARGECALCULATION',": "CONSIGNMENTCHARGECALCULATION: '委託料計算',",
        # NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults: 和訳
        "NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults: 'NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults',": 
        "NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults: '投資活動によるキャッシュフロー',",
    }
    
    modified = False
    for old, new in fixes.items():
        if old in content:
            content = content.replace(old, new)
            modified = True
            print(f"✅ Fixed: {old.split(':')[0]}")
    
    if modified:
        tsx_path.write_text(content, encoding='utf-8')
        print(f"\n✅ Updated fieldLabelMap in {tsx_path}")
    else:
        print("⚠️ No fixes applied (labels may already be correct)")

if __name__ == '__main__':
    fix_labels()
