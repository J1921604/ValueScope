import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell } from 'recharts'
import type { ScoreColor } from '../types'

interface GaugeThresholds {
  min: number
  max: number
  green: number
  yellow: number
}

interface KPIGaugeProps {
  title: string
  value: number
  unit: string
  score: ScoreColor
  thresholds: GaugeThresholds
  description?: string
}

const scoreColors: Record<ScoreColor, string> = {
  green: '#00FF84',
  yellow: '#FF6B35',
  red: '#FF3366',
}

const scoreBadges: Record<ScoreColor, string> = {
  green: '優良',
  yellow: '普通',
  red: '要改善',
}

const scoreBadgeClasses: Record<ScoreColor, string> = {
  green: 'score-green',
  yellow: 'score-yellow',
  red: 'score-red',
}

/**
 * KPIをレーダーゲージで可視化するコンポーネント
 * - Recharts RadialBarChartを利用して直感的な信号機評価を表示
 * - 閾値情報を下部にラベル表示
 */
export function KPIGauge({ title, value = 0, unit, score, thresholds, description }: KPIGaugeProps) {
  // 値を閾値の範囲内にクランプ（表示用）
  const clampedValue = Math.min(Math.max(value, thresholds.min), thresholds.max)
  
  const chartData = [
    {
      name: title,
      value: clampedValue,
      full: thresholds.max,
    },
  ]

  return (
    <div className="p-6 bg-gray-900/70 rounded-2xl panel-frame hover:shadow-2xl transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-gray-400">{title}</p>
          <p className="text-3xl font-semibold text-white mt-1">
            {value.toFixed(2)}{unit}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreBadgeClasses[score]}`}>
          {scoreBadges[score]}
        </span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={chartData}
            cx="50%"          // 中心を横方向中央
            cy="100%"         // 縦方向下端に配置
            innerRadius="60%"
            outerRadius="90%"
            startAngle={270}  // 9時位置（左）から開始
            endAngle={90}     // 3時位置（右）で終了
          >
            <PolarAngleAxis
              type="number"
              domain={[thresholds.min, thresholds.max]}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: '#4B5563' }}
            >
              <Cell fill={scoreColors[score]} />
            </RadialBar>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current"
              style={{ fill: '#E6F5F1', fontSize: '1.5rem', fontWeight: 600 }}
            >
              {value.toFixed(2)}{unit}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {description && (
        <p className="text-sm text-gray-400 mt-4 border-t border-gray-800 pt-3">{description}</p>
      )}

      <ul className="mt-4 text-xs text-gray-400 space-y-1">
        <li className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scoreColors.green }}></span>
          優良 (≥ {thresholds.green}{unit})
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scoreColors.yellow }}></span>
          普通 (≥ {thresholds.yellow}{unit})
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scoreColors.red }}></span>
          要改善 (&lt; {thresholds.yellow}{unit})
        </li>
      </ul>
    </div>
  )
}
