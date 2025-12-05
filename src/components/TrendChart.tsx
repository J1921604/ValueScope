/**
 * TrendChart.tsx - KPI推移グラフコンポーネント（US3）
 * Version: 1.0.0
 * Date: 2025-12-15
 * 
 * 憲法遵守:
 * - Rechartsライブラリ使用
 * - 時系列データ表示（年度別）
 * - Cyberpunk Neumorphismスタイル
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

interface TimeSeriesDataPoint {
  date: string;
  year: number;
  roe: number;
  equityRatio: number;
  dscr: number;
}

interface TrendChartProps {
  /** 時系列データ */
  data: TimeSeriesDataPoint[];
  /** KPI名 */
  kpiName: 'roe' | 'equityRatio' | 'dscr';
  /** グラフタイトル */
  title: string;
  /** Y軸の単位 */
  unit: string;
  /** 線の色 */
  color?: string;
}

const kpiLabels = {
  roe: 'ROE',
  equityRatio: '自己資本比率',
  dscr: 'DSCR'
};

/**
 * TrendChart - KPI推移を折れ線グラフで表示
 */
export function TrendChart({ data, kpiName, title, unit, color = 'var(--neon-green)' }: TrendChartProps) {
  // データが空の場合
  if (!data || data.length === 0) {
    return (
      <div className="neumorphic-card p-6 text-center">
        <h3 className="text-xl font-semibold text-neon-green mb-2">{title}</h3>
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

  return (
    <div className="neumorphic-card p-6">
      <h3 className="text-xl font-semibold text-neon-green mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="year"
            stroke="#00D4FF"
            tick={{ fill: '#00D4FF', fontSize: 14, fontWeight: 600 }}
          />
          <YAxis
            stroke="var(--fg-dim)"
            tick={{ fill: 'var(--fg-dim)' }}
            label={{
              value: unit,
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--fg-dim)' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey={kpiName}
            name={kpiLabels[kpiName]}
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
