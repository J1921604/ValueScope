#!/usr/bin/env python3
"""
英語項目を適切な日本語に一括変換
"""

from pathlib import Path
import re

# 英語→日本語マッピング
TRANSLATIONS = {
    'AllEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfConsolidatedSubsidiaries': '全従業員男女間賃金格差（連結子会社）',
    'AllEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfReportingCompany': '全従業員男女間賃金格差（報告会社）',
    'AverageAnnualSalaryInformationAboutReportingCompanyInformationAboutEmployees': '平均年間給与',
    'ConstructionAndRetirementInProgressNCAInProcessELE': '建設・除却仮勘定',
    'ContractAssets': '契約資産',
    'ContractLiabilities': '契約負債',
    'ContributionPayableForNuclearReactorDecommissioningNCLELE': '原子力廃炉負担金',
    'CumulativeEffectsOfChangesInAccountingPolicies': '会計方針変更の累積的影響額',
    'DeferredGainsOrLossesOnHedges': '繰延ヘッジ損益',
    'DepositsReceived': '預り金',
    'DilutedEarningsPerShareSummaryOfBusinessResults': '希薄化後1株当たり当期純利益',
    'DistributionFacilitiesNCAElectricELE': '配電設備',
    'FacilitiesLoanedNCAElectricELE': '貸付設備',
    'GeneralFacilitiesNCAElectricELE': '一般設備',
    'GeneralReserve': '別途積立金',
    'GrantsInAidReceivableFromNuclearDamageCompensationFacilitationCorporationIOAELE': '原子力損害賠償支援機構未収金',
    'HydroelectricPowerProductionFacilitiesNCAElectricELE': '水力発電設備',
    'IncidentalBusinessFacilitiesELE': '付帯事業設備',
    'IncreaseOrDecreaseDueToChangesInAccountingTreatmentOfAffiliatedCompaniesAccountedForByTheEquityMethod': '持分法適用会社の会計処理変更による増減',
    'InternalCombustionEnginePowerProductionFacilitiesNCAElectricELE': '内燃力発電設備',
    'LeaseObligationsNCL': 'リース債務',
    'LoadedNuclearFuelNCAELE': '装荷核燃料',
    'LongTermAccruedLiabilitiesNCLELE': '長期未払費用',
    'LongTermDebtToSubsidiariesAndAffiliatesNCLELE': '関係会社長期借入金',
    'LongTermInvestmentForSubsidiariesAndAffiliatesELE': '関係会社長期投資',
    'LongTermInvestmentsELE': '長期投資',
    'LongTermPrepaidExpenses': '長期前払費用',
    'MerchandiseAndFinishedGoods': '商品及び製品',
    'NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults': '投資活動によるキャッシュフロー',
    'NetDefinedBenefitAsset': '退職給付に係る資産',
    'NetDefinedBenefitLiability': '退職給付に係る負債',
    'NonControllingInterests': '非支配株主持分',
    'NonOperatingFacilitiesELE': '非営業用設備',
    'NonRegularEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfConsolidatedSubsidiaries': '非正規従業員男女間賃金格差（連結子会社）',
    'NonRegularEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfReportingCompany': '非正規従業員男女間賃金格差（報告会社）',
    'NotesReceivableTrade': '受取手形',
    'NuclearFuelInProcessingNCAELE': '加工中核燃料',
    'NuclearFuelNCAELE': '核燃料',
    'NumberOfAssociatesAccountedForUsingEquityMethod': '持分法適用関連会社数',
    'NumberOfConsolidatedSubsidiaries': '連結子会社数',
    'NumberOfSubmissionDEI': '提出回数',
    'NumberOfUnconsolidatedSubsidiariesAndAssociatesAccountedForUsingEquityMethod': '非連結子会社及び持分法適用関連会社数',
    'NumberOfVotingRightsHeld': '保有議決権数',
    'NumberOfVotingRightsIssuedSharesVotingRights': '発行済株式議決権数',
    'PercentageOfShareholdingsFinancialInstitutions': '金融機関持株比率',
    'PercentageOfShareholdingsFinancialServiceProviders': '金融商品取引業者持株比率',
    'PercentageOfShareholdingsForeignIndividuals': '外国人個人持株比率',
    'PercentageOfShareholdingsNationalAndLocalGovernments': '国及び地方公共団体持株比率',
    'PreferredStockClassATotalNumberOfIssuedSharesSummaryOfBusinessResult': 'A種優先株式発行済株式総数',
    'PreferredStockClassBTotalNumberOfIssuedSharesSummaryOfBusinessResults': 'B種優先株式発行済株式総数',
    'PrepaidExpenses': '前払費用',
    'PrepaidPensionCostIOA': '前払年金費用',
    'PriceEarningsRatioSummaryOfBusinessResults': '株価収益率',
    'ProfitLossAttributableToOwnersOfParentSummaryOfBusinessResults': '親会社株主帰属当期純利益',
    'RateOfReturnOnEquitySummaryOfBusinessResults': '自己資本利益率',
    'RatioOfFemaleEmployeesInManagerialPositionsMetricsOfConsolidatedSubsidiaries': '管理職に占める女性労働者比率（連結子会社）',
    'RatioOfFemaleEmployeesInManagerialPositionsMetricsOfReportingCompany': '管理職に占める女性労働者比率（報告会社）',
    'RawMaterialsAndSupplies': '原材料及び貯蔵品',
    'RegularEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfConsolidatedSubsidiaries': '正規従業員男女間賃金格差（連結子会社）',
    'RegularEmployeesDifferencesInWagesBetweenMaleAndFemaleEmployeesMetricsOfReportingCompany': '正規従業員男女間賃金格差（報告会社）',
    'RemeasurementsOfDefinedBenefitPlans': '退職給付に係る調整額',
    'RenewablePowerProductionFacilitiesNCAElectricELE': '新エネルギー等発電設備',
    'ReserveForFluctuationInWaterLevelsReservesUnderTheSpecialLawsELE': '渇水準備引当金',
    'ReserveForOverseasInvestmentLoss': '海外投資等損失引当金',
    'ReserveForSpecialDisasterELE': '特定災害準備金',
    'ReserveFundForNuclearReactorDecommissioningIOAELE': '原子力廃炉積立金',
    'ReserveFundForReprocessingOfIrradiatedNuclearFuelIOAELE': '使用済燃料再処理等積立金',
    'ReservesUnderTheSpecialLaws2': '特別法上の準備金',
    'RestatedBalance': '修正再表示後残高',
    'RetirementInProgressNCAInProgressELE': '除却仮勘定',
    'SecurityCodeDEI': '証券コード',
    'ShareholdingRatio': '持株比率',
    'ShareholdingRatioTreasurySharesEtc': '自己株式保有比率',
    'SpecialAccountRelatedToReprocessingOfSpentNuclearFuelELE': '使用済燃料再処理等特別勘定',
    'SubscriptionRightsToShares': '新株予約権',
    'Supplies': '貯蔵品',
    'ThermalPowerProductionFacilitiesNCAElectricELE': '火力発電設備',
    'TotalNumberOfIssuedSharesSummaryOfBusinessResults': '発行済株式総数',
    'TotalReturnOnSharePriceIndex': '株価指数総合収益率',
    'WorkInProcess': '仕掛品',
}

def fix_english_labels():
    tsx_path = Path('src/components/ComparisonFinancialTable.tsx')
    content = tsx_path.read_text(encoding='utf-8')
    
    fixed_count = 0
    for key, japanese in TRANSLATIONS.items():
        # パターン: key: '英語値',
        old_pattern = f"  {key}: '{key}',"
        new_pattern = f"  {key}: '{japanese}',"
        
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            fixed_count += 1
            print(f"✅ {key} → {japanese}")
    
    if fixed_count > 0:
        tsx_path.write_text(content, encoding='utf-8')
        print(f"\n✅ Fixed {fixed_count} English labels")
    else:
        print("⚠️ No labels were fixed (they may already be translated)")

if __name__ == '__main__':
    fix_english_labels()
