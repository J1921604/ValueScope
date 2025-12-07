import type { EmployeeData, CompanyName } from '../types'
import { formatNumber } from '../utils/formatNumber'

interface EmployeeTableProps {
  data: Partial<Record<CompanyName, EmployeeData | null>>
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

interface EmployeeMetric {
  label: string
  key: keyof EmployeeData
  unit: string
  formatter: (value: number) => string
}

const METRICS: EmployeeMetric[] = [
  {
    label: '平均年間給与',
    key: 'averageAnnualSalary',
    unit: '円',
    formatter: (v) => formatNumber(v, 0),
  },
  {
    label: '平均勤続年数',
    key: 'averageLengthOfServiceYears',
    unit: '年',
    formatter: (v) => v.toFixed(1),
  },
  {
    label: '平均年齢',
    key: 'averageAgeYears',
    unit: '歳',
    formatter: (v) => v.toFixed(1),
  },
  {
    label: '従業員数',
    key: 'numberOfEmployees',
    unit: '人',
    formatter: (v) => formatNumber(v, 0),
  },
]

/**
 * 従業員情報比較テーブル
 */
export function EmployeeTable({ data }: EmployeeTableProps) {
  return (
    <div className="neumorphic-card p-6 bold-border">
      <div className="text-center mb-6 space-y-1">
        <h3 className="section-heading">従業員情報 比較テーブル</h3>
        <p className="text-sm text-gray-400">
          各社の従業員に関する主要指標を一覧表示
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-cyber-blue/30">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                指標
              </th>
              {COMPANY_ORDER.map((company) => (
                <th
                  key={company}
                  className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wider"
                  style={{ color: COMPANY_COLORS[company] }}
                >
                  {COMPANY_LABELS[company]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, idx) => (
              <tr
                key={metric.key}
                className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${
                  idx % 2 === 0 ? 'bg-gray-900/20' : ''
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-300">
                  {metric.label}
                </td>
                {COMPANY_ORDER.map((company) => {
                  const companyData = data[company]
                  const value = companyData?.[metric.key]
                  
                  return (
                    <td
                      key={company}
                      className="px-4 py-3 text-right text-sm font-semibold"
                      style={{ color: COMPANY_COLORS[company] }}
                    >
                      {value !== undefined && value !== null
                        ? `${metric.formatter(value as number)}${metric.unit}`
                        : '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        ※ 平均年間給与は税込年収、勤続年数・年齢は年度末時点
      </div>
    </div>
  )
}
