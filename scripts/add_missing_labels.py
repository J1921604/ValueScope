#!/usr/bin/env python3
"""
欠損している228項目の日本語ラベルを自動生成してfieldLabelMapに追加
"""

import re
from pathlib import Path

def extract_xbrl_keys():
    """xbrlTagMap.ts から全キーを抽出"""
    xbrl_path = Path('src/components/xbrlTagMap.ts')
    content = xbrl_path.read_text(encoding='utf-8')
    
    pattern = r"^\s+'([^']+)':"
    keys = re.findall(pattern, content, re.MULTILINE)
    
    return set(keys)

def extract_field_labels():
    """ComparisonFinancialTable.tsx から fieldLabelMap のキーを抽出"""
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    match = re.search(r'const fieldLabelMap.*?\{(.*?)\n\};', content, re.DOTALL)
    if not match:
        return set(), ""
    
    label_section = match.group(1)
    pattern = r"^\s+([A-Za-z][A-Za-z0-9_]*):"
    keys = re.findall(pattern, label_section, re.MULTILINE)
    
    return set(keys), label_section

def translate_key(key: str) -> str:
    """
    キー名から日本語ラベルを推測生成
    tokenDictionary ベースの変換ルール
    """
    
    # 既知のマッピング（部分一致）
    mappings = {
        'AccountsPayableOther': 'その他の支払債務',
        'AccountsPayableTrade': '買掛金',
        'AccountsReceivableTrade': '売掛金',
        'AccruedExpenses': '未払費用',
        'AccruedTaxes': '未払税金',
        'AccumulatedDepreciation': '減価償却累計額',
        'AdvancePayments': '前払金',
        'AllowanceForDoubtfulAccounts': '貸倒引当金',
        'AssetRetirementObligations': '資産除去債務',
        'AverageAge': '平均年齢',
        'AverageSalary': '平均給与',
        'AverageLengthOfService': '平均勤続年数',
        'AverageNumberOfTemporaryWorkers': '平均臨時従業員数',
        'BasicEarningsLossPerShare': '基本的1株当たり当期純利益',
        'BookValue': '帳簿価額',
        'CapitalStock': '資本金',
        'CapitalSurplus': '資本剰余金',
        'CarryingAmount': '帳簿価額',
        'CashAndCashEquivalents': '現金及び現金同等物',
        'CashAndDeposits': '現金及び預金',
        'CommercialPapers': 'コマーシャルペーパー',
        'ComprehensiveIncome': '包括利益',
        'ConstructionInProgress': '建設仮勘定',
        'CurrentAssets': '流動資産',
        'CurrentLiabilities': '流動負債',
        'DeferredTaxAssets': '繰延税金資産',
        'DeferredTaxLiabilities': '繰延税金負債',
        'Depreciation': '減価償却費',
        'DividendsPaid': '配当金支払額',
        'DividendsPerShare': '1株当たり配当額',
        'DividendsReceived': '受取配当金',
        'ElectricUtility': '電気事業',
        'EmployeeBenefit': '従業員給付',
        'EquitySecurities': '株式',
        'ForeignCurrency': '為替',
        'GoodwillAndIntangibleAssets': 'のれん及び無形資産',
        'ImpairmentLoss': '減損損失',
        'IncomeTaxes': '法人税等',
        'IntangibleAssets': '無形固定資産',
        'InterestBearingDebt': '有利子負債',
        'InterestExpenses': '支払利息',
        'InterestIncome': '受取利息',
        'Inventories': '棚卸資産',
        'InvestmentSecurities': '投資有価証券',
        'InvestmentsInSubsidiaries': '子会社株式',
        'Land': '土地',
        'LongTermLoans': '長期借入金',
        'Machinery': '機械装置',
        'NetAssets': '純資産',
        'NetIncome': '当期純利益',
        'NetSales': '売上高',
        'NonControllingInterests': '非支配株主持分',
        'NoncurrentAssets': '固定資産',
        'NoncurrentLiabilities': '固定負債',
        'NuclearPower': '原子力',
        'NumberOfEmployees': '従業員数',
        'NumberOfIssues': '銘柄数',
        'NumberOfShares': '株式数',
        'OperatingActivities': '営業活動',
        'OperatingExpenses': '営業費用',
        'OperatingIncome': '営業利益',
        'OperatingRevenue': '営業収益',
        'OrdinaryIncome': '経常利益',
        'Other': 'その他',
        'OtherComprehensiveIncome': 'その他包括利益',
        'PaymentsFor': '～による支出',
        'PerformanceBased': '業績連動',
        'ProceedsFrom': '～による収入',
        'PropertyPlantAndEquipment': '有形固定資産',
        'ProvisionFor': '～引当金繰入',
        'PurchaseOf': '～の取得',
        'RatioOf': '～比率',
        'Remuneration': '報酬',
        'ResearchAndDevelopment': '研究開発',
        'RetainedEarnings': '利益剰余金',
        'RetirementBenefit': '退職給付',
        'RevaluationReserve': '再評価差額金',
        'Revenue': '収益',
        'SalesOf': '～の売却',
        'Segment': 'セグメント',
        'ShareCapital': '株主資本',
        'Shareholder': '株主',
        'ShortTerm': '短期',
        'StockIssuance': '株式発行',
        'TotalAssets': '総資産',
        'TreasuryStock': '自己株式',
        'Valuation': '評価',
        'WorkingCapital': '運転資本',
    }
    
    # 部分マッチで変換
    for pattern, label in mappings.items():
        if pattern in key:
            return label
    
    # デフォルト: キー名そのまま（後でtokenDictionary変換される）
    return key

def generate_missing_labels():
    """欠損項目のラベルを生成してfieldLabelMapに追加"""
    
    xbrl_keys = extract_xbrl_keys()
    label_keys, label_section = extract_field_labels()
    
    missing = sorted(xbrl_keys - label_keys)
    
    print(f"Generating Japanese labels for {len(missing)} missing items...")
    
    # 新しいエントリを生成
    new_entries = []
    for key in missing:
        label = translate_key(key)
        new_entries.append(f"  {key}: '{label}',")
    
    # ComparisonFinancialTable.tsxを読み込み
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    # fieldLabelMap の末尾（}; の直前）に挿入
    # const fieldLabelMap: Record<string, string> = { ... }; を探す
    pattern = r'(const fieldLabelMap.*?\{.*?)(^\};)'
    
    insertion = "\n  // 自動生成: 欠損していた228項目の日本語ラベル\n" + "\n".join(new_entries) + "\n"
    
    new_content = re.sub(
        pattern,
        r'\1' + insertion + r'\2',
        content,
        count=1,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # 書き込み
    tsx_path.write_text(new_content, encoding='utf-8')
    
    print(f"✅ Added {len(new_entries)} Japanese labels to fieldLabelMap")
    print(f"File updated: {tsx_path}")

if __name__ == '__main__':
    generate_missing_labels()
