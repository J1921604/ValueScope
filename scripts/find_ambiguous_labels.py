#!/usr/bin/env python3
"""曖昧な日本語ラベルを特定する"""

import re

# ComparisonFinancialTable.tsxを読み込む
with open('src/components/ComparisonFinancialTable.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# fieldLabelMapセクションを抽出
fieldlabel_match = re.search(r'const fieldLabelMap: Record<string, string> = \{(.*?)\n\};', content, re.DOTALL)
if not fieldlabel_match:
    print("❌ fieldLabelMapが見つかりません")
    exit(1)

fieldlabel_section = fieldlabel_match.group(1)

# 曖昧な日本語ラベルのパターン
ambiguous_patterns = {
    '～比率': [],
    '株式': [],
    '株主': [],
    'その他': [],
    '帳簿価額': [],
    '銘柄数': [],
    '株式数': [],
    '小数': [],  # ユーザーが指摘した役員人数の小数
    '評価': [],
}

# 各エントリを解析
pattern = r"^\s+([A-Za-z_][A-Za-z0-9_]*):\s*'([^']*)',?"

for line in fieldlabel_section.split('\n'):
    match = re.match(pattern, line)
    if match:
        key = match.group(1)
        value = match.group(2)
        
        # 曖昧なパターンをチェック
        for ambiguous, items in ambiguous_patterns.items():
            if ambiguous in value and len(value) <= 10:  # 短すぎる説明
                items.append((key, value))

print("\n🔍 曖昧な日本語ラベル検出結果")
print("="*80)
for pattern_name, items in ambiguous_patterns.items():
    if items:
        print(f"\n【{pattern_name}】 {len(items)}件")
        print("-"*80)
        for key, value in items[:20]:  # 最大20件表示
            print(f"  {key}: '{value}'")
        if len(items) > 20:
            print(f"  ... 他{len(items)-20}件")

# 特定のXBRLタグを検索（ユーザー指摘の項目）
print("\n\n🎯 ユーザー指摘項目の検索")
print("="*80)

# xbrlTagMap.tsも読み込む
try:
    with open('src/components/xbrlTagMap.ts', 'r', encoding='utf-8') as f:
        xbrl_content = f.read()
    
    # 役員人数
    if 'NumberOfDirectorsAndOtherOfficersRemunerationEtcByCategoryOfDirectorsAndOtherOfficers' in xbrl_content:
        print("✅ 役員人数タグ発見: NumberOfDirectorsAndOtherOfficersRemunerationEtcByCategoryOfDirectorsAndOtherOfficers")
        # 対応するfieldLabelMapエントリを検索
        for line in fieldlabel_section.split('\n'):
            if 'NumberOfDirectorsAndOtherOfficersRemunerationEtc' in line:
                print(f"   fieldLabelMap: {line.strip()}")
    
    # 比率
    if 'AllEmployeesRatioOfMaleEmployeesTakingChildcareLeaveMetricsOfConsolidatedSubsidiaries' in xbrl_content:
        print("✅ 比率タグ発見: AllEmployeesRatioOfMaleEmployeesTakingChildcareLeaveMetricsOfConsolidatedSubsidiaries")
        for line in fieldlabel_section.split('\n'):
            if 'AllEmployeesRatioOfMaleEmployeesTakingChildcareLeave' in line:
                print(f"   fieldLabelMap: {line.strip()}")
    
    # 平均年齢
    if 'AverageAgeYearsInformationAboutReportingCompanyInformationAboutEmployees' in xbrl_content:
        print("✅ 平均年齢タグ発見: AverageAgeYearsInformationAboutReportingCompanyInformationAboutEmployees")
        for line in fieldlabel_section.split('\n'):
            if 'AverageAgeYears' in line:
                print(f"   fieldLabelMap: {line.strip()}")

except FileNotFoundError:
    print("⚠️ xbrlTagMap.tsが見つかりません")
