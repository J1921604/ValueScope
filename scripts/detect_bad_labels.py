#!/usr/bin/env python3
"""
fieldLabelMapの英語項目と不適切な日本語を検出
"""

from pathlib import Path
import re

def detect_english_labels():
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    # fieldLabelMapを抽出
    match = re.search(r'const fieldLabelMap.*?\{(.*?)\n\};', content, re.DOTALL)
    if not match:
        print("ERROR: fieldLabelMap not found")
        return
    
    label_section = match.group(1)
    
    # キー: 値のペアを抽出
    pattern = r"^\s+([A-Za-z_][A-Za-z0-9_]*):\s*'([^']*)',"
    matches = re.findall(pattern, label_section, re.MULTILINE)
    
    print(f"Total labels: {len(matches)}\n")
    
    # 英語のまま残っている項目（値にアルファベットが多い）
    english_items = []
    short_items = []  # 不適切に短い日本語（1-2文字）
    
    for key, value in matches:
        # 英語判定: アルファベットが50%以上
        alpha_count = sum(1 for c in value if c.isalpha() and ord(c) < 128)
        total_chars = len(value.replace(' ', ''))
        
        if total_chars > 0:
            if alpha_count / total_chars > 0.5:
                english_items.append((key, value))
            elif len(value) <= 2 and value not in ['資産', '負債', '収益', '費用', '利益', '損失', '合計', '小計', '総額', '評価', '給与', '売却', '売上', '短期', '長期', '固定', '流動', '純額', '為替', '株主', '株式', '自己', '連結', '営業', '経常', '特別', 'その他', '火力', '原子力', '電気', '水力', '変電', '送電', '配電']:
                short_items.append((key, value))
    
    print(f"❌ 英語のまま残っている項目: {len(english_items)}")
    print("=" * 80)
    for key, value in sorted(english_items)[:30]:
        print(f"  {key}: '{value}'")
    if len(english_items) > 30:
        print(f"  ... and {len(english_items) - 30} more")
    
    print(f"\n⚠️ 不適切に短い日本語: {len(short_items)}")
    print("=" * 80)
    for key, value in sorted(short_items)[:20]:
        print(f"  {key}: '{value}'")
    if len(short_items) > 20:
        print(f"  ... and {len(short_items) - 20} more")
    
    # 特定の問題項目
    problem_patterns = [
        ('総', 'GrossProfit等で「総」だけになっている'),
        ('利益', 'IncomeTaxExpense等で「利益」だけになっている'),
    ]
    
    print(f"\n🔍 特定の問題パターン:")
    print("=" * 80)
    for pattern, description in problem_patterns:
        found = [(k, v) for k, v in matches if v == pattern]
        if found:
            print(f"  '{pattern}': {len(found)} items - {description}")
            for k, v in found[:5]:
                print(f"    - {k}")

if __name__ == '__main__':
    detect_english_labels()
