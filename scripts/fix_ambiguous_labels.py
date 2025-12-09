#!/usr/bin/env python3
"""曖昧な日本語ラベルを具体的な表現に修正"""

import re

# 修正マッピング（XBRLタグ名から意味を読み取って適切な日本語に）
SPECIFIC_TRANSLATIONS = {
    # ～比率 → 具体的な比率名
    'AllEmployeesRatioOfMaleEmployeesTakingChildcareLeaveMetricsOfConsolidatedSubsidiaries': '男性育児休業取得率（連結子会社・全従業員）',
    'RatioOfFemaleEmployeesInManagerialPositionsMetricsOfConsolidatedSubsidiaries': '女性管理職比率（連結子会社）',
    'RatioOfFemaleEmployeesInManagerialPositionsMetricsOfReportingCompany': '女性管理職比率（報告会社）',
    'RatioOfVotingRightsHeld': '議決権保有比率',
    
    # 役員人数（小数になってしまう問題）
    'NumberOfDirectorsAndOtherOfficersRemunerationEtcByCategoryOfDirectorsAndOtherOfficers': '役員報酬等の区分別人数',
    
    # 株式（種類別に区別）
    'NumberOfNamesOfSecuritiesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '非上場株式銘柄数（政策保有・最大保有）',
    'NumberOfNamesOfSecuritiesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '非上場株式銘柄数（政策保有・報告会社）',
    'NumberOfNamesOfSecuritiesEquitySecuritiesOtherThanThoseNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '上場株式銘柄数（政策保有・最大保有）',
    'NumberOfNamesOfSecuritiesEquitySecuritiesOtherThanThoseNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '上場株式銘柄数（政策保有・報告会社）',
    'NumberOfNamesOfSecuritiesWhoseNumberOfSharesDecreasedEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '株式数減少銘柄数（非上場政策保有・最大保有）',
    'NumberOfNamesOfSecuritiesWhoseNumberOfSharesDecreasedEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '株式数減少銘柄数（非上場政策保有・報告会社）',
    'NumberOfNamesOfSecuritiesWhoseNumberOfSharesIncreasedEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '株式数増加銘柄数（非上場政策保有・最大保有）',
    
    # 株式数（具体的な区分）
    'NumberOfIssuedSharesAsOfFilingDateIssuedSharesTotalNumberOfSharesEtc': '提出日現在の発行済株式数',
    'NumberOfIssuedSharesAsOfFiscalYearEndIssuedSharesTotalNumberOfSharesEtc': '期末発行済株式数',
    'NumberOfSharesConstitutingOneUnit': '単元株式数',
    'NumberOfSharesHeld': '保有株式数',
    'NumberOfSharesHeldInOwnNameTreasurySharesEtc': '自己名義保有株式数',
    'NumberOfSharesHeldNumberOfUnitsFinancialInstitutions': '金融機関保有株式数',
    'NumberOfSharesHeldNumberOfUnitsFinancialServiceProviders': '金融商品取引業者保有株式数',
    'NumberOfSharesHeldNumberOfUnitsForeignIndividualInvestors': '外国人個人投資家保有株式数',
    'NumberOfSharesHeldNumberOfUnitsForeignInvestorsOtherThanIndividuals': '外国法人等保有株式数',
    'NumberOfSharesHeldNumberOfUnitsIndividualsAndOthers': '個人その他保有株式数',
    'NumberOfSharesHeldNumberOfUnitsNationalAndLocalGovernments': '政府・地方公共団体保有株式数',
    'NumberOfSharesHeldNumberOfUnitsOtherCorporations': '事業法人等保有株式数',
    'NumberOfSharesHeldNumberOfUnitsTotal': '総保有株式数',
    'NumberOfSharesHeldOrdinarySharesInformationAboutDirectorsAndCorporateAuditors': '役員保有普通株式数',
    'NumberOfSharesHeldOrdinarySharesInformationAboutDirectorsAndCorporateAuditorsProposal': '役員保有普通株式数（議案）',
    'NumberOfSharesHeldOrdinarySharesInformationAboutExecutiveDirectors': '執行役保有普通株式数',
    'NumberOfSharesHeldOrdinarySharesInformationAboutExecutiveDirectorsProposal': '執行役保有普通株式数（議案）',
    'NumberOfSharesHeldSharesLessThanOneUnit': '単元未満株式数',
    'NumberOfSharesIssuedSharesVotingRights': '議決権株式数',
    'TotalNumberOfSharesHeldTreasurySharesEtc': '自己株式総保有数',
    'NumberOfSharesHeldDetailsOfSpecifiedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '特定投資株式保有数（最大保有）',
    'NumberOfSharesHeldDetailsOfSpecifiedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '特定投資株式保有数（報告会社）',
    
    # 株主（区分別）
    'NumberOfShareholdersFinancialInstitutions': '金融機関株主数',
    'NumberOfShareholdersFinancialServiceProviders': '金融商品取引業者株主数',
    'NumberOfShareholdersForeignIndividualInvestors': '外国人個人投資家株主数',
    'NumberOfShareholdersNationalAndLocalGovernments': '政府・地方公共団体株主数',
    'NumberOfShareholdersTotal': '総株主数',
    'NumberOfShareholdersForeignInvestorsOtherThanIndividuals': '外国法人等株主数',
    'NumberOfShareholdersIndividualsAndOthers': '個人その他株主数',
    'NumberOfShareholdersOtherCorporations': '事業法人等株主数',
    
    # その他（具体的な区分）
    'OtherNetOpeCF': 'その他営業CF',
    'OtherNetInvCF': 'その他投資CF',
    'OtherNetFinCF': 'その他財務CF',
    'AllEmployeesCalculatedBasedOnProvisionsOfArticle714Item2OfOrdinanceForEnforcementOfActOnChildcareLeaveCaregiverLeaveAndOtherMeasuresForTheWelfareOfWorkersCaringForChildrenOrOtherFamilyMembersRatioOfMaleEmployeesTakingChildcareLeaveMetricsOfReportingCompany': '男性育児休業取得率（報告会社・全従業員・育児介護休業法準拠）',
    'NumberOfFemaleDirectorsAndOtherOfficers': '女性役員等人数',
    'NumberOfFemaleDirectorsAndOtherOfficersProposal': '女性役員等人数（議案）',
    'NumberOfMaleDirectorsAndOtherOfficers': '男性役員等人数',
    'NumberOfMaleDirectorsAndOtherOfficersProposal': '男性役員等人数（議案）',
    'OtherAccountsReceivableCAELE': 'その他未収入金',
    'OtherAdvancesCLELE': 'その他仮受金',
    'OtherCA': 'その他流動資産',
    'OtherCL': 'その他流動負債',
    'OtherIOA': 'その他投資その他の資産',
    'OtherNCL': 'その他固定負債',
    'OtherRetainedEarnings': 'その他利益剰余金',
    'PercentageOfShareholdingsForeignersOtherThanIndividuals': '外国法人等持株比率',
    'PercentageOfShareholdingsIndividualsAndOthers': '個人その他持株比率',
    'PercentageOfShareholdingsOtherCorporations': '事業法人等持株比率',
    'RatioOfFemaleDirectorsAndOtherOfficers': '女性役員等比率',
    'RatioOfFemaleDirectorsAndOtherOfficersProposal': '女性役員等比率（議案）',
    
    # 帳簿価額（投資区分別）
    'BookValueDetailsOfSpecifiedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '特定投資株式帳簿価額（最大保有）',
    'BookValueDetailsOfSpecifiedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '特定投資株式帳簿価額（報告会社）',
    'BookValueDetailsOfSpecifiedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany': '特定投資株式帳簿価額（第2位保有）',
    'BookValueEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPureInvestmentLargestHoldingCompany': '非上場純投資株式帳簿価額（最大保有）',
    'BookValueEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '非上場政策保有株式帳簿価額（最大保有）',
    'BookValueEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '非上場政策保有株式帳簿価額（報告会社）',
    'BookValueEquitySecuritiesOtherThanThoseNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '上場政策保有株式帳簿価額（最大保有）',
    'BookValueEquitySecuritiesOtherThanThoseNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany': '上場政策保有株式帳簿価額（報告会社）',
    'CarryingAmountSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '非上場株式簿価（政策保有・最大保有）',
    'CarryingAmountSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany': '非上場株式簿価（政策保有・報告会社）',
    'CarryingAmountSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany': '非上場株式簿価（政策保有・第2位保有）',
    'CarryingAmountSharesOtherThanThoseNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '上場株式簿価（政策保有・最大保有）',
    'CarryingAmountSharesOtherThanThoseNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany': '上場株式簿価（政策保有・報告会社）',
    'CarryingAmountSharesOtherThanThoseNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany': '上場株式簿価（政策保有・第2位保有）',
    
    # 銘柄数（投資区分別）
    'NumberOfIssuesSharesNotListedInvestmentSharesHeldForPureInvestmentLargestHoldingCompany': '非上場純投資株式銘柄数（最大保有）',
    'NumberOfIssuesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '非上場政策保有株式銘柄数（最大保有）',
    'NumberOfIssuesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany': '非上場政策保有株式銘柄数（報告会社）',
    'NumberOfIssuesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany': '非上場政策保有株式銘柄数（第2位保有）',
    'NumberOfIssuesSharesOtherThanThoseNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany': '上場政策保有株式銘柄数（最大保有）',
    'NumberOfIssuesSharesOtherThanThoseNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany': '上場政策保有株式銘柄数（報告会社）',
    'NumberOfIssuesSharesOtherThanThoseNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany': '上場政策保有株式銘柄数（第2位保有）',
    
    # 評価（具体的な区分）
    'ValuationAndTranslationAdjustments': '評価・換算差額等',
    'ValuationDifferenceOnAvailableForSaleSecurities': 'その他有価証券評価差額金',
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
        print(f"✅ {english_key[:60]}... → {japanese_value}")

# ファイルに書き戻し
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ 合計 {fixed_count} 件の曖昧なラベルを修正しました")
print(f"✅ {file_path} を更新しました")
