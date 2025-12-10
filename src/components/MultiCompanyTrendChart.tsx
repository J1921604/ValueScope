/**
 * MultiCompanyTrendChart.tsx - 3社重ね合わせKPI推移グラフコンポーネント
 * Version: 1.0.0
 * Date: 2025-12-15
 * 
 * 3社のKPI推移を1つのグラフに重ね合わせて表示
 */

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
import type { CompanyName } from '../types';
import type { CompanyTimeseries, TimeSeriesDataPoint } from '../hooks/useTimeseries';

interface MultiCompanyTrendChartProps {
  /** 3社の時系列データ */
  data: CompanyTimeseries;
  /** KPI名 */
  kpiName: 'roic' | 'wacc' | 'ebitdaMargin' | 'fcfMargin';
  /** グラフタイトル */
  title: string;
  /** Y軸の単位 */
  unit: string;
  /** 表示対象企業 */
  visibleCompanies?: CompanyName[];
}

const companyColors = {
  TEPCO: '#00FF84',      // ネオングリーン
  CHUBU: '#FF00FF',      // マゼンタ
  JERA: '#00D4FF',       // シアン
};

const companyNames: Record<CompanyName, string> = {
  TEPCO: '東京電力HD',
  CHUBU: '中部電力',
  JERA: 'JERA',
};

/**
 * MultiCompanyTrendChart - 3社のKPI推移を重ね合わせて表示
 */
export function MultiCompanyTrendChart({ data, kpiName, title, unit, visibleCompanies }: MultiCompanyTrendChartProps) {
  // 全社のデータを年でマージ
  const allYears = new Set<number>();
  
  Object.values(data).forEach(companyData => {
    if (companyData) {
      companyData.forEach((point: TimeSeriesDataPoint) => allYears.add(point.year));
    }
  });

  const sortedYears = Array.from(allYears).sort((a, b) => a - b);

  // 年ごとにデータをマージ
  const mergedData = sortedYears.map(year => {
    const point: any = { year: `FY${year - 1}` };
    
    if (data.TEPCO) {
      const tepcoPoint = data.TEPCO.find(d => d.year === year);
      if (tepcoPoint) point.TEPCO = tepcoPoint[kpiName];
    }
    
    if (data.CHUBU) {
      const chubuPoint = data.CHUBU.find(d => d.year === year);
      if (chubuPoint) point.CHUBU = chubuPoint[kpiName];
    }
    
    if (data.JERA) {
      const jeraPoint = data.JERA.find(d => d.year === year);
      if (jeraPoint) point.JERA = jeraPoint[kpiName];
    }
    
    return point;
  });

  // データが空の場合
  if (mergedData.length === 0) {
    return (
      <div className="neumorphic-card p-6 text-center">
        <h3 className="text-2xl font-semibold text-cyber-blue mb-2">{title}</h3>
        <p className="text-fg-dim">推移データがありません</p>
      </div>
    );
  }

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="neumorphic-card p-4 border border-border">
        <p className="font-semibold text-neon-green mb-2">{label}年度</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : 'N/A'}
              {unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const activeCompanies = visibleCompanies?.length ? visibleCompanies : (Object.keys(companyNames) as CompanyName[]);

  return (
    <div className="neumorphic-card p-6 bold-border">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-semibold text-cyber-blue">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={mergedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry: any) => {
              return (
                <span style={{ color: entry.color }}>
                  {value}
                </span>
              );
            }}
          />
          
          {data.TEPCO && (
            <Line
              type="monotone"
              dataKey="TEPCO"
              name={companyNames.TEPCO}
              stroke={companyColors.TEPCO}
              strokeWidth={3}
              dot={{ fill: companyColors.TEPCO, r: 5 }}
              activeDot={{ r: 7 }}
              connectNulls
              hide={!activeCompanies.includes('TEPCO')}
            />
          )}
          
          {data.CHUBU && (
            <Line
              type="monotone"
              dataKey="CHUBU"
              name={companyNames.CHUBU}
              stroke={companyColors.CHUBU}
              strokeWidth={3}
              dot={{ fill: companyColors.CHUBU, r: 5 }}
              activeDot={{ r: 7 }}
              connectNulls
              hide={!activeCompanies.includes('CHUBU')}
            />
          )}
          
          {data.JERA && (
            <Line
              type="monotone"
              dataKey="JERA"
              name={companyNames.JERA}
              stroke={companyColors.JERA}
              strokeWidth={3}
              dot={{ fill: companyColors.JERA, r: 5 }}
              activeDot={{ r: 7 }}
              connectNulls
              hide={!activeCompanies.includes('JERA')}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
