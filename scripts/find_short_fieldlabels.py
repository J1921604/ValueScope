#!/usr/bin/env python3
"""fieldLabelMap内の短いラベルを特定（tokenDictionary除外）"""

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

# 各エントリを解析
pattern = r"^\s+([A-Za-z_][A-Za-z0-9_]*):\s*'([^']*)',?"
short_labels = []

for line in fieldlabel_section.split('\n'):
    match = re.match(pattern, line)
    if match:
        key = match.group(1)
        value = match.group(2)
        
        # 日本語文字数をカウント（全角文字）
        japanese_chars = sum(1 for c in value if ord(c) > 127)
        
        # 3文字以下の短いラベル（ただし括弧付き説明を含まない）
        if japanese_chars > 0 and japanese_chars <= 3 and '（' not in value and '・' not in value:
            short_labels.append((key, value, japanese_chars))

print(f"\n⚠️ 短すぎるラベル（3文字以下）: {len(short_labels)}")
print("="*80)
for key, value, count in sorted(short_labels, key=lambda x: x[2]):
    print(f"  {key}: '{value}' ({count}文字)")
