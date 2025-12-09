#!/usr/bin/env python3
"""同名ラベルを区別できる日本語に修正"""

import re

# 修正マッピング
SPECIFIC_TRANSLATIONS = {
    # その他 → 具体的に区別
    'Other': 'その他（未分類）',
    'InvestmentsAndOtherAssets': '投資その他の資産',
    
    # その他有価証券評価差額金
    'ValuationDifferenceOnAvailableForSaleSecuritiesNetOfTaxOCI': 'その他有価証券評価差額金（税効果考慮後・包括利益）',
    'ValuationDifferenceOnAvailableForSaleSecurities': 'その他有価証券評価差額金（純資産）',
    
    # インバランス収支返還損失
    'LossOnReturnOfImbalanceIncomeAndExpenditureELELE': 'インバランス収支返還損失（損益）',
    'LossOnReturnOfImbalanceIncomeAndExpenditureOpeCFELE': 'インバランス収支返還損失（営業CF）',
    
    # 使用済燃料中間貯蔵事業損失
    'LossRelatedToInterimStorageProjectOfSpentFuelEL': '使用済燃料中間貯蔵事業損失（損益）',
    'LossRelatedToInterimStorageProjectOfSpentFuelOpeCF': '使用済燃料中間貯蔵事業損失（営業CF）',
    
    # 再生可能エネルギー発電促進賦課金
    'GrantUnderActOnPurchaseOfRenewableEnergySourcedElectricityORElectricELE': '再生可能エネルギー発電促進賦課金（収益）',
    'LevyUnderActOnPurchaseOfRenewableEnergySourcedElectricityOEElectricELE': '再生可能エネルギー発電促進賦課金（費用）',
    
    # 利益剰余金
    'RetainedEarnings': '利益剰余金合計',
    'LegalRetainedEarnings': '法定準備積立金',
    'RetainedEarningsBroughtForward': '繰越利益剰余金',
    
    # 包括利益
    'ComprehensiveIncome': '包括利益（純利益+その他包括利益）',
    'ComprehensiveIncomeSummaryOfBusinessResults': '包括利益（業績サマリー）',
    
    # 原子力
    'NuclearPowerAbolitionInProgressELE': '原子力廃炉仮勘定',
    'NuclearPowerProductionFacilitiesNCAElectricELE': '原子力発電設備',
    'ProvisionForCompensationForNuclearPowerRelatedDamagesNCLELE': '原子力損害賠償引当金',
    'ProvisionForPreparationOfRemovalOfReactorCoresInSpecifiedNuclearPowerFacilitiesNCLELE': '原子力炉心除去準備引当金',
    'ProvisionForRemovalOfReactorCoresInSpecifiedNuclearPowerFacilitiesNCLELE': '原子力炉心除去引当金',
    
    # 原子力廃炉積立金の増減
    'IncreaseDecreaseInReserveFundForNuclearReactorDecommissioningOpeCFELE': '原子力廃炉積立金の増減（営業CF・増加）',
    'DecreaseIncreaseInReserveFundForNuclearReactorDecommissioningOpeCFELE': '原子力廃炉積立金の増減（営業CF・減少）',
    
    # 原子力廃炉負担金
    'ContributionReceivedForNuclearReactorDecommissionORElectricELE': '原子力廃炉負担金（収益）',
    'ContributionPayableForNuclearReactorDecommissioningNCLELE': '原子力廃炉負担金（負債）',
    
    # 原子力損害賠償費
    'CompensationForNuclearPowerRelatedDamagesELELE': '原子力損害賠償費（費用）',
    'CompensationForNuclearPowerRelatedDamagesOpeCFELE': '原子力損害賠償費（営業CF）',
    
    # 取得額合計（最大保有会社）
    'TotalAcquisitionCostForIncreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '取得額合計（最大保有会社・非上場投資株式）',
    'TotalAcquisitionCostForIncreasedSharesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '取得額合計（最大保有会社・非上場政策保有株式）',
    
    # 受取配当金
    'DividendsIncomeNOI': '受取配当金（営業外収益）',
    'DividendIncome': '受取配当金（営業CF）',
    
    # 営業収益
    'OperatingRevenue': '営業収益合計',
    'OperatingRevenueELE': '営業収益（電気事業）',
    'OtherBusinessOperatingRevenueELE': '営業収益（その他事業）',
    
    # 営業外収益
    'NonOperatingIncome': '営業外収益合計',
    'NonOperatingRevenueNORELE': '営業外収益（電気事業）',
    
    # 営業外費用
    'NonOperatingExpenses': '営業外費用合計',
    'NonOperatingExpensesNOEELE': '営業外費用（電気事業）',
    
    # 営業活動によるキャッシュフロー
    'OperatingCashFlow': '営業活動によるキャッシュフロー（計算値）',
    'CashFlowsFromOperatingActivities': '営業活動によるキャッシュフロー',
    'NetCashProvidedByUsedInOperatingActivities': '営業活動によるキャッシュフロー（純額）',
    
    # 固定報酬
    'FixedRemunerationRemunerationEtcByCategoryOfDirectorsAndOtherOfficers': '固定報酬（役員報酬等）',
    'FixedRemunerationRemunerationByCategoryOfDirectorsAndOtherOfficers': '固定報酬（役員報酬）',
    
    # 固定負債
    'NoncurrentLiabilities': '固定負債合計',
    'CurrentPortionOfNoncurrentLiabilitiesCLELE': '固定負債流動化分',
    'OtherNoncurrentLiabilitiesNCLELE': 'その他固定負債',
    
    # 固定資産
    'NoncurrentAssets': '固定資産合計',
    'OtherNoncurrentAssetsELE': 'その他固定資産',
    
    # 固定資産売却益
    'GainOnSalesOfNoncurrentAssetsEI': '固定資産売却益（特別利益）',
    'GainOnSalesOfNoncurrentAssetsOpeCF': '固定資産売却益（営業CF）',
    'GainOnSalesOfNonCurrentAssetsOpeCF': '固定資産売却益（営業CF・別表記）',
    'GainOnSalesOfNoncurrentAssetsNOIELE': '固定資産売却益（営業外収益）',
    
    # 売上高
    'NetSales': '売上高',
    'NetSalesSummaryOfBusinessResults': '売上高（業績サマリー）',
    
    # 売却額合計（提出会社）
    'TotalSaleAmountForDecreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany': '売却額合計（提出会社・非上場投資株式）',
    'TotalSalesAmountForDecreasedSharesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '売却額合計（提出会社・非上場政策保有株式）',
    
    # 売掛金
    'AccountsReceivableTrade': '売掛金',
    'NotesAndAccountsReceivableTradeAndContractAssets': '売掛金及び契約資産',
    
    # 小計
    'subtotal': '小計（トークン）',
    'SubtotalOpeCF': '小計（営業CF）',
    
    # 建設仮勘定
    'ConstructionInProgressELE': '建設仮勘定（電気事業）',
    'ConstructionInProgressNCAInProgressELE': '建設仮勘定（固定資産）',
    
    # 当期純利益
    'NetIncome': '当期純利益',
    'ProfitLoss': '当期純利益（親会社株主帰属）',
    'NetIncomeLossSummaryOfBusinessResults': '当期純利益（業績サマリー）',
    
    # 投資活動によるキャッシュフロー
    'InvestingCashFlow': '投資活動によるキャッシュフロー（計算値）',
    'CashFlowsFromInvestingActivities': '投資活動によるキャッシュフロー',
    'NetCashProvidedByUsedInInvestingActivities': '投資活動によるキャッシュフロー（純額）',
    'NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults': '投資活動によるキャッシュフロー（業績サマリー）',
    
    # 持分法投資損益
    'EquityInEarningsLossesOfAffiliatesOpeCF': '持分法投資損益（営業CF）',
    'EquityInEarningsLossesOfAffiliates': '持分法投資損益（損益）',
    
    # 持株比率
    'shareholdingratio': '持株比率（トークン）',
    'shareholdingratios': '持株比率（複数・トークン）',
    'ShareholdingRatio': '持株比率',
    
    # 支払利息
    'InterestExpensesNOE': '支払利息（営業外費用）',
    'InterestExpensesOpeCF': '支払利息（営業CF）',
    
    # 株主
    'shareholders': '株主（トークン）',
    'ShareholdersEquity': '株主資本',
    'TotalShareholderReturn': '株主総還元',
    
    # 業績連動報酬
    'PerformanceBasedRemunerationRemunerationEtcByCategoryOfDirectorsAndOtherOfficers': '業績連動報酬（役員報酬等）',
    'PerformanceBasedRemunerationRemunerationByCategoryOfDirectorsAndOtherOfficers': '業績連動報酬（役員報酬）',
    
    # 流動負債
    'CurrentLiabilities': '流動負債合計',
    'OtherCurrentLiabilitiesCLELE': 'その他流動負債',
    
    # 流動資産
    'CurrentAssets': '流動資産合計',
    'OtherCurrentAssetsCAELE': 'その他流動資産',
    
    # 渇水準備引当金繰入
    'ProvisionOfReserveForSpecialDisasterELE': '渇水準備引当金繰入（特別災害）',
    'ProvisionOfReserveForFluctuationInWaterLevelsELE': '渇水準備引当金繰入（水位変動）',
    
    # 減価償却費
    'DepreciationAndAmortizationOpeCF': '減価償却費（営業CF）',
    'Depreciation': '減価償却費',
    'DepreciationSegmentInformation': '減価償却費（セグメント情報）',
    'ReserveForPreparationOfTheDepreciationOfNuclearPowerConstructionReservesUnderTheSpecialLawsELE': '減価償却費（原子力建設準備金）',
    
    # 減損損失
    'ImpairmentLossEL': '減損損失（特別損失）',
    'ImpairmentLoss': '減損損失',
    'ImpairmentLossOpeCF': '減損損失（営業CF）',
    
    # 災害損失引当金戻入益
    'GainOnReversalOfProvisionForLossOnDisasterEI': '災害損失引当金戻入益（特別利益）',
    'GainOnReversalOfProvisionForLossOnDisasterOpeCF': '災害損失引当金戻入益（営業CF）',
    
    # 現金及び現金同等物
    'CashAndCashEquivalentsSummaryOfBusinessResults': '現金及び現金同等物（業績サマリー）',
    'CashAndCashEquivalents': '現金及び現金同等物',
    
    # 短期
    'ShortTermDebtToSubsidiariesAndAffiliatesCLELE': '短期関係会社借入金',
    'ShortTermReceivablesFromSubsidiariesAndAffiliatesCAELE': '短期関係会社貸付金',
    
    # 研究開発費
    'ResearchAndDevelopmentExpensesIncludedInGeneralAndAdministrativeExpensesAndManufacturingCostForCurrentPeriod': '研究開発費（販管費・製造費用）',
    'ResearchAndDevelopmentExpensesResearchAndDevelopmentActivities': '研究開発費（研究開発活動）',
    
    # 福島第二原発廃炉損失
    'LossOnDecommissioningOfTEPCOFukushimaDainiNuclearPowerStationEL': '福島第二原発廃炉損失（特別損失）',
    'LossOnDecommissioningOfTEPCOFukushimaDainiNuclearPowerStationOpeCF': '福島第二原発廃炉損失（営業CF）',
    'LossOnDecommissioningOfTEPCOFukushimaDainiNuclearPowerStationSegmentInformation': '福島第二原発廃炉損失（セグメント情報）',
    
    # 純資産
    'NetAssets': '純資産合計',
    'NetAssetsSummaryOfBusinessResults': '純資産（業績サマリー）',
    'LiabilitiesAndNetAssets': '負債及び純資産合計',
    'NetAssetsPerShareSummaryOfBusinessResults': '1株当たり純資産（業績サマリー）',
    
    # 経常利益
    'OrdinaryIncome': '経常利益',
    'OrdinaryIncomeLossSummaryOfBusinessResults': '経常利益（業績サマリー）',
    
    # 給与
    'salaries': '給与（トークン）',
    'salary': '給与（単数・トークン）',
    
    # 総資産
    'TotalAssets': '総資産',
    'TotalAssetsSummaryOfBusinessResults': '総資産（業績サマリー）',
    
    # 繰延ヘッジ損益
    'DeferredGainsOrLossesOnHedgesNetOfTaxOCI': '繰延ヘッジ損益（税効果考慮後・包括利益）',
    'DeferredGainsOrLossesOnHedges': '繰延ヘッジ損益（純資産）',
    
    # 繰延税金負債
    'DeferredTaxLiabilities': '繰延税金負債合計',
    'DeferredTaxLiabilitiesNCL': '繰延税金負債（固定負債）',
    
    # 自己株式
    'treasury': '自己株式（トークン）',
    'TreasuryStock': '自己株式',
    
    # 評価減
    'write': '評価減（トークン）',
    'writedowns': '評価減（複数・トークン）',
    
    # 財務活動によるキャッシュフロー
    'FinancingCashFlow': '財務活動によるキャッシュフロー（計算値）',
    'CashFlowsFromFinancingActivities': '財務活動によるキャッシュフロー',
    'NetCashProvidedByUsedInFinancingActivities': '財務活動によるキャッシュフロー（純額）',
    
    # 貯蔵品
    'supplies': '貯蔵品（トークン）',
    'Supplies': '貯蔵品',
    
    # 買掛金
    'AccountsPayableTrade': '買掛金',
    'NotesAndAccountsPayableTrade': '買掛金及び手形',
    
    # 貸倒引当金
    'AllowanceForDoubtfulAccountsCA': '貸倒引当金（流動資産）',
    'AllowanceForDoubtfulAccountsIOAByGroup': '貸倒引当金（投資その他の資産）',
    
    # 資本剰余金
    'CapitalSurplus': '資本剰余金合計',
    'LegalCapitalSurplus': '法定資本剰余金',
    'OtherCapitalSurplus': 'その他資本剰余金',
    
    # 資本金
    'CapitalStockSummaryOfBusinessResults': '資本金（業績サマリー）',
    'CapitalStock': '資本金',
    
    # 退職給付に係る調整額
    'RemeasurementsOfDefinedBenefitPlansNetOfTaxOCI': '退職給付に係る調整額（税効果考慮後・包括利益）',
    'RemeasurementsOfDefinedBenefitPlans': '退職給付に係る調整額（純資産）',
    
    # 関係会社株式売却益
    'GainOnSalesOfSubsidiariesAndAffiliatesStocksEI': '関係会社株式売却益（特別利益）',
    'GainOnSalesOfSubsidiariesAndAffiliatesStocksOpeCF': '関係会社株式売却益（営業CF）',
    
    # 電気事業
    'ElectricUtilityOperatingRevenueELE': '電気事業営業収益',
    'ElectricUtilityPlantAndEquipmentAssetsELE': '電気事業固定資産',
    'OtherElectricUtilityPlantAndEquipmentNCAElectricELE': 'その他電気事業固定資産',
    
    # ～引当金繰入
    'ProvisionForLossOnDisasterCL': '災害損失引当金（流動負債）',
    'ProvisionForLossOnDisasterNCL': '災害損失引当金（固定負債）',
    'ProvisionForPreparationOfTheReprocessingOfIrradiatedNuclearFuelNCLELE': '使用済燃料再処理準備引当金',
    'ProvisionForReprocessingOfIrradiatedNuclearFuelNCLELE': '使用済燃料再処理引当金',
    'ProvisionForRetirementBenefits': '退職給付引当金',
}

# ファイルを読み込んで修正
file_path = 'src/components/ComparisonFinancialTable.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 修正カウンター
fixed_count = 0

# 各翻訳を適用
for english_key, japanese_value in SPECIFIC_TRANSLATIONS.items():
    # パターン: key: '古い値',
    pattern = f"  {english_key}: '[^']*',"
    
    if re.search(pattern, content):
        # 置換
        new_line = f"  {english_key}: '{japanese_value}',"
        content = re.sub(pattern, new_line, content)
        fixed_count += 1
        print(f"✅ {english_key[:60]}... → {japanese_value[:60]}...")

# ファイルに書き戻し
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ 合計 {fixed_count} 件の同名ラベルを区別可能な日本語に修正しました")
print(f"✅ {file_path} を更新しました")
