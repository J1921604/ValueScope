import { useCallback, useMemo } from 'react';
import { useFinancialCSV, type FinancialData } from '../hooks/useFinancialCSV';
import { formatNumber } from '../utils/formatNumber';

interface ComparisonFinancialTableProps {
  type: 'PL' | 'BS' | 'CF';
  title: string;
  selectedYear: number | null;
}

const companyNames: Record<'TEPCO' | 'CHUBU' | 'JERA', string> = {
  TEPCO: '東京電力HD',
  CHUBU: '中部電力',
  JERA: 'JERA',
};

const fieldLabelMap: Record<string, string> = {
  return: 'リターン',
  revaluation: '評価替え',
  revenue: '収益',
  reversal: '戻入',
  rights: '権利',
  sga: '販管費',
  ssifrs: '国際会計基準',
  salaries: '給与',
  salary: '給与',
  sale: '売却',
  sales: '売上',
  scope: '範囲',
  second: '第2位',
  securities: '有価証券',
  shareholders: '株主',
  shareholding: '持株',
  shareholdingratio: '持株比率',
  shareholdingratiotreasuryshares: '自己株式比率',
  shareholdingratios: '持株比率',
  shareholdersequity: '株主資本',
  short: '短',
  solution: '解決',
  special: '特別',
  spent: '使用済',
  stocks: '株式',
  subtotal: '小計',
  supplies: '貯蔵品',
  thermal: '火力',
  total: '合計',
  totalnumber: '総数',
  totalshareholderreturn: '株主総還元',
  transfer: '振替',
  transformation: '変電',
  transmission: '送電',
  treasury: '自己株式',
  valuationandtranslation: '評価換算',
  valuationdifference: '評価差額',
  work: '仕掛',
  working: '営業',
  write: '評価減',
  writedowns: '評価減',
  dscr: 'DSCR',
  fiscal_year: '会計年度',
  date: '決算日',
  company_code: 'EDINETコード',
  ElectricUtilityOperatingExpensesELE: '電気事業営業費用',
  OtherBusinessOperatingExpensesELE: 'その他事業営業費用',
  
  // 営業外損益
  NonOperatingIncome: '営業外収益',
  DividendsIncomeNOI: '受取配当金',
  InterestIncomeNOI: '受取利息',
  EquityInEarningsOfAffiliatesNOI: '持分法投資利益',
  ForeignExchangeGainsNOI: '為替差益',
  OtherNOI: 'その他営業外収益',
  NonOperatingExpenses: '営業外費用',
  InterestExpensesNOE: '支払利息',
  ForeignExchangeLossesNOE: '為替差損',
  OtherNOE: 'その他営業外費用',
  EquityInLossesOfAffiliatesNOE: '持分法投資損失',
  
  // 経常損益
  OrdinaryRevenueELE: '経常収益',
  OrdinaryExpensesELE: '経常費用',
  OrdinaryIncome: '経常利益',
  
  // 特別損益
  ExtraordinaryIncome: '特別利益',
  GrantsInAidFromNuclearDamageCompensationFacilitationCorporationEIELE: '原子力損害賠償支援機構交付金',
  GainOnSalesOfNoncurrentAssetsEI: '固定資産売却益',
  GainOnRevisionOfRetirementBenefitPlanEI: '退職給付制度改定益',
  GainOnChangeInEquityEI: '持分変動利益',
  GainOnReversalOfProvisionForLossOnDisasterEI: '災害損失引当金戻入益',
  SettlementReceivedEI: '和解金収入',
  GainOnSalesOfSecuritiesEI: '有価証券売却益',
  GainOnSalesOfSubsidiariesAndAffiliatesStocksEI: '関係会社株式売却益',
  ExtraordinaryLoss: '特別損失',
  CompensationForNuclearPowerRelatedDamagesELELE: '原子力損害賠償費',
  LossRelatedToInterimStorageProjectOfSpentFuelEL: '使用済燃料中間貯蔵事業損失',
  ImpairmentLossEL: '減損損失',
  ExtraordinaryLossOnDisasterEL: '災害損失',
  LossOnValuationOfSecuritiesEL: '有価証券評価損',
  ContingentLossELELE: '偶発損失',
  LossOnDecommissioningOfTEPCOFukushimaDainiNuclearPowerStationEL: '福島第二原発廃炉損失',
  LossOnReturnOfImbalanceIncomeAndExpenditureELELE: 'インバランス収支返還損失',
  
  // 税金
  IncomeBeforeIncomeTaxes: '税引前当期純利益',
  IncomeTaxesCurrent: '法人税等',
  IncomeTaxesDeferred: '法人税等調整額',
  IncomeTaxes: '法人税等合計',
  
  // 当期純利益
  ProfitLoss: '当期純利益',
  ProfitLossAttributableToNonControllingInterests: '非支配株主帰属当期純利益',
  ProfitLossAttributableToOwnersOfParent: '親会社株主帰属当期純利益',
  NetIncomeLossSummaryOfBusinessResults: '当期純利益',
  
  // その他包括利益
  ValuationDifferenceOnAvailableForSaleSecuritiesNetOfTaxOCI: 'その他有価証券評価差額金',
  DeferredGainsOrLossesOnHedgesNetOfTaxOCI: '繰延ヘッジ損益',
  ForeignCurrencyTranslationAdjustmentNetOfTaxOCI: '為替換算調整勘定',
  RemeasurementsOfDefinedBenefitPlansNetOfTaxOCI: '退職給付に係る調整額',
  ShareOfOtherComprehensiveIncomeOfAssociatesAccountedForUsingEquityMethodOCI: '持分法適用会社に対する持分相当額',
  OtherComprehensiveIncome: 'その他包括利益合計',
  ComprehensiveIncome: '包括利益',
  ComprehensiveIncomeAttributableToOwnersOfTheParent: '親会社株主帰属包括利益',
  ComprehensiveIncomeAttributableToNonControllingInterests: '非支配株主帰属包括利益',
  
  // 貸借対照表（BS）主要項目
  TotalAssets: '総資産',
  TotalAssetsSummaryOfBusinessResults: '総資産',
  Equity: '自己資本',
  NetAssetsSummaryOfBusinessResults: '純資産',
  NetAssets: '純資産合計',
  EquityToAssetRatioSummaryOfBusinessResults: '自己資本比率',
  InterestBearingDebt: '有利子負債',
  CashAndDeposits: '現金及び預金',
  CashAndCashEquivalentsSummaryOfBusinessResults: '現金及び現金同等物',
  BondsPayable: '社債',
  LongTermLoansPayable: '長期借入金',
  ShortTermLoansPayable: '短期借入金',
  NotesAndAccountsReceivableTrade: '受取手形及び売掛金',
  Inventories: '棚卸資産',
  NoncurrentAssets: '固定資産',
  CurrentAssets: '流動資産',
  CurrentLiabilities: '流動負債',
  NoncurrentLiabilities: '固定負債',
  Liabilities: '負債合計',
  RetainedEarnings: '利益剰余金',
  CapitalStockSummaryOfBusinessResults: '資本金',
  InvestmentsInEntitiesAccountedForUsingEquityMethod: '持分法適用会社投資',
  
  // キャッシュフロー計算書（CF）主要項目
  NetCashProvidedByUsedInOperatingActivitiesSummaryOfBusinessResults: '営業活動CF',
  NetCashProvidedByUsedInInvestingActivitiesSummaryOfBusinessResults: '投資活動CF',
  NetCashProvidedByUsedInFinancingActivitiesSummaryOfBusinessResults: '財務活動CF',
  NetCashProvidedByUsedInOperatingActivities: '営業活動によるCF',
  NetCashProvidedByUsedInInvestingActivities: '投資活動によるCF',
  NetCashProvidedByUsedInFinancingActivities: '財務活動によるCF',
  NetIncreaseDecreaseInCashAndCashEquivalents: '現金及び現金同等物純増減額',
  EffectOfExchangeRateChangeOnCashAndCashEquivalents: '現金及び現金同等物に係る換算差額',
  
  // CF調整項目
  DepreciationAndAmortizationOpeCF: '減価償却費',
  Depreciation: '減価償却費',
  ImpairmentLoss: '減損損失',
  ImpairmentLossOpeCF: '減損損失',
  LossRelatedToInterimStorageProjectOfSpentFuelOpeCF: '使用済燃料中間貯蔵事業損失',
  DecommissioningCostsOfNuclearPowerUnitsOpeCFELE: '原子力発電施設解体費',
  LossOnRetirementOfNoncurrentAssetsOpeCF: '固定資産除却損',
  IncreaseDecreaseInProvisionForReprocessingOfIrradiatedNuclearFuelOpeCFELE: '使用済燃料再処理等引当金の増減',
  IncreaseDecreaseInProvisionForOtherReprocessingOfIrradiatedNuclearFuelOpeCFELE: 'その他使用済燃料再処理等引当金の増減',
  IncreaseDecreaseInProvisionForLossOnDisasterOpeCF: '災害損失引当金の増減',
  IncreaseDecreaseInNetDefinedBenefitLiabilityOpeCF: '退職給付引当金の増減',
  IncreaseDecreaseInNetDefinedBenefitAssetOpeCF: '退職給付資産の増減',
  InterestAndDividendsIncomeOpeCF: '受取利息及び受取配当金',
  InterestExpensesOpeCF: '支払利息',
  EquityInEarningsLossesOfAffiliatesOpeCF: '持分法投資損益',
  CompensationForNuclearPowerRelatedDamagesOpeCFELE: '原子力損害賠償費',
  GainOnSalesOfNoncurrentAssetsOpeCF: '固定資産売却益',
  GainOnSalesOfNonCurrentAssetsOpeCF: '固定資産売却益',
  LossGainOnChangeInEquityOpeCF: '持分変動損益',
  GainOnReversalOfProvisionForLossOnDisasterOpeCF: '災害損失引当金戻入益',
  LossOnDecommissioningOfTEPCOFukushimaDainiNuclearPowerStationOpeCF: '福島第二原発廃炉損失',
  GainOnSalesOfSubsidiariesAndAffiliatesStocksOpeCF: '関係会社株式売却益',
  LossOnReturnOfImbalanceIncomeAndExpenditureOpeCFELE: 'インバランス収支返還損失',
  DecreaseIncreaseInNotesAndAccountsReceivableTradeOpeCF: '売上債権の増減',
  IncreaseDecreaseInNotesAndAccountsPayableTradeOpeCF: '仕入債務の増減',
  IncreaseDecreaseInAccruedExpensesOpeCF: '未払費用の増減',
  OtherNetOpeCF: 'その他',
  SubtotalOpeCF: '小計',
  InterestAndDividendsIncomeReceivedOpeCFInvCF: '利息及び配当金の受取額',
  InterestExpensesPaidOpeCFFinCF: '利息の支払額',
  IncomeTaxesPaidOpeCF: '法人税等の支払額',
  IncomeTaxesRefundOpeCF: '法人税等の還付額',
  IncomeTaxesPaidRefundOpeCF: '法人税等の支払額又は還付額',
  
  // 投資CF項目
  PurchaseOfNoncurrentAssetsInvCF: '固定資産の取得による支出',
  ProceedsFromSalesOfNoncurrentAssetsInvCF: '固定資産の売却による収入',
  ProceedsFromContributionReceivedForConstructionInvCF: '工事負担金等受入による収入',
  PaymentsOfInvestmentAndLoansReceivableInvCF: '投資有価証券の取得による支出',
  CollectionOfInvestmentAndLoansReceivableInvCF: '投資有価証券の売却による収入',
  PaymentsIntoTimeDepositsInvCF: '定期預金の預入による支出',
  ProceedsFromWithdrawalOfTimeDepositsInvCF: '定期預金の払戻による収入',
  PurchaseOfInvestmentsInSubsidiariesResultingInChangeInScopeOfConsolidationInvCF: '連結範囲変更を伴う子会社株式取得',
  OtherNetInvCF: 'その他',
  NetCashProvidedByUsedInInvestmentActivities: '投資活動によるCF',
  
  // 財務CF項目
  ProceedsFromIssuanceOfBondsFinCF: '社債の発行による収入',
  RedemptionOfBondsFinCF: '社債の償還による支出',
  ProceedsFromLongTermLoansPayableFinCF: '長期借入金の借入による収入',
  RepaymentOfLongTermLoansPayableFinCF: '長期借入金の返済による支出',
  IncreaseInShortTermLoansPayableFinCF: '短期借入金の純増加額',
  DecreaseInShortTermLoansPayableFinCF: '短期借入金の純減少額',
  ProceedsFromIssuanceOfCommercialPapersFinCF: 'コマーシャルペーパーの発行による収入',
  RedemptionOfCommercialPapersFinCF: 'コマーシャルペーパーの償還による支出',
  ProceedsFromShareIssuanceToNonControllingShareholdersFinCF: '非支配株主への新株発行による収入',
  OtherNetFinCF: 'その他',
  
  // セグメント・その他
  SalariesAndAllowancesSGA: '給料及び手当',
  EmployeesRetirementBenefitExpensesSGAELE: '退職給付費用',
  BusinessConsignmentExpensesSGA: '業務委託費',
  VariousExpensesSGA: '雑費',
  BadDebtsExpensesSGA: '貸倒引当金繰入額',
  ResearchAndDevelopmentExpensesIncludedInGeneralAndAdministrativeExpensesAndManufacturingCostForCurrentPeriod: '研究開発費',
  ResearchAndDevelopmentExpensesResearchAndDevelopmentActivities: '研究開発費',
  CapitalExpendituresOverviewOfCapitalExpendituresEtc: '設備投資額',
  RevenuesFromExternalCustomers: '外部顧客への売上高',
  TransactionsWithOtherSegments: 'セグメント間の内部売上高',
  NetSales: '売上高',
  DepreciationSegmentInformation: '減価償却費',
  IncreaseInPropertyPlantAndEquipmentAndIntangibleAssets: '有形固定資産及び無形固定資産増加額',
  
  // 電力事業収益詳細
  ResidentialORElectricELE: '電灯',
  CommercialAndIndustrialORElectricELE: '電力',
  SoldPowerToOtherUtilitiesORElectricELE: '他社販売電力料',
  SoldPowerToOtherSuppliersORElectricELE: '他社小売電気事業者販売電力料',
  TransmissionRevenueORElectricELE: '託送収益',
  SettlementRevenueAmongUtilitiesORElectricELE: '電力会社間精算収益',
  GrantUnderActOnPurchaseOfRenewableEnergySourcedElectricityORElectricELE: '再生可能エネルギー発電促進賦課金',
  OtherElectricityRevenueORElectricELE: 'その他電気料',
  RevenueFromLoanedFacilitiesORElectricELE: '貸付設備収益',
  RevenueEquivalentToContributionForNuclearDamageCompensationORElectricELE: '原子力損害賠償相当収益',
  RevenueEquivalentToContributionForFacilitatingNuclearReactorDecommissioningORElectricELE: '原子力廃炉促進相当収益',
  RevenueFromContractsToRecoverBackEndCostsRelatedToPastYearsPowerGenerationORElectricELE: '過年度発電バックエンド費用回収契約収益',
  ContributionReceivedForNuclearReactorDecommissionORElectricELE: '原子力廃炉負担金',
  
  // 付帯事業収益
  IncidentalBusinessOperatingRevenueELE: '付帯事業営業収益',
  OperatingRevenueEnergyFacilitiesServiceBusinessORIncidentalELE: 'エネルギー設備サービス事業',
  OperatingRevenueRealEstateRentBusinessORIncidentalELE: '不動産賃貸事業',
  OperatingRevenueGasSupplyBusinessORIncidentalELE: 'ガス供給事業',
  OperatingRevenueConsultingBusinessORIncidentalELE: 'コンサルティング事業',
  OperatingRevenueSharedOfficeBusinessOEIncidentalELE: 'シェアオフィス事業',
  OperatingRevenueOtherBusinessesORIncidentalELE: 'その他事業',
  
  // 電力事業費用詳細
  HydroelectricPowerProductionExpensesELE: '水力発電費',
  ThermalPowerProductionExpensesOEElectricELE: '火力発電費',
  NuclearPowerProductionExpensesELE: '原子力発電費',
  InternalCombustionEnginePowerProductionExpensesOEElectricELE: '内燃力発電費',
  RenewablePowerProductionExpensesOEElectricELE: '新エネルギー等発電費',
  PurchasedPowerFromOtherUtilitiesOEElectricELE: '他社購入電力料',
  PurchasedPowerFromOtherSuppliersOEElectricELE: '他社小売電気事業者購入電力料',
  TransmissionExpensesOEElectricELE: '送電費',
  TransformationExpensesOEElectricELE: '変電費',
  DistributionExpensesOEElectricELE: '配電費',
  SellingExpensesOEElectricELE: '販売費',
  CostOfLoanedFacilitiesOEElectricELE: '貸付設備費',
  GeneralAndAdministrativeExpensesOEElectricELE: '一般管理費',
  LevyUnderActOnPurchaseOfRenewableEnergySourcedElectricityOEElectricELE: '再生可能エネルギー発電促進賦課金',
  ElectricPowerDevelopmentPromotionTaxOEElectricELE: '電源開発促進税',
  EnterpriseTaxOEElectricELE: '事業税',
  TransferredCostOfElectricityForConstructionAndIncidentalBusinessOEElectricELE: '工事・付帯事業振替額',
  AmortizationOfSuspenseAccountRelatedToNuclearPowerDecommissioningOEElectricELE: '原子力廃炉関連仮勘定償却額',
  ExpensesForThirdPartysPowerTransmissionServiceOEElectricELE: '第三者送電サービス費',
  
  // 付帯事業費用
  IncidentalBusinessOperatingExpensesELE: '付帯事業営業費用',
  OperatingExpensesEnergyFacilitiesServiceBusinessOEIncidentalELE: 'エネルギー設備サービス事業費',
  OperatingExpensesRealEstateRentBusinessOEIncidentalELE: '不動産賃貸事業費',
  OperatingExpensesGasSupplyBusinessOEElectricELE: 'ガス供給事業費',
  OperatingExpensesConsultingBusinessOEIncidentalELE: 'コンサルティング事業費',
  OperatingExpensesSharedOfficeBusinessOEIncidentalELE: 'シェアオフィス事業費',
  OperatingExpensesOtherBusinessesOEIncidentalELE: 'その他事業費',
  
  // その他営業外・特別項目
  FinancialRevenueNORELE: '財務収益',
  NonOperatingRevenueNORELE: '営業外収益',
  GainOnSalesOfNoncurrentAssetsNOIELE: '固定資産売却益',
  MiscellaneousRevenueNORELE: '雑収益',
  DividendIncome: '受取配当金',
  EquityInEarningsLossesOfAffiliates: '持分法投資損益',
  FinancialExpensesNOEELE: '財務費用',
  StockIssuanceCostNOE: '株式交付費',
  BondIssuanceCostNOE: '社債発行費',
  NonOperatingExpensesNOEELE: '営業外費用',
  LossOnSalesOfNoncurrentAssetsNOEELE: '固定資産売却損',
  MiscellaneousExpensesNOEELE: '雑損失',
  
  // 引当金・準備金
  ProvisionOrReversalOfReserveForPreparationOfTheDepreciationOfNuclearPowerConstructionELE: '原子力発電施設解体引当金繰入又は戻入',
  ProvisionOfReserveForPreparationOfTheDepreciationOfNuclearPowerConstructionELE: '原子力発電施設解体引当金繰入',
  ReversalOfReserveForPreparationOfTheDepreciationOfNuclearPowerConstructionELE: '原子力発電施設解体引当金戻入',
  ProvisionOfReserveForOverseasInvestmentLoss: '海外投資等損失引当金繰入',
  ReversalOfReserveForOverseasInvestmentLoss: '海外投資等損失引当金戻入',
  ProvisionOfReserveForSpecialDisasterELE: '渇水準備引当金繰入',
  ProvisionOrReversalOfReserveForFluctuationInWaterLevelsELE: '渇水準備引当金繰入又は戻入',
  ProvisionOfReserveForFluctuationInWaterLevelsELE: '渇水準備引当金繰入',
  ReversalOfReserveForFluctuationInWaterLevelsELE: '渇水準備引当金戻入',
  DecreaseIncreaseInReserveFundForReprocessingOfIrradiatedNuclearFuelOpeCFELE: '使用済燃料再処理等積立金の増減',
  IncreaseDecreaseInReserveFundForNuclearReactorDecommissioningOpeCFELE: '原子力廃炉積立金の増減',
  DecreaseIncreaseInReserveFundForNuclearReactorDecommissioningOpeCFELE: '原子力廃炉積立金の増減',
  IncreaseDecreaseInProvisionForPreparationOfRemovalOfReactorCoresInSpecifiedNuclearPowerFacilitiesOpeCFELE: '特定原子力発電施設炉心等除去準備引当金の増減',
  
  // 原子力・災害関連
  PaymentsForExtraordinaryLossOnTheTohokuChihouTaiheiyouOkiEarthquakeOpeCF: '東日本大震災特別損失の支払額',
  GrantsInAidFromNuclearDamageLiabilityAndNuclearReactorDecommissionFacilitationFundOpeCF: '原子力損害賠償・廃炉等支援機構交付金',
  GrantsInAidFromNuclearDamageLiabilityAndNuclearReactorDecommissionFacilitationFundReceivedOpeCF: '原子力損害賠償・廃炉等支援機構交付金の受取額',
  GrantsInAidFromNuclearDamageCompensationFacilitationCorporationReceivedOpeCF: '原子力損害賠償支援機構交付金の受取額',
  CompensationForNuclearPowerRelatedDamagesPaidOpeCFELE: '原子力損害賠償費の支払額',
  LossOnDecommissioningOfTEPCOFukushimaDainiNuclearPowerStationSegmentInformation: '福島第二原発廃炉損失',
  
  // 株主資本等
  PurchaseOfTreasuryStock: '自己株式の取得',
  DisposalOfTreasuryStock: '自己株式の処分',
  ReversalOfRevaluationReserveForLand: '土地再評価差額金の取崩',
  Other: 'その他',
  TotalChangesOfItemsDuringThePeriod: '当期変動額合計',
  NetChangesOfItemsOtherThanShareholdersEquity: '株主資本以外の項目の当期変動額',
  ChangeInTreasurySharesOfParentArisingFromTransactionsWithNonControllingShareholders: '非支配株主との取引に係る親会社の持分変動',
  ChangeOfScopeOfEquityMethod: '持分法適用範囲の変動',
  DecreaseByCorporateDivisionsplitoffType: '会社分割による減少',
  DecreaseInCashAndCashEquivalentsDueToChangeInScopeOfConsolidation: '連結範囲変更に伴う現金及び現金同等物の減少額',
  IncreaseDecreaseInCashAndCashEquivalentsResultingFromChangeOfScopeOfConsolidationCCE: '連結範囲変更に伴う現金及び現金同等物の増減額',
  
  // 役員報酬・監査報酬
  AuditFeesReportingCompany: '監査報酬（提出会社）',
  NonAuditFeesReportingCompany: '非監査業務報酬（提出会社）',
  AuditFeesConsolidatedSubsidiaries: '監査報酬（連結子会社）',
  NonAuditFeesConsolidatedSubsidiaries: '非監査業務報酬（連結子会社）',
  NonAuditFeesReportingCompanyNetworkFirms: '非監査業務報酬（提出会社・ネットワーク）',
  AuditFeesConsolidatedSubsidiariesNetworkFirms: '監査報酬（連結子会社・ネットワーク）',
  NonAuditFeesConsolidatedSubsidiariesNetworkFirms: '非監査業務報酬（連結子会社・ネットワーク）',
  AuditFeesTotal: '監査報酬合計',
  NonAuditFeesTotal: '非監査業務報酬合計',
  AuditFeesTotalNetworkFirms: '監査報酬合計（ネットワーク）',
  NonAuditFeesTotalNetworkFirms: '非監査業務報酬合計（ネットワーク）',
  TotalAmountOfRemunerationEtcRemunerationEtcByCategoryOfDirectorsAndOtherOfficers: '報酬等総額',
  FixedRemunerationRemunerationEtcByCategoryOfDirectorsAndOtherOfficers: '固定報酬',
  FixedRemunerationRemunerationByCategoryOfDirectorsAndOtherOfficers: '固定報酬',
  BaseRemunerationRemunerationEtcByCategoryOfDirectorsAndOtherOfficers: '基本報酬',
  PerformanceBasedRemunerationRemunerationEtcByCategoryOfDirectorsAndOtherOfficers: '業績連動報酬',
  PerformanceBasedRemunerationRemunerationByCategoryOfDirectorsAndOtherOfficers: '業績連動報酬',
  NumberOfDirectorsAndOtherOfficersRemunerationEtcByCategoryOfDirectorsAndOtherOfficers: '役員人数',
  
  // 投資有価証券関連
  NumberOfIssuesWhoseNumberOfSharesIncreasedSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany: '取得銘柄数（提出会社）',
  TotalAcquisitionCostForIncreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany: '取得額合計（提出会社）',
  NumberOfIssuesWhoseNumberOfSharesDecreasedSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany: '売却銘柄数（提出会社）',
  TotalSaleAmountForDecreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentReportingCompany: '売却額合計（提出会社）',
  NumberOfIssuesWhoseNumberOfSharesIncreasedSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany: '取得銘柄数（最大保有会社）',
  TotalAcquisitionCostForIncreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany: '取得額合計（最大保有会社）',
  TotalAcquisitionCostForIncreasedSharesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany: '取得額合計（最大保有会社）',
  NumberOfIssuesWhoseNumberOfSharesDecreasedSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany: '売却銘柄数（第2位保有会社）',
  TotalSaleAmountForDecreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany: '売却額合計（第2位保有会社）',
  TotalSalesAmountForDecreasedSharesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentReportingCompany: '売却額合計（提出会社）',
  TotalSalesAmountForDecreasedSharesEquitySecuritiesNotListedInvestmentEquitySecuritiesHeldForPurposesOtherThanPureInvestmentLargestHoldingCompany: '売却額合計（最大保有会社）',
  NumberOfIssuesWhoseNumberOfSharesIncreasedSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany: '取得銘柄数（第2位保有会社）',
  TotalAcquisitionCostForIncreasedSharesSharesNotListedInvestmentSharesHeldForPurposesOtherThanPureInvestmentSecondLargestHoldingCompany: '取得額合計（第2位保有会社）',
};

const fallbackLabelCache = new Map<string, string>();

const tokenDictionary: Record<string, string> = {
  accounting: '会計',
  activities: '活動',
  affiliated: '関係',
  all: '全',
  and: '',
  antimonopolyact: '独占禁止法',
  article: '条',
  assets: '資産',
  attributable: '帰属する',
  based: 'に基づく',
  basic: '基本',
  bookvalue: '帳簿価額',
  business: '事業',
  by: '',
  calculated: '計算された',
  calculation: '計算',
  capital: '資本',
  carrying: '帳簿',
  cash: '現金',
  cf: 'CF',
  cfifrs: 'IFRS CF',
  cfele: '電力CF',
  charge: '費用',
  classified: '分類された',
  commercial: '商業',
  commission: '委員会',
  components: '構成要素',
  comprehensive: '包括',
  consolidation: '連結',
  constituting: '構成する',
  consumption: '消費',
  consignment: '委託',
  corporations: '法人',
  customers: '顧客',
  cumulative: '累積',
  dei: 'DEI',
  derivative: 'デリバティブ',
  derivatives: 'デリバティブ',
  details: '詳細',
  due: '期限到来',
  effects: '影響',
  electric: '電気',
  energy: 'エネルギー',
  enforcement: '施行',
  equivalents: '同等物',
  financial: '財務',
  flow: 'フロー',
  foreigners: '外国人',
  for: '',
  from: '',
  grants: '交付金',
  groups: 'グループ',
  held: '保有',
  highest: '最高',
  ifrs: 'IFRS',
  imbalance: 'インバランス',
  impairment: '減損',
  in: '',
  income: '利益',
  increase: '増加',
  interest: '利息',
  internal: '内部',
  international: '国際',
  issued: '発行済',
  issuance: '発行',
  item: '項目',
  largest: '最大',
  lease: 'リース',
  legal: '法的',
  length: '期間',
  loaded: '積載',
  loss: '損失',
  lowest: '最低',
  method: '方法',
  names: '名称',
  noe: '営業外費用',
  national: '国',
  notlisted: '非上場',
  of: '',
  on: '',
  operating: '営業',
  options: 'オプション',
  ordinance: '条例',
  other: 'その他',
  ownership: '所有',
  package: 'パッケージ',
  paper: '紙',
  papers: '書類',
  parent: '親会社',
  per: '当たり',
  payout: '支払',
  ppe: '有形固定資産',
  portion: '部分',
  preferred: '優先',
  price: '価格',
  provisions: '引当金',
  providers: '提供者',
  pure: '純',
  ratio: '比率',
  recognized: '認識された',
  related: '関連',
  relating: '関連する',
  resulting: '結果として生じる',
  results: '結果',
  retirement: '退職',
  return: 'リターン',
  reversal: '戻入',
  rights: '権利',
  sale: '売却',
  scope: '範囲',
  secondlargest: '第2位',
  segregated: '分離された',
  service: 'サービス',
  services: 'サービス',
  sga: '販管費',
  share: '株式',
  shareholders: '株主',
  shareholdings: '持株',
  sold: '売却された',
  solution: '解決策',
  specified: '特定',
  standards: '基準',
  submission: '提出',
  summary: '要約',
  syndicate: 'シンジケート',
  taking: '取得',
  than: '',
  the: '',
  those: '',
  to: '',
  transaction: '取引',
  transfer: '振替',
  unit: '単位',
  using: '使用',
  utility: '公益事業',
  utilities: '公益事業',
  voting: '議決権',
  waterlevels: '水位',
  whose: '',
  with: '',
  working: '運転',
  writedowns: '評価減',
  
  // 既存の辞書から必要なものを維持（重複は上記で上書きされる）
  expenses: '費用',
  selling: '販売',
  general: '一般',
  administrative: '管理',
  research: '研究',
  development: '開発',
  salaries: '給与',
  salary: '給与',
  allowances: '手当',
  allowance: '引当金',
  interests: '持分',
  dividend: '配当',
  dividends: '配当',
  inventory: '在庫',
  inventories: '棚卸資産',
  merchandise: '商品',
  goods: '製品',
  finished: '完成',
  work: '仕掛',
  progress: '進捗',
  construction: '建設',
  advance: '前払',
  advances: '前受',
  prepaid: '前払',
  equipment: '設備',
  machinery: '機械',
  vehicles: '車両',
  buildings: '建物',
  structures: '構築物',
  land: '土地',
  intangible: '無形',
  investment: '投資',
  investments: '投資',
  securities: '有価証券',
  security: '証券',
  loans: '貸付金',
  loan: '借入',
  long: '長',
  short: '短',
  term: '期',
  payabletrade: '買掛金',
  receivabletrade: '売掛金',
  notes: '手形',
  deposits: '預り金',
  deposit: '預り金',
  borrowed: '借入',
  bond: '社債',
  bonds: '社債',
  employee: '従業員',
  employees: '従業員',
  female: '女性',
  male: '男性',
  directors: '取締役',
  officers: '役員',
  executive: '執行',
  number: '数',
  average: '平均',
  annual: '年間',
  monthly: '月次',
  years: '年',
  age: '年齢',
  percentage: '割合',
  change: '変動',
  changes: '変動',
  decreased: '減少',
  decrease: '減少',
  decreaseincrease: '増減',
  increasedecrease: '増減',
  total: '合計',
  totalnumber: '総数',
  totalsale: '売却総額',
  totalsales: '売上合計',
  totalsalesamount: '売却額合計',
  totalsalesamountfor: '売却額合計',
  totalsalesamountfordecreasedshares: '売却額合計',
  totalsalesamountforincreasedshares: '取得額合計',
  totalsaleamount: '売却額合計',
  totalamount: '総額',
  totalassets: '総資産',
  totalshareholderreturn: '株主総還元',
  valuationandtranslation: '評価換算',
  translationadjustments: '換算調整',
  valuationdifference: '評価差額',
  shareholdingratio: '持株比率',
  shareholdingratiotreasuryshares: '自己株式比率',
  treasuryshares: '自己株式',
  shareholdingratios: '持株比率',
  owner: '株主',
  owners: '株主',
  ownersequity: '自己資本',
  roe: 'ROE',
  ope: '営業',
  inv: '投資',
  fin: '財務',
  ele: '電力',
  caele: '流動資産（電力）',
  clele: '流動負債（電力）',
  nclele: '固定負債（電力）',
  ioaele: '投資その他資産（電力）',
  cae: '流動資産',
  ca: '流動資産',
  cl: '流動負債',
  ncl: '固定負債',
  nca: '固定資産',
  ia: '無形資産',
  ioa: '投資その他資産',
  oes: '営業費用',
  oeelectric: '電気事業費用',
  oparating: '営業費用',
  cost: '費用',
  costs: '費用',
  raw: '原料',
  materials: '材料',
  supplies: '貯蔵品',
  repair: '修繕',
  maintenance: '保守',
  expenseelectric: '電力費用',
  incub: '育成',
  overseas: '海外',
  regional: '地域',
  incidental: '付帯',
  plant: '設備',
  plants: '設備',
  facility: '設備',
  facilities: '設備',
  transmission: '送電',
  distribution: '配電',
  transformation: '変電',
  hydroelectric: '水力',
  thermal: '火力',
  renewable: '再生可能',
  engine: '内燃機',
  combustion: '燃焼',
  nuclearpower: '原子力',
  reactor: '炉',
  decommissioning: '廃炉',
  removal: '除去',
  reprocessing: '再処理',
  spent: '使用済',
  fuel: '燃料',
  disaster: '災害',
  special: '特別',
  fluctuation: '変動',
  resource: '資源',
  overseasinvestment: '海外投資',
  guarantee: '保証',
  guarantees: '保証',
  directorsbonuses: '役員賞与',
  bonuses: '賞与',
  remuneration: '報酬',
  performance: '業績',
  linked: '連動',
  awards: '付与',
  stock: '株式',
  instrument: '金融商品',
  instruments: '金融商品',
  contribution: '拠出',
  payablefor: '支払対象',
  contract: '契約',
  contracts: '契約',
  liabilitiesand: '負債と',
  netassets: '純資産',
  cashflows: 'キャッシュフロー',
  flows: 'フロー',
  before: '前',
  after: '後',
  effect: '影響',
  effective: '実効',
  rate: '率',
  rates: '率',
  returnon: '利回り',
  index: '指数',
  shareprice: '株価',
  percent: '割合',
  amountof: '金額',
  ratioof: '比率',
  rateof: '比率',
  minority: '少数',
  non: '非',
  controlling: '支配',
  associates: '関連会社',
  subsidiaries: '子会社',
  subsidiary: '子会社',
  unconsolidated: '非連結',
  consolidated: '連結',
  changeof: '変更',
  changesin: '変動',
  increaseby: '増加',
  decreaseby: '減少',
  absorptions: '吸収',
  absorption: '吸収',
  merger: '合併',
  combination: '結合',
  employeescalculated: '従業員',
  childcare: '育児',
  caregiver: '介護',
  leave: '休暇',
  family: '家族',
  members: '構成員',
  metrics: '指標',
  information: '情報',
  about: '',
  reporting: '提出会社',
  company: '会社',
  companies: '会社',
  consolidatedsubsidiaries: '連結子会社',
  proposal: '提案',
  averageannualsalary: '平均年間給与',
  averageage: '平均年齢',
  averagelength: '平均勤続年数',
  averagenumber: '平均人数',
  temporary: '臨時',
  workers: '労働者',
  wages: '賃金',
  difference: '差',
  differences: '差',
  childcareleave: '育児休業',
  caregivers: '介護者',
  caregiversleave: '介護休暇',
  measurement: '測定',
  metricsOf: '指標',
  pureinvestment: '純投資',
  purposes: '目的',
  holding: '保有',
  shares: '株式',
  issue: '銘柄',
  issues: '銘柄',
  increased: '増加',
  carryingamount: '帳簿価額',
  acquisition: '取得',
  salesamount: '売却額',
  proceeds: '収入',
  payments: '支出',
  purchase: '取得',
  purchases: '取得',
  collection: '回収',
  collected: '回収',
  effectsof: '影響',
  refund: '還付',
  refunds: '還付',
  prior: '前',
  period: '期間',
  periods: '期間',
  payableother: 'その他支払',
  receivableother: 'その他受取',
  loaned: '貸付',
  load: '負荷',
  allowancefor: '引当金',
  assetretirement: '資産除去',
  obligations: '債務',
  intangibleassets: '無形資産',
  property: '資産',
  kpi: 'KPI',
  dscr: 'DSCR',
  paid: '支払済',
  financing: '財務活動',
  payment: '支払',
  received: '受取',
  net: '純',
  gross: '総',
  extraordinary: '特別',
  debt: '負債',
  maturity: '満期',
  marketable: '売買目的',
  available: '売却可能',
};

const normalizedTokenDictionary: Record<string, string> = Object.fromEntries(
  Object.entries(tokenDictionary).map(([key, value]) => [key.toLowerCase(), value]),
);

const splitKeyTokens = (value: string) => value.match(/[A-Z]+(?=[A-Z][a-z]|[0-9])|[A-Z]?[a-z]+|[0-9]+|[A-Z]+/g) ?? [value];

const toKatakana = (_token: string): string => {
  // 辞書にない英単語は空文字列を返す（表示しない）
  return '';
};

const convertTokens = (tokens: string[]) =>
  tokens
    .map((token) => {
      const normalized = token.toLowerCase();
      const direct = normalizedTokenDictionary[normalized];
      if (direct) {
        return direct;
      }
      return toKatakana(token);
    })
    .join('');

const convertRaw = (raw: string) => convertTokens(splitKeyTokens(raw));

const patternHandlers: Array<{ regex: RegExp; handler: (match: RegExpExecArray) => string }> = [
  { regex: /^NumberOf(.+)$/, handler: (match) => `${convertRaw(match[1])}数` },
  { regex: /^TotalNumberOf(.+)$/, handler: (match) => `${convertRaw(match[1])}総数` },
  { regex: /^TotalAmountOf(.+)$/, handler: (match) => `${convertRaw(match[1])}総額` },
  { regex: /^TotalSalesAmountFor(.+)$/, handler: (match) => `${convertRaw(match[1])}売却額` },
  { regex: /^TotalAcquisitionCostFor(.+)$/, handler: (match) => `${convertRaw(match[1])}取得額` },
  { regex: /^PercentageOf(.+)$/, handler: (match) => `${convertRaw(match[1])}構成比` },
  { regex: /^RatioOf(.+)$/, handler: (match) => `${convertRaw(match[1])}比率` },
  { regex: /^RateOf(.+)$/, handler: (match) => `${convertRaw(match[1])}率` },
  { regex: /^IncreaseDecreaseIn(.+)$/, handler: (match) => `${convertRaw(match[1])}の増減` },
  { regex: /^DecreaseIncreaseIn(.+)$/, handler: (match) => `${convertRaw(match[1])}の増減` },
  { regex: /^IncreaseIn(.+)$/, handler: (match) => `${convertRaw(match[1])}の増加` },
  { regex: /^DecreaseIn(.+)$/, handler: (match) => `${convertRaw(match[1])}の減少` },
  { regex: /^ProvisionFor(.+)$/, handler: (match) => `${convertRaw(match[1])}引当金` },
  { regex: /^ReserveFor(.+)$/, handler: (match) => `${convertRaw(match[1])}準備金` },
  { regex: /^ReserveFundFor(.+)$/, handler: (match) => `${convertRaw(match[1])}積立金` },
  { regex: /^ProvisionOf(.+)$/, handler: (match) => `${convertRaw(match[1])}引当金繰入` },
  { regex: /^LossOn(.+)$/, handler: (match) => `${convertRaw(match[1])}損失` },
  { regex: /^GainOn(.+)$/, handler: (match) => `${convertRaw(match[1])}益` },
  { regex: /^LossGainOn(.+)$/, handler: (match) => `${convertRaw(match[1])}損益` },
  { regex: /^ChangeOf(.+)$/, handler: (match) => `${convertRaw(match[1])}の変更` },
  { regex: /^ChangeIn(.+)$/, handler: (match) => `${convertRaw(match[1])}の変動` },
  { regex: /^NetIncreaseDecreaseIn(.+)$/, handler: (match) => `${convertRaw(match[1])}純増減` },
  { regex: /^CashFlowsFromUsedIn(.+)$/, handler: (match) => `${convertRaw(match[1])}によるキャッシュフロー` },
  { regex: /^CashAndCashEquivalents(.+)$/, handler: (match) => `現金及び現金同等物${convertRaw(match[1])}` },
];

export const translateFinancialLabel = (key: string): string => {
  if (fieldLabelMap[key]) {
    return fieldLabelMap[key];
  }
  if (fallbackLabelCache.has(key)) {
    return fallbackLabelCache.get(key)!;
  }
  for (const { regex, handler } of patternHandlers) {
    const matched = regex.exec(key);
    if (matched) {
      const label = handler(matched) || convertRaw(key);
      fallbackLabelCache.set(key, label);
      return label;
    }
  }
  const label = convertRaw(key);
  fallbackLabelCache.set(key, label);
  return label;
};

const formatCellValue = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    return formatNumber(value);
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return formatNumber(numeric);
  }

  return value;
};

/**
 * ComparisonFinancialTable - 3社財務諸表比較テーブル
 */
export function ComparisonFinancialTable({ type, title, selectedYear }: ComparisonFinancialTableProps) {
  
  // 3社のデータ読み込み
  const tepco = useFinancialCSV('TEPCO', type);
  const chubu = useFinancialCSV('CHUBU', type);
  const jera = useFinancialCSV('JERA', type);

  const targetFiscalYear = typeof selectedYear === 'number' ? selectedYear - 1 : null;

  const findByFiscalYear = useCallback(
    (dataset: FinancialData[] | undefined | null) => {
      if (!dataset || targetFiscalYear === null) {
        return null;
      }

      return (
        dataset.find((row) => {
          const fiscalYear = row.fiscal_year;
          if (typeof fiscalYear === 'number') {
            return fiscalYear === targetFiscalYear;
          }
          return String(fiscalYear) === String(targetFiscalYear);
        }) ?? null
      );
    },
    [targetFiscalYear],
  );

  const tepcoData = useMemo(() => findByFiscalYear(tepco.data), [findByFiscalYear, tepco.data]);
  const chubuData = useMemo(() => findByFiscalYear(chubu.data), [findByFiscalYear, chubu.data]);
  const jeraData = useMemo(() => findByFiscalYear(jera.data), [findByFiscalYear, jera.data]);

  // 全項目のキーを取得（3社のデータから）
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    [tepcoData, chubuData, jeraData].forEach(data => {
      if (data) {
        Object.keys(data).forEach(key => {
          // メタデータ列を除外
          if (key !== 'fiscal_year' && key !== 'date' && key !== 'company_code') {
            keys.add(key);
          }
        });
      }
    });
    return Array.from(keys).sort();
  }, [tepcoData, chubuData, jeraData]);

  // ローディング表示
  if (tepco.loading || chubu.loading || jera.loading) {
    return (
      <section className="neumorphic-card p-6 bold-border financial-table-card">
        <div className="text-center mb-6">
          <h3 className="section-heading">{title}</h3>
        </div>
        <div className="loading">データ読み込み中...</div>
      </section>
    );
  }

  // エラー表示
  if (tepco.error || chubu.error || jera.error) {
    return (
      <section className="neumorphic-card p-6 bold-border financial-table-card">
        <div className="text-center mb-6">
          <h3 className="section-heading">{title}</h3>
        </div>
        <div className="warning-container is-warning p-6 text-center">
          <p className="warning-title">データ読み込みエラー:</p>
          {tepco.error && <p className="warning-text">TEPCO: {String(tepco.error)}</p>}
          {chubu.error && <p className="warning-text">CHUBU: {String(chubu.error)}</p>}
          {jera.error && <p className="warning-text">JERA: {String(jera.error)}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="neumorphic-card p-6 bold-border financial-table-card" aria-live="polite">
      <div className="text-center space-y-2 mb-6">
        <h3 className="section-heading">
          {title}
          <span className="text-sm text-gray-400 ml-4 font-normal">（単位：百万円）</span>
        </h3>
      </div>

      <div className="table-wrapper">
        <table className="financial-table w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="financial-metric">項目</th>
              <th className="financial-company text-right" style={{ color: '#00FF84' }}>
                {companyNames.TEPCO}
              </th>
              <th className="financial-company text-right" style={{ color: '#FF00FF' }}>
                {companyNames.CHUBU}
              </th>
              <th className="financial-company text-right" style={{ color: '#00D4FF' }}>
                {companyNames.JERA}
              </th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => (
              <tr key={key}>
                <td className="financial-metric">
                  {translateFinancialLabel(key)}
                </td>
                <td className="financial-value">
                  {tepcoData ? formatCellValue(tepcoData[key]) : '-'}
                </td>
                <td className="financial-value">
                  {chubuData ? formatCellValue(chubuData[key]) : '-'}
                </td>
                <td className="financial-value">
                  {jeraData ? formatCellValue(jeraData[key]) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {allKeys.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            選択した年度のデータがありません
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-cyber-blue">
        {allKeys.length}項目を表示
      </div>
    </section>
  );
}
