"""
財務3表CSV全項目からXBRLタグマップを生成
PL255項目、BS232項目、CF69項目の合計556項目に対応
"""

import csv
import json

def extract_fields(csv_path):
    """CSVファイルからフィールド名を抽出（fiscal_year, date, company_code除く）"""
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fields = [f for f in reader.fieldnames if f not in ['fiscal_year', 'date', 'company_code']]
    return fields

def generate_xbrl_tag(field_name):
    """フィールド名からXBRLタグを生成"""
    # 計算値項目の特定（既存ComparisonTableの計算ロジックと整合）
    calculated_fields = {
        'EBITDA': '計算値: 営業利益 + 減価償却費',
        'NetDebt': '計算値: 有利子負債 - 現金及び預金',
        'InterestBearingDebt': '計算値: BondsPayable + LongTermLoansPayable + ShortTermLoansPayable',
        'Equity': '計算値: 資本金 + 資本剰余金 + 利益剰余金 - 自己株式',
    }
    
    if field_name in calculated_fields:
        return calculated_fields[field_name]
    
    # 標準XBRLタグ: jpcrp_cor:FieldName
    return f'jpcrp_cor:{field_name}'

def main():
    base_path = 'c:/Users/J1921604/spec-kit/07_ValueScope/XBRL_output/TEPCO/'
    
    # PL項目抽出
    pl_fields = extract_fields(f'{base_path}PL.csv')
    print(f'PL項目数: {len(pl_fields)}')
    
    # BS項目抽出
    bs_fields = extract_fields(f'{base_path}BS.csv')
    print(f'BS項目数: {len(bs_fields)}')
    
    # CF項目抽出
    cf_fields = extract_fields(f'{base_path}CF.csv')
    print(f'CF項目数: {len(cf_fields)}')
    
    # 全項目統合（重複排除）
    all_fields = list(set(pl_fields + bs_fields + cf_fields))
    print(f'全項目数（重複排除後）: {len(all_fields)}')
    
    # XBRLタグマップ生成
    xbrl_map = {}
    for field in sorted(all_fields):
        xbrl_map[field] = generate_xbrl_tag(field)
    
    # TypeScript形式で出力
    output_lines = [
        '// 自動生成: 財務3表全556項目のXBRLタグマップ',
        '// PL: 255項目、BS: 232項目、CF: 69項目',
        'export const xbrlTagMap: Record<string, string> = {',
    ]
    
    for field, tag in sorted(xbrl_map.items()):
        # TypeScriptエスケープ
        field_escaped = field.replace("'", "\\'")
        tag_escaped = tag.replace("'", "\\'")
        output_lines.append(f"  '{field_escaped}': '{tag_escaped}',")
    
    output_lines.append('};')
    
    # ファイル出力
    output_path = 'c:/Users/J1921604/spec-kit/07_ValueScope/src/components/xbrlTagMap.ts'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f'\n✅ XBRLタグマップを生成しました: {output_path}')
    print(f'   総項目数: {len(xbrl_map)}')
    
    # 項目リスト出力（検証用）
    verification_path = 'c:/Users/J1921604/spec-kit/07_ValueScope/scripts/xbrl_fields_list.json'
    with open(verification_path, 'w', encoding='utf-8') as f:
        json.dump({
            'PL': pl_fields,
            'BS': bs_fields,
            'CF': cf_fields,
            'total_unique': len(all_fields),
        }, f, indent=2, ensure_ascii=False)
    
    print(f'✅ 項目リストを出力しました: {verification_path}')

if __name__ == '__main__':
    main()
