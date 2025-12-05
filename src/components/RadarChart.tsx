/**
 * RadarChart.tsx - KPI比較レーダーチャートコンポーネント（US4）
 * Version: 1.0.0
 * Date: 2025-12-15
 * 
 * 憲法遵守:
 * - Rechartsライブラリ使用
 * - 3社KPI多次元比較（東京電力HD、中部電力、JERA）
 * - ROE、自己資本比率、DSCRを表示
 * - Cyberpunk Neumorphismスタイル
 */

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps,
} from 'recharts';

interface KPIValues {
  roe: number;
  equityRatio: number;
  dscr: number;
}

interface RadarChartProps {
  /** 3社のKPIデータ */
  tepcoDat: KPIValues;
  chubuData: KPIValues;
  jeraData: KPIValues;
}

const companyColors = {
  TEPCO: '#00D4FF',      // シアン
  CHUBU: '#FF6B35',      // オレンジ
  JERA: '#8B5CF6',       // パープル
};

const companyNames = {
  TEPCO: '東京電力HD',
  CHUBU: '中部電力',
  JERA: 'JERA',
};

/**
 * RadarChart - 3社のKPIを多次元比較
 */
export function RadarChart({ tepcoDat, chubuData, jeraData }: RadarChartProps) {
  // レーダーチャート用データ構造に変換
  const radarData = [
    {
      metric: 'ROE',
      TEPCO: tepcoDat.roe,
      CHUBU: chubuData.roe,
      JERA: jeraData.roe,
      fullMark: 20,
    },
    {
      metric: '自己資本比率',
      TEPCO: tepcoDat.equityRatio,
      CHUBU: chubuData.equityRatio,
      JERA: jeraData.equityRatio,
      fullMark: 60,
    },
    {
      metric: 'DSCR',
      TEPCO: tepcoDat.dscr,
      CHUBU: chubuData.dscr,
      JERA: jeraData.dscr,
      fullMark: 5,
    },
  ];

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="neumorphic-card p-4 border border-border">
        <p className="font-semibold text-neon-green mb-2">{payload[0]?.payload?.metric}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : 'N/A'}
              {entry.payload.metric === 'DSCR' ? '倍' : '%'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="neumorphic-card p-6">
      <h3 className="text-xl font-semibold text-neon-green mb-4 text-center">
        3社KPI比較レーダーチャート
      </h3>
      <ResponsiveContainer width="100%" height={500}>
        <RechartsRadar data={radarData}>
          <PolarGrid stroke="var(--border)" opacity={0.3} />
          <PolarAngleAxis
            dataKey="metric"
            stroke="var(--fg-dim)"
            tick={{ fill: 'var(--fg-dim)', fontSize: 14 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 'dataMax']}
            stroke="var(--fg-dim)"
            tick={{ fill: 'var(--fg-dim)' }}
          />
          <Radar
            name={companyNames.TEPCO}
            dataKey="TEPCO"
            stroke={companyColors.TEPCO}
            fill={companyColors.TEPCO}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name={companyNames.CHUBU}
            dataKey="CHUBU"
            stroke={companyColors.CHUBU}
            fill={companyColors.CHUBU}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name={companyNames.JERA}
            dataKey="JERA"
            stroke={companyColors.JERA}
            fill={companyColors.JERA}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
        </RechartsRadar>
      </ResponsiveContainer>
      
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        {(['TEPCO', 'CHUBU', 'JERA'] as const).map((company) => {
          const data = company === 'TEPCO' ? tepcoDat : company === 'CHUBU' ? chubuData : jeraData;
          return (
            <div key={company} className="p-4 bg-gray-900/50 rounded-lg border" style={{ borderColor: companyColors[company] }}>
              <p className="font-semibold mb-2" style={{ color: companyColors[company] }}>
                {companyNames[company]}
              </p>
              <div className="space-y-1 text-xs">
                <p className="text-gray-400">ROE: <span className="text-white">{data.roe.toFixed(2)}%</span></p>
                <p className="text-gray-400">自己資本比率: <span className="text-white">{data.equityRatio.toFixed(2)}%</span></p>
                <p className="text-gray-400">DSCR: <span className="text-white">{data.dscr.toFixed(2)}倍</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
