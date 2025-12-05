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
  | 'pbr';

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
    key: 'interestBearingDebt',
    label: '有利子負債',
    description: '利子を付けて返済する必要がある負債',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'cashAndDeposits',
    label: '現金及び預金',
    description: '手元にある現金と銀行預金',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'netDebt',
    label: '純有利子負債',
    description: '有利子負債から現預金を差し引いた実質的な負債',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
  },
  {
    key: 'ebitda',
    label: 'EBITDA',
    description: '利払い・税引き・償却前利益。本業の稼ぐ力',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  {
    key: 'evEbitdaRatio',
    label: 'EV/EBITDA倍率',
    description: 'EVをEBITDAで割ったバリュエーション指標（低いほど割安）',
    format: (value: number) => `${formatNumber(value, 2)}x`,
    category: 'EV',
  },
  {
    key: 'netIncome',
    label: '当期純利益',
    description: '税引後の最終利益',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'PL',
  },
  {
    key: 'per',
    label: 'PER',
    description: '株価収益率。株価が純利益の何倍かを示す（低いほど割安）',
    format: (value: number) => `${formatNumber(value, 2)}x`,
    category: 'EV',
  },
  {
    key: 'equity',
    label: '自己資本',
    description: '返済義務のない資本（純資産）',
    format: (value: number) => `${formatNumber(value, 0)}億円`,
    category: 'BS',
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

  const formatCell = (value: number | undefined, formatter: (val: number) => string) => {
    if (value === undefined || value === null) {
      return '-';
    }
    return formatter(value);
  };

  return (
    <div className="neumorphic-card p-6 bold-border">
      <div className="text-center mb-6 space-y-1">
        <h3 className="section-heading">主要指標比較</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(0, 255, 255, 0.2)' }}>
              <th className="p-4 text-gray-400 font-semibold">指標</th>
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
  );
}
