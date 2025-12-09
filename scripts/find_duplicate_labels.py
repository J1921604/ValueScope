#!/usr/bin/env python3
"""fieldLabelMap内の同名項目を検出"""

import re
from collections import defaultdict

# ComparisonFinancialTable.tsxを読み込む
with open('src/components/ComparisonFinancialTable.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# fieldLabelMapセクションを抽出
fieldlabel_match = re.search(r'const fieldLabelMap: Record<string, string> = \{(.*?)\n\};', content, re.DOTALL)
if not fieldlabel_match:
    print("❌ fieldLabelMapが見つかりません")
    exit(1)

fieldlabel_section = fieldlabel_match.group(1)

# 各エントリを解析
pattern = r"^\s+([A-Za-z_][A-Za-z0-9_]*):\s*'([^']*)',?"
value_to_keys = defaultdict(list)

for line in fieldlabel_section.split('\n'):
    match = re.match(pattern, line)
    if match:
        key = match.group(1)
        value = match.group(2)
        value_to_keys[value].append(key)

# 同名の項目を検出
print("\n🔍 同名の日本語ラベル検出結果")
print("="*80)

duplicates_found = False
for value, keys in sorted(value_to_keys.items()):
    if len(keys) > 1:
        duplicates_found = True
        print(f"\n【{value}】 {len(keys)}件")
        print("-"*80)
        for key in keys:
            print(f"  {key}")

if not duplicates_found:
    print("\n✅ 同名の項目は見つかりませんでした")
else:
    print(f"\n⚠️ 合計 {sum(1 for v in value_to_keys.values() if len(v) > 1)} 種類の同名ラベルが存在します")
