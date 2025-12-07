import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CompanyName, EmployeeDataResponse } from '../types'
import { formatNumber } from '../utils/formatNumber'

interface EmployeeTrendChartProps {
  data: EmployeeDataResponse
  metricKey: 'averageAnnualSalary' | 'averageLengthOfServiceYears' | 'averageAgeYears' | 'numberOfEmployees'
  title: string
  unit: string
}

const COMPANY_ORDER: CompanyName[] = ['TEPCO', 'CHUBU', 'JERA']

const COMPANY_LABELS: Record<CompanyName, string> = {
  TEPCO: '東京電力HD',
  CHUBU: '中部電力',
  JERA: 'JERA',
}

const COMPANY_COLORS: Record<CompanyName, string> = {
  TEPCO: '#00FF84',
  CHUBU: '#FF00FF',
  JERA: '#00D4FF',
}

/**
 * 従業員情報のトレンドチャート
 */
export function EmployeeTrendChart({ data, metricKey, title, unit }: EmployeeTrendChartProps) {
  // 年度ごとのデータを結合
  const allYears = new Set<number>()
  COMPANY_ORDER.forEach((company) => {
    data[company]?.forEach((item) => allYears.add(item.year))
  })

  const sortedYears = Array.from(allYears).sort((a, b) => a - b)

  const chartData = sortedYears.map((year) => {
    const point: Record<string, number | string> = { year: `FY${year - 1}` }
    
    COMPANY_ORDER.forEach((company) => {
      const companyData = data[company]?.find((item) => item.year === year)
      if (companyData) {
        point[company] = companyData[metricKey] ?? 0
      }
    })
    
    return point
  })

  return (
    <div className="chart-container">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-semibold text-cyber-blue">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">過去3年間の推移</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => formatNumber(value, 0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#E5E7EB',
            }}
            formatter={(value: number) => [
              `${formatNumber(value, metricKey === 'averageAnnualSalary' ? 0 : 1)}${unit}`,
              '',
            ]}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend
            wrapperStyle={{ color: '#9CA3AF' }}
            formatter={(value) => COMPANY_LABELS[value as CompanyName]}
          />
          {COMPANY_ORDER.map((company) => (
            <Line
              key={company}
              type="monotone"
              dataKey={company}
              stroke={COMPANY_COLORS[company]}
              strokeWidth={3}
              dot={{ fill: COMPANY_COLORS[company], r: 5 }}
              activeDot={{ r: 7 }}
              name={company}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
