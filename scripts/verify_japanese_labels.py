#!/usr/bin/env python3
"""
財務3表の全項目に日本語ラベルがあるかチェック
xbrlTagMap.ts (488項目) と fieldLabelMap (ComparisonFinancialTable.tsx) を比較
"""

import re
import json
from pathlib import Path

def extract_xbrl_keys():
    """xbrlTagMap.ts から全キーを抽出"""
    xbrl_path = Path('src/components/xbrlTagMap.ts')
    content = xbrl_path.read_text(encoding='utf-8')
    
    # '  'key': 'value', 形式を抽出
    pattern = r"^\s+'([^']+)':"
    keys = re.findall(pattern, content, re.MULTILINE)
    
    return set(keys)

def extract_field_labels():
    """ComparisonFinancialTable.tsx から fieldLabelMap のキーを抽出"""
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    # const fieldLabelMap から }; までを抽出
    match = re.search(r'const fieldLabelMap.*?\{(.*?)\n\};', content, re.DOTALL)
    if not match:
        print("ERROR: fieldLabelMap not found")
        return set()
    
    label_section = match.group(1)
    
    # キー名を抽出 (コメント行を除外)
    pattern = r"^\s+([A-Za-z][A-Za-z0-9_]*):"
    keys = re.findall(pattern, label_section, re.MULTILINE)
    
    return set(keys)

def main():
    xbrl_keys = extract_xbrl_keys()
    label_keys = extract_field_labels()
    
    print(f"xbrlTagMap keys: {len(xbrl_keys)}")
    print(f"fieldLabelMap keys: {len(label_keys)}")
    print()
    
    # xbrlTagMapにあるがfieldLabelMapにない項目
    missing_labels = xbrl_keys - label_keys
    
    if missing_labels:
        print(f"❌ Missing Japanese labels: {len(missing_labels)} items")
        print("=" * 60)
        for key in sorted(missing_labels)[:20]:  # 最初の20項目を表示
            print(f"  {key}")
        if len(missing_labels) > 20:
            print(f"  ... and {len(missing_labels) - 20} more items")
    else:
        print("✅ All XBRL items have Japanese labels!")
    
    print()
    
    # fieldLabelMapにあるがxbrlTagMapにない項目（余分なラベル）
    extra_labels = label_keys - xbrl_keys
    if extra_labels:
        print(f"ℹ️ Extra labels (not in XBRL): {len(extra_labels)} items")
        for key in sorted(extra_labels)[:10]:
            print(f"  {key}")
        if len(extra_labels) > 10:
            print(f"  ... and {len(extra_labels) - 10} more")
    
    return len(missing_labels)

if __name__ == '__main__':
    exit_code = main()
    exit(exit_code)
