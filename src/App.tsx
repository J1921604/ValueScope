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
  roic: ThresholdValues;
  wacc: ThresholdValues;
  ebitdaMargin: ThresholdValues;
  fcfMargin: ThresholdValues;
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
  roic: { green: 5, yellow: 3 },               // ROIC: 5%以上で優良、3%以上で普通（電力業界特化）
  wacc: { green: 4, yellow: 5 },               // WACC: 4%未満で優良、5%未満で普通（低いほど良い）
  ebitdaMargin: { green: 15, yellow: 10 },     // EBITDAマージン: 15%以上で優良、10%以上で普通
  fcfMargin: { green: 5, yellow: 0 },          // FCFマージン: 5%以上で優良、0%以上で普通
}

const KPI_GAUGE_LIMITS: Record<KPIKey, { min: number; max: number }> = {
  roic: { min: 0, max: 15 },               // ROIC: 0-15%の範囲（実績最大値13.84%対応）
  wacc: { min: 0, max: 6 },                // WACC: 0-6%の範囲（電力業界max値）
  ebitdaMargin: { min: 0, max: 30 },       // EBITDAマージン: 0-30%の範囲（電力業界max値）
  fcfMargin: { min: -5, max: 25 },         // FCFマージン: -5-25%の範囲（実績最大値21.88%対応）
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

    // WACCは低いほど良い（逆転判定）
    if (kpi === 'wacc') {
      if (value < thresholds.green) {
        return 'green'
      }
      if (value < thresholds.yellow) {
        return 'yellow'
      }
      return 'red'
    }

    // 他のKPIは高いほど良い（通常判定）
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
                    <h3 className="section-heading">KPI分析</h3>
                  </div>
                </div>

                {/* ROICゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">ROIC</h3>
                      <p className="text-sm text-gray-400">
                        投下資本利益率。投下資本に対する営業利益の割合。5%以上で効率的な資本運用
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.roic
                      const score = determineScore(value, 'roic')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="ROIC"
                            value={value ?? 0}
                            unit="%"
                            score={score}
                            thresholds={buildGaugeThresholds('roic')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ROICグラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="roic" title="ROIC推移" unit="%" />

                {/* WACCゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">WACC</h3>
                      <p className="text-sm text-gray-400">
                        加重平均資本コスト。企業の資金調達コスト。4%未満で低コスト経営（低いほど良い）
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.wacc
                      const score = determineScore(value, 'wacc')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="WACC"
                            value={value ?? 0}
                            unit="%"
                            score={score}
                            thresholds={buildGaugeThresholds('wacc')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* WACCグラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="wacc" title="WACC推移" unit="%" />

                {/* EBITDAマージンゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">EBITDAマージン</h3>
                      <p className="text-sm text-gray-400">
                        売上高EBITDA率。営業キャッシュ創出力。15%以上で高収益体質
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.ebitdaMargin
                      const score = determineScore(value, 'ebitdaMargin')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="EBITDAマージン"
                            value={value ?? 0}
                            unit="%"
                            score={score}
                            thresholds={buildGaugeThresholds('ebitdaMargin')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* EBITDAマージングラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="ebitdaMargin" title="EBITDAマージン推移" unit="%" />

                {/* FCFマージンゲージ */}
                <div className="chart-container">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-cyber-blue">FCFマージン</h3>
                      <p className="text-sm text-gray-400">
                        フリーキャッシュフローマージン。営業CFの売上高比率。5%以上でキャッシュ創出力が高い
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COMPANY_ORDER.map((company) => {
                      const value = perCompanyYearData[company]?.fcfMargin
                      const score = determineScore(value, 'fcfMargin')
                      return (
                        <div key={company} className="space-y-2 text-center">
                          <p className="text-sm font-semibold tracking-wide" style={{ color: COMPANY_COLORS[company] }}>
                            {COMPANY_LABELS[company]}
                          </p>
                          <KPIGauge
                            title="FCFマージン"
                            value={value ?? 0}
                            unit="%"
                            score={score}
                            thresholds={buildGaugeThresholds('fcfMargin')}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* FCFマージングラフ */}
                <MultiCompanyTrendChart data={timeseriesData} kpiName="fcfMargin" title="FCFマージン推移" unit="%" />
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
        <p>ValueScope 1.0.0 | 2025-12-15</p>
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
