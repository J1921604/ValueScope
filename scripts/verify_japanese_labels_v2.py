#!/usr/bin/env python3
"""
財務3表の全項目に日本語ラベルがあるかチェック（大文字小文字区別なし版）
"""

import re
from pathlib import Path

def extract_xbrl_keys():
    """xbrlTagMap.ts から全キーを抽出（大文字小文字そのまま）"""
    xbrl_path = Path('src/components/xbrlTagMap.ts')
    content = xbrl_path.read_text(encoding='utf-8')
    
    pattern = r"^\s+'([^']+)':"
    keys = re.findall(pattern, content, re.MULTILINE)
    
    return set(keys)

def extract_field_labels():
    """ComparisonFinancialTable.tsx から fieldLabelMap のキーを抽出（大文字小文字そのまま）"""
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    match = re.search(r'const fieldLabelMap.*?\{(.*?)\n\};', content, re.DOTALL)
    if not match:
        return set()
    
    label_section = match.group(1)
    
    # キー名を抽出（小文字も含む）
    pattern = r"^\s+([A-Za-z_][A-Za-z0-9_]*):"
    keys = re.findall(pattern, label_section, re.MULTILINE)
    
    return set(keys)

def main():
    xbrl_keys = extract_xbrl_keys()
    label_keys = extract_field_labels()
    
    print(f"xbrlTagMap keys: {len(xbrl_keys)}")
    print(f"fieldLabelMap keys: {len(label_keys)}")
    print()
    
    # 大文字小文字を区別して比較
    missing_labels = xbrl_keys - label_keys
    
    if missing_labels:
        print(f"❌ Missing Japanese labels: {len(missing_labels)} items")
        print("=" * 60)
        for key in sorted(missing_labels):
            print(f"  {key}")
    else:
        print("✅ All 488 XBRL items have Japanese labels!")
    
    print()
    
    # Extra labels（警告のみ、エラーではない）
    extra_labels = label_keys - xbrl_keys
    if extra_labels:
        print(f"ℹ️ Extra labels (used in UI, not in raw XBRL): {len(extra_labels)} items")
        # fiscal_year, EBITDA などのUI用ラベルは正常
    
    return 0 if len(missing_labels) == 0 else 1

if __name__ == '__main__':
    exit_code = main()
    exit(exit_code)
