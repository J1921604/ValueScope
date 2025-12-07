import { useEffect, useMemo, useState } from 'react'
import type { CompanyName, ScoreColor } from './types'
import type { TimeSeriesDataPoint } from './hooks/useTimeseries'
import { useTimeseries } from './hooks/useTimeseries'
import { useEmployeeData } from './hooks/useEmployeeData'
import { ComparisonTable } from './components/ComparisonTable'
import { KPIGauge } from './components/KPIGauge'
import { MultiCompanyTrendChart } from './components/MultiCompanyTrendChart'
import { MultiCompanyEVChart } from './components/MultiCompanyEVChart'
import { ComparisonFinancialTable } from './components/ComparisonFinancialTable'
import { EmployeeTable } from './components/EmployeeTable'
import { EmployeeTrendChart } from './components/EmployeeTrendChart'

type TabView = 'ev' | 'kpi' | 'employee' | 'pl' | 'bs' | 'cf'

interface ThresholdValues {
  green: number;
  yellow: number;
}

interface AllThresholds {
  roe: ThresholdValues;
  equityRatio: ThresholdValues;
  dscr: ThresholdValues;
}

type KPIKey = keyof AllThresholds;

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

const DEFAULT_KPI_THRESHOLDS: AllThresholds = {
  roe: { green: 10, yellow: 5 },
  equityRatio: { green: 30, yellow: 20 },
  dscr: { green: 1.5, yellow: 1.0 },
}

const KPI_GAUGE_LIMITS: Record<KPIKey, { min: number; max: number }> = {
  roe: { min: -20, max: 20 },
  equityRatio: { min: 0, max: 100 },  // 自己資本比率は0-100%の範囲
  dscr: { min: 0, max: 20 },          // DSCRの上限を20倍に拡大
}

const formatFiscalYearLabel = (year: number | null) => {
  if (year === null) {
    return '年度未選択'
  }
  return `FY${year - 1}`
}

function App() {
  const [activeTab, setActiveTab] = useState<TabView>('ev')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const { data: timeseriesData, loading: timeseriesLoading, error: timeseriesError } = useTimeseries()
  const { data: employeeData, loading: employeeLoading, error: employeeError } = useEmployeeData()

  const availableYears = useMemo(() => {
    if (!timeseriesData) {
      return []
    }

    const yearSet = new Set<number>()
    Object.values(timeseriesData).forEach((series) => {
      series?.forEach((point) => yearSet.add(point.year))
    })

    return Array.from(yearSet).sort((a, b) => a - b).slice(0, 10)
  }, [timeseriesData])

  useEffect(() => {
    if (!availableYears.length) {
      return
    }

    if (selectedYear === null || !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[availableYears.length - 1])
    }
  }, [availableYears, selectedYear])

  const perCompanyYearData = useMemo<Partial<Record<CompanyName, TimeSeriesDataPoint | null>>>(() => {
    return COMPANY_ORDER.reduce((acc, company) => {
      if (!timeseriesData || selectedYear === null) {
        acc[company] = null
        return acc
      }

      const companySeries = timeseriesData[company] ?? []
      acc[company] = companySeries.find((point) => point.year === selectedYear) ?? null
      return acc
    }, {} as Partial<Record<CompanyName, TimeSeriesDataPoint | null>>)
  }, [timeseriesData, selectedYear])

  const perCompanyEmployeeData = useMemo(() => {
    if (!employeeData || selectedYear === null) {
      return {}
    }

    return COMPANY_ORDER.reduce((acc, company) => {
      const companyEmployees = employeeData[company] ?? []
      acc[company] = companyEmployees.find((item) => item.year === selectedYear) ?? null
      return acc
    }, {} as Partial<Record<CompanyName, (typeof employeeData.TEPCO)[0] | null>>)
  }, [employeeData, selectedYear])

  const determineScore = (value: number | undefined, kpi: KPIKey): ScoreColor => {
    const thresholds = DEFAULT_KPI_THRESHOLDS[kpi]
    if (value === undefined || value === null) {
      return 'red'
    }
    if (value >= thresholds.green) {
      return 'green'
    }
    if (value >= thresholds.yellow) {
      return 'yellow'
    }
    return 'red'
  }

  const buildGaugeThresholds = (kpi: KPIKey) => ({
    ...KPI_GAUGE_LIMITS[kpi],
    green: DEFAULT_KPI_THRESHOLDS[kpi].green,
    yellow: DEFAULT_KPI_THRESHOLDS[kpi].yellow,
  })

  const isDataReady = Boolean(timeseriesData && selectedYear !== null)

  const renderYearButtons = () => {
    if (!availableYears.length) {
      return <span className="text-sm text-gray-500">年次データを読み込み中...</span>
    }

    return (
      <div className="month-buttons" role="group" aria-label="決算年度の選択">
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`month-btn ${selectedYear === year ? 'active' : ''}`}
            aria-pressed={selectedYear === year}
            type="button"
            title={`${formatFiscalYearLabel(year)}を表示`}
          >
            {formatFiscalYearLabel(year)}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="dashboard-inner">
          <div className="text-center space-y-2">
            <h1 className="title">
              企業価値KPI指標、財務諸表ダッシュボード - ValueScope Insights           </h1>
          </div>

          <div className="control-panel" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('ev')}
              className={`btn btn-magenta ${activeTab === 'ev' ? 'active' : ''}`}
              style={{ opacity: activeTab === 'ev' ? 1 : 0.7 }}
            >
              EV分析
            </button>
            <button
              onClick={() => setActiveTab('kpi')}
              className={`btn btn-magenta ${activeTab === 'kpi' ? 'active' : ''}`}
              style={{ opacity: activeTab === 'kpi' ? 1 : 0.7 }}
            >
              KPI分析
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`btn btn-magenta ${activeTab === 'employee' ? 'active' : ''}`}
              style={{ opacity: activeTab === 'employee' ? 1 : 0.7 }}
            >
              従業員情報
            </button>
            <button
              onClick={() => setActiveTab('pl')}
              className={`btn btn-cyan ${activeTab === 'pl' ? 'active' : ''}`}
              style={{ opacity: activeTab === 'pl' ? 1 : 0.7 }}
            >
              損益計算書
            </button>
            <button
              onClick={() => setActiveTab('bs')}
              className={`btn btn-cyan ${activeTab === 'bs' ? 'active' : ''}`}
              style={{ opacity: activeTab === 'bs' ? 1 : 0.7 }}
            >
              貸借対照表
            </button>
            <button
              onClick={() => setActiveTab('cf')}
              className={`btn btn-cyan ${activeTab === 'cf' ? 'active' : ''}`}
              style={{ opacity: activeTab === 'cf' ? 1 : 0.7 }}
            >
              CF計算書
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            {renderYearButtons()}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {timeseriesLoading && !isDataReady && (
          <div className="loading">
            <p>時系列データを読み込んでいます...</p>
          </div>
        )}

        {timeseriesError && (
          <div className="warning-container is-warning p-6 text-center">
            <h3 className="warning-title">データ読み込みエラー</h3>
            <p className="warning-text">{timeseriesError.message}</p>
          </div>
        )}

        {isDataReady && timeseriesData && selectedYear !== null && (
          <>
            {activeTab === 'ev' && (
              <section className="space-y-10">
                <ComparisonTable data={perCompanyYearData} />

                <div className="space-y-8">
                  <MultiCompanyEVChart
                    data={timeseriesData}
                    evName="enterpriseValue"
                    title="企業価値（EV）推移"
                    unit="億円"
                  />
                  <MultiCompanyEVChart
                    data={timeseriesData}
                    evName="evEbitdaRatio"
                    title="EV/EBITDA推移"
                    unit="倍"
                  />
                  <MultiCompanyEVChart
                    data={timeseriesData}
                    evName="per"
                    title="PER推移"
                    unit="倍"
                  />
                  <MultiCompanyEVChart
                    data={timeseriesData}
                    evName="pbr"
                    title="PBR推移"
                    unit="倍"
                  />
                </div>
              </section>
            )}

            {activeTab === 'kpi' && (
              <section className="space-y-10">
                <div className="neumorphic-card p-6 bold-border">
                  <div className="text-center mb-6 space-y-1">
                    <h3 className="section-heading">KPI信号チャート</h3>
                  </div>
                </div>

                {/* ROEゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">ROE</h3>
                      <p className="text-sm text-gray-400">
                        自己資本に対する純利益の割合。10%以上で投資効率が高い水準
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.roe
                      const score = determineScore(value, 'roe')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="ROE"
                            value={value ?? 0}
                            unit="%"
                            score={score}
                            thresholds={buildGaugeThresholds('roe')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ROEグラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="roe" title="ROE推移" unit="%" />

                {/* 自己資本比率ゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">自己資本比率</h3>
                      <p className="text-sm text-gray-400">
                        総資産に占める自己資本の割合。30%以上で財務体質が安定
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.equityRatio
                      const score = determineScore(value, 'equityRatio')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="自己資本比率"
                            value={value ?? 0}
                            unit="%"
                            score={score}
                            thresholds={buildGaugeThresholds('equityRatio')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 自己資本比率グラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="equityRatio" title="自己資本比率推移" unit="%" />

                {/* DSCRゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">DSCR</h3>
                      <p className="text-sm text-gray-400">
                        営業CFで利息・元本返済をどれだけ賄えるか。1.5倍以上が安全圏
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.dscr
                      const score = determineScore(value, 'dscr')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="DSCR"
                            value={value ?? 0}
                            unit="倍"
                            score={score}
                            thresholds={buildGaugeThresholds('dscr')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* DSCRグラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="dscr" title="DSCR推移" unit="倍" />
              </section>
            )}

            {activeTab === 'employee' && employeeData && (
              <section className="space-y-10">
                <EmployeeTable data={perCompanyEmployeeData} />

                <div className="space-y-8">
                  <EmployeeTrendChart
                    data={employeeData}
                    metricKey="averageAnnualSalary"
                    title="平均年間給与推移"
                    unit="円"
                  />
                  <EmployeeTrendChart
                    data={employeeData}
                    metricKey="averageLengthOfServiceYears"
                    title="平均勤続年数推移"
                    unit="年"
                  />
                  <EmployeeTrendChart
                    data={employeeData}
                    metricKey="averageAgeYears"
                    title="平均年齢推移"
                    unit="歳"
                  />
                  <EmployeeTrendChart
                    data={employeeData}
                    metricKey="numberOfEmployees"
                    title="従業員数推移"
                    unit="人"
                  />
                </div>
              </section>
            )}
          </>
        )}

        {/* 従業員情報ローディング・エラー */}
        {activeTab === 'employee' && employeeLoading && (
          <div className="loading">
            <p>従業員情報を読み込んでいます...</p>
          </div>
        )}

        {activeTab === 'employee' && employeeError && (
          <div className="warning-container is-warning p-6 text-center">
            <h3 className="warning-title">従業員情報読み込みエラー</h3>
            <p className="warning-text">{employeeError.message}</p>
          </div>
        )}

        {/* 財務諸表ページ */}
        {activeTab === 'pl' && selectedYear !== null && (
          <ComparisonFinancialTable type="PL" title="損益計算書（PL）" selectedYear={selectedYear} />
        )}
        {activeTab === 'bs' && selectedYear !== null && (
          <ComparisonFinancialTable type="BS" title="貸借対照表（BS）" selectedYear={selectedYear} />
        )}
        {activeTab === 'cf' && selectedYear !== null && (
          <ComparisonFinancialTable type="CF" title="キャッシュフロー計算書（CF）" selectedYear={selectedYear} />
        )}
      </main>

      <footer className="mt-16 py-8 text-center text-gray-500 border-t border-gray-800">
        <p>ValueScope v1.0.0 | 2025-12-15</p>
        <p className="mt-2">
          <a
            href="https://github.com/J1921604/ValueScope"
            className="text-cyber-blue hover:text-neon-green transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository
          </a>
        </p>
        <div className="update-info">
          最終更新: <span id="last-update">{new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span> | 次回更新予定: 毎日 07:00 (日本時間)
        </div>
      </footer>
    </div>
  )
}

export default App
