/**
 * ComparisonTable.tsx - 3社企業価値比較テーブルコンポーネント
 * Version: 1.0.0
 * Date: 2025-12-15
 * 
 * 憲法遵守:
 * - 3社の企業価値指標を横並びで比較表示
 * - Cyberpunk Neumorphismスタイル
 */

import { formatNumber } from '../utils/formatNumber';
import type { CompanyName } from '../types';
import type { TimeSeriesDataPoint } from '../hooks/useTimeseries';
import { useTimeseries } from '../hooks/useTimeseries';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

type EVIndicatorKey = 
  | 'enterpriseValue' 
  | 'marketCap'
  | 'stockPrice'
  | 'interestBearingDebt'
  | 'cashAndDeposits'
  | 'netDebt'
  | 'operatingCashFlow'
  | 'ebitda'
  | 'evEbitdaRatio' 
  | 'netIncome'
  | 'per' 
  | 'equity'
  | 'pbr'
  // 14項目追加
  | 'revenue'
  | 'operatingIncome'
  | 'ordinaryIncome'
  | 'totalAssets'
  | 'netAssets'
  | 'investingCashFlow'
  | 'financingCashFlow';

interface ComparisonTableProps {
  data: Partial<Record<CompanyName, TimeSeriesDataPoint | null>>;
}

const companyMeta: Record<CompanyName, { label: string; color: string }> = {
  TEPCO: { label: '東京電力HD', color: '#00FF84' },
  CHUBU: { label: '中部電力', color: '#FF00FF' },
  JERA: { label: 'JERA', color: '#00D4FF' },
};

const indicators: Array<{
  key: EVIndicatorKey;
  label: string;
  description: string;
  format: (value: number) => string;
  category?: 'PL' | 'BS' | 'CF' | 'EV';
}> = [
  // PL項目（14項目対応）
  {
    key: 'revenue',
    label: '売上高（営業収益）',
    description: '企業の本業による売上。XBRLタグ: jpcrp_cor:OperatingRevenue',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  {
    key: 'operatingIncome',
    label: '営業利益',
    description: '本業の稼ぐ力を示す利益。XBRLタグ: jpcrp_cor:OperatingIncome',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  {
    key: 'ordinaryIncome',
    label: '経常利益',
    description: '営業外収支を含めた経常的な利益。XBRLタグ: jpcrp_cor:OrdinaryIncome',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  {
    key: 'netIncome',
    label: '当期純利益',
    description: '税引後の最終利益。XBRLタグ: jpcrp_cor:ProfitLossAttributableToOwnersOfParent',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  {
    key: 'ebitda',
    label: 'EBITDA',
    description: '利払い・税引き・償却前利益。本業の稼ぐ力。計算式: 営業利益 + 減価償却費',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  // BS項目（14項目対応）
  {
    key: 'totalAssets',
    label: '総資産',
    description: '企業が保有する全資産。XBRLタグ: jpcrp_cor:Assets',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'netAssets',
    label: '純資産',
    description: '総資産から総負債を差し引いた純粋な資産。XBRLタグ: jpcrp_cor:NetAssets',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'equity',
    label: '自己資本',
    description: '株主に帰属する純資産。XBRLタグ: jpcrp_cor:Equity',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'interestBearingDebt',
    label: '有利子負債',
    description: '利息を支払う義務のある負債。XBRLタグ: jpcrp_cor:InterestBearingDebt',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'cashAndDeposits',
    label: '現金及び預金',
    description: '手元にある現金と銀行預金。XBRLタグ: jpcrp_cor:CashAndDeposits',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'netDebt',
    label: '純有利子負債',
    description: '有利子負債から現預金を差し引いた実質的な負債。計算式: 有利子負債 - 現金及び預金',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  // CF項目（14項目対応）
  {
    key: 'operatingCashFlow',
    label: '営業活動CF',
    description: '本業で稼いだ現金。XBRLタグ: jpcrp_cor:CashFlowsFromOperatingActivities',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'CF',
  },
  {
    key: 'investingCashFlow',
    label: '投資活動CF',
    description: '設備投資等による現金の増減。XBRLタグ: jpcrp_cor:CashFlowsFromInvestingActivities',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'CF',
  },
  {
    key: 'financingCashFlow',
    label: '財務活動CF',
    description: '借入・返済等による現金の増減。XBRLタグ: jpcrp_cor:CashFlowsFromFinancingActivities',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'CF',
  },
  // EV関連指標
  {
    key: 'enterpriseValue',
    label: '企業価値 (EV)',
    description: '時価総額＋純有利子負債。企業全体の買収価値を示す指標',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'EV',
  },
  {
    key: 'marketCap',
    label: '時価総額',
    description: '株価 × 発行済株式数',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'EV',
  },
  {
    key: 'stockPrice',
    label: '株価',
    description: '決算日時点の株価（終値ベース）',
    format: (value: number) => `${formatNumber(value, 0)}円`,
    category: 'EV',
  },
  {
    key: 'evEbitdaRatio',
    label: 'EV/EBITDA倍率',
    description: 'EVをEBITDAで割ったバリュエーション指標（低いほど割安）',
    format: (value: number) => `${formatNumber(value, 2)}x`,
    category: 'EV',
  },
  {
    key: 'per',
    label: 'PER',
    description: '株価収益率。株価が純利益の何倍かを示す（低いほど割安）',
    format: (value: number) => `${formatNumber(value, 2)}x`,
    category: 'EV',
  },
  {
    key: 'pbr',
    label: 'PBR',
    description: '株価純資産倍率。時価総額が純資産の何倍か（1倍未満で割安）',
    format: (value: number) => `${formatNumber(value, 2)}x`,
    category: 'EV',
  },
];

/**
 * ComparisonTable - 3社企業価値比較テーブル
 */
export function ComparisonTable({ data }: ComparisonTableProps) {
  const companies = (Object.keys(companyMeta) as CompanyName[]).map((company) => ({
    key: company,
    ...companyMeta[company],
    point: data?.[company] ?? null,
  }));

  // 全時系列データ取得（グラフ用）
  const { data: allTimeseriesData, loading: timeseriesLoading } = useTimeseries();

  const formatCell = (value: number | undefined, formatter: (val: number) => string) => {
    if (value === undefined || value === null) {
      return '-';
    }
    return formatter(value);
  };

  // グラフ用データ準備
  const prepareChartData = (metric: 'netIncome' | 'ebitda') => {
    if (!allTimeseriesData) return [];

    const allYears = new Set<number>();
    Object.values(allTimeseriesData).forEach(companyData => {
      if (companyData) {
        companyData.forEach((point: TimeSeriesDataPoint) => allYears.add(point.year));
      }
    });

    const sortedYears = Array.from(allYears).sort((a, b) => a - b);

    return sortedYears.map(year => {
      const point: { year: string; TEPCO?: number; CHUBU?: number; JERA?: number } = { year: `FY${year}` };
      
      if (allTimeseriesData.TEPCO) {
        const tepcoPoint = allTimeseriesData.TEPCO.find((d: TimeSeriesDataPoint) => d.year === year);
        if (tepcoPoint && tepcoPoint[metric] !== undefined) point.TEPCO = tepcoPoint[metric];
      }
      
      if (allTimeseriesData.CHUBU) {
        const chubuPoint = allTimeseriesData.CHUBU.find((d: TimeSeriesDataPoint) => d.year === year);
        if (chubuPoint && chubuPoint[metric] !== undefined) point.CHUBU = chubuPoint[metric];
      }
      
      if (allTimeseriesData.JERA) {
        const jeraPoint = allTimeseriesData.JERA.find((d: TimeSeriesDataPoint) => d.year === year);
        if (jeraPoint && jeraPoint[metric] !== undefined) point.JERA = jeraPoint[metric];
      }
      
      return point;
    });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="bg-gray-900 border border-cyan-500 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatNumber(entry.value)} 億円
          </p>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="neumorphic-card p-6 bold-border">
        <div className="text-center mb-6 space-y-1">
          <h3 className="section-heading">主要指標比較</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-cyber-blue/30">
                <th className="px-4 py-3 text-left font-semibold text-white uppercase tracking-wider">
                  指標
                </th>
                {companies.map((company) => (
                  <th
                    key={company.key}
                    className="p-4 text-center font-semibold"
                    style={{ color: company.color }}
                  >
                    <div>{company.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicators.map((indicator) => (
                <tr key={indicator.key} className="border-b hover:bg-surface-light transition-colors" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <td className="p-4 font-medium" style={{ color: '#ffffff' }}>
                    <span className="inline-flex items-center gap-2">
                      {indicator.label}
                      <span 
                        className="inline-flex items-center justify-center w-5 h-5 text-xs text-cyan-400 border border-cyan-400 rounded-full cursor-help hover:bg-cyan-400 hover:text-black transition-colors" 
                        title={indicator.description}
                        style={{ lineHeight: '1', fontWeight: 'bold' }}
                      >
                        ?
                      </span>
                    </span>
                  </td>
                  {companies.map((company) => (
                    <td key={company.key} className="p-4 text-center font-mono" style={{ color: '#f8fafc' }}>
                      {formatCell(company.point?.[indicator.key], indicator.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 当期純利益推移グラフ */}
      {!timeseriesLoading && allTimeseriesData && (
        <div className="neumorphic-card p-6 bold-border mt-6">
          <h3 className="section-heading text-center mb-6">当期純利益推移（過去10年）</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={prepareChartData('netIncome')} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="year" 
                stroke="#ffffff" 
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="#ffffff"
                style={{ fontSize: '0.875rem' }}
                label={{ value: '億円', angle: -90, position: 'insideLeft', style: { fill: '#ffffff' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#ffffff' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="TEPCO" 
                stroke="#00FF84" 
                strokeWidth={2}
                dot={{ fill: '#00FF84', r: 4 }}
                name="東京電力HD"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="CHUBU" 
                stroke="#FF00FF" 
                strokeWidth={2}
                dot={{ fill: '#FF00FF', r: 4 }}
                name="中部電力"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="JERA" 
                stroke="#00D4FF" 
                strokeWidth={2}
                dot={{ fill: '#00D4FF', r: 4 }}
                name="JERA"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* EBITDA推移グラフ */}
      {!timeseriesLoading && allTimeseriesData && (
        <div className="neumorphic-card p-6 bold-border mt-6">
          <h3 className="section-heading text-center mb-6">EBITDA推移（過去10年）</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={prepareChartData('ebitda')} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="year" 
                stroke="#ffffff" 
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="#ffffff"
                style={{ fontSize: '0.875rem' }}
                label={{ value: '億円', angle: -90, position: 'insideLeft', style: { fill: '#ffffff' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: '#ffffff' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="TEPCO" 
                stroke="#00FF84" 
                strokeWidth={2}
                dot={{ fill: '#00FF84', r: 4 }}
                name="東京電力HD"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="CHUBU" 
                stroke="#FF00FF" 
                strokeWidth={2}
                dot={{ fill: '#FF00FF', r: 4 }}
                name="中部電力"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="JERA" 
                stroke="#00D4FF" 
                strokeWidth={2}
                dot={{ fill: '#00D4FF', r: 4 }}
                name="JERA"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
