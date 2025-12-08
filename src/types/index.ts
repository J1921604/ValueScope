/**
 * ValueScope 型定義ファイル
 * Version: 1.0.0
 * Date: 2025-12-15
 */

/** 企業コード */
export type CompanyCode = 'E04498' | 'E04502' | 'E34837';

/** 企業名 */
export type CompanyName = 'TEPCO' | 'CHUBU' | 'JERA';

/** 期間フィルター */
export type PeriodFilter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual' | 'Custom';

/** 信号機評価色 */
export type ScoreColor = 'green' | 'yellow' | 'red';

/** 企業価値データ */
export interface ValuationData {
  /** データID */
  id: string;
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 企業コード */
  companyCode: CompanyCode;
  /** 企業名 */
  companyName: CompanyName;
  /** 時価総額（百万円） */
  marketCap: number;
  /** 純有利子負債（百万円） */
  netDebt: number;
  /** 企業価値 EV（百万円） */
  enterpriseValue: number;
  /** EBITDA（百万円） */
  ebitda: number;
  /** EV/EBITDA倍率 */
  evEbitdaRatio: number;
  /** 当期純利益（百万円） */
  netIncome: number;
  /** PER（株価収益率） */
  per: number;
  /** 純資産（百万円） */
  equity: number;
  /** PBR（株価純資産倍率） */
  pbr: number;
  /** 前期比変動（%） */
  changeFromPrior?: number;
}

/** KPIデータ（電力業界特化版） */
export interface KPIData {
  /** データID */
  id: string;
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 企業コード */
  companyCode: CompanyCode;
  /** 企業名 */
  companyName: CompanyName;
  /** ROIC（投下資本利益率、%） */
  roic: number;
  /** WACC（加重平均資本コスト、%） */
  wacc: number;
  /** EBITDAマージン（%） */
  ebitdaMargin: number;
  /** FCFマージン（%） */
  fcfMargin: number;
  /** 前期比変動 */
  changeFromPrior?: {
    roic: number;
    wacc: number;
    ebitdaMargin: number;
    fcfMargin: number;
  };
}

/** スコアカードデータ（電力業界特化版） */
export interface ScoreCardData {
  /** データID */
  id: string;
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 企業コード */
  companyCode: CompanyCode;
  /** 企業名 */
  companyName: CompanyName;
  /** ROICスコア */
  roicScore: ScoreColor;
  /** ROIC値（%） */
  roicValue: number;
  /** WACCスコア */
  waccScore: ScoreColor;
  /** WACC値（%） */
  waccValue: number;
  /** EBITDAマージンスコア */
  ebitdaMarginScore: ScoreColor;
  /** EBITDAマージン値（%） */
  ebitdaMarginValue: number;
  /** FCFマージンスコア */
  fcfMarginScore: ScoreColor;
  /** FCFマージン値（%） */
  fcfMarginValue: number;
  /** 前期比変動 */
  changeFromPrior?: {
    roic: number;
    wacc: number;
    ebitdaMargin: number;
    fcfMargin: number;
  };
}

/** 閾値定義 */
export interface ThresholdData {
  /** KPI名 */
  kpiName: 'roic' | 'wacc' | 'ebitdaMargin' | 'fcfMargin';
  /** KPI表示名 */
  displayName: string;
  /** 青色閾値（優良）- この値以上で青 */
  greenThreshold: number;
  /** 黄色閾値（普通）- この値以上で黄、未満で赤 */
  yellowThreshold: number;
  /** 最小値（ゲージ表示用） */
  min?: number;
  /** 最大値（ゲージ表示用） */
  max?: number;
  /** 単位 */
  unit: '%' | '倍';
  /** 説明 */
  description: string;
}

/** 貸借対照表データ */
export interface BalanceSheetData {
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 企業コード */
  companyCode: CompanyCode;
  /** 流動資産（百万円） */
  currentAssets: number;
  /** 固定資産（百万円） */
  nonCurrentAssets: number;
  /** 総資産（百万円） */
  totalAssets: number;
  /** 流動負債（百万円） */
  currentLiabilities: number;
  /** 固定負債（百万円） */
  nonCurrentLiabilities: number;
  /** 総負債（百万円） */
  totalLiabilities: number;
  /** 純資産（百万円） */
  equity: number;
  /** 有利子負債（百万円） */
  interestBearingDebt: number;
  /** 現金及び預金（百万円） */
  cashAndDeposits: number;
}

/** 損益計算書データ */
export interface ProfitLossData {
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 企業コード */
  companyCode: CompanyCode;
  /** 売上高（百万円） */
  revenue: number;
  /** 営業利益（百万円） */
  operatingIncome: number;
  /** 経常利益（百万円） */
  ordinaryIncome: number;
  /** 当期純利益（百万円） */
  netIncome: number;
  /** EBITDA（百万円） */
  ebitda: number;
  /** 減価償却費（百万円） */
  depreciation: number;
}

/** EDINET APIレスポンス */
export interface EDINETResponse {
  /** メタデータ */
  metadata: {
    /** タイトル */
    title: string;
    /** 発行日 */
    issueDate: string;
    /** 企業コード */
    secCode: string;
  };
  /** 結果リスト */
  results: Array<{
    /** 書類ID */
    docID: string;
    /** 企業名 */
    filerName: string;
    /** 書類種別 */
    docDescription: string;
    /** 提出日 */
    submitDateTime: string;
  }>;
}

/** チャート用時系列データ */
export interface TimeSeriesData {
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** ROIC（%） */
  roic?: number;
  /** WACC（%） */
  wacc?: number;
  /** EBITDAマージン（%） */
  ebitdaMargin?: number;
  /** FCFマージン（%） */
  fcfMargin?: number;
  /** EV/EBITDA倍率 */
  evEbitdaRatio?: number;
}

/** レーダーチャート用データ */
export interface RadarChartData {
  /** 評価軸 */
  subject: string;
  /** 東京電力HDの値 */
  TEPCO: number;
  /** 中部電力の値 */
  CHUBU: number;
  /** 最大値（正規化用） */
  fullMark: number;
}

/** 従業員情報データ */
export interface EmployeeData {
  /** 年度 */
  year: number;
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 平均年間給与（円） */
  averageAnnualSalary: number;
  /** 平均勤続年数（年） */
  averageLengthOfServiceYears: number;
  /** 平均勤続年数（月） */
  averageLengthOfServiceMonths: number | null;
  /** 平均年齢（歳） */
  averageAgeYears: number;
  /** 平均年齢（月） */
  averageAgeMonths: number | null;
  /** 従業員数（人） */
  numberOfEmployees: number;
}

/** 従業員情報レスポンス */
export interface EmployeeDataResponse {
  /** データ基準日 */
  asOf: string;
  /** 東京電力HD従業員情報 */
  TEPCO: EmployeeData[];
  /** 中部電力従業員情報 */
  CHUBU: EmployeeData[];
  /** JERA従業員情報 */
  JERA: EmployeeData[];
}
