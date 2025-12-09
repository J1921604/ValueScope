import React, { useState, useMemo } from 'react';
import { useFinancialCSV } from '../hooks/useFinancialCSV';
import { translateFinancialLabel } from './ComparisonFinancialTable';

const BalanceSheet: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<'TEPCO' | 'CHUBU' | 'JERA'>('TEPCO');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const { data, loading, error } = useFinancialCSV(selectedCompany, 'BS');

  const companies = [
    { value: 'TEPCO', label: '東京電力HD' },
    { value: 'CHUBU', label: '中部電力' },
    { value: 'JERA', label: 'JERA' },
  ];

  const availableYears = useMemo(() => {
    if (!data || data.length === 0) return [];
    const years = data.map(row => String(row.fiscal_year)).filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const filteredData = useMemo(() => {
    if (!selectedYear) return data;
    return data.filter(row => String(row.fiscal_year) === selectedYear);
  }, [data, selectedYear]);

  React.useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl neon-glow">データ読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          エラー: {error.message}
        </div>
      </div>
    );
  }

  const columns = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold neon-glow mb-2">貸借対照表 (BS)</h1>
          <p className="text-cyan-400">Balance Sheet（単位：億円）</p>
        </div>

        {/* 企業選択 */}
        <div className="mb-6 flex justify-center gap-4">
          {companies.map((company) => (
            <button
              key={company.value}
              onClick={() => {
                setSelectedCompany(company.value as any);
                setSelectedYear(null);
              }}
              className={`
                px-6 py-3 rounded-lg font-semibold transition-all
                ${selectedCompany === company.value
                  ? 'bg-[var(--neon-green)] text-black button-glow'
                  : 'bg-[var(--surface)] text-[var(--fg)] border-2 border-[var(--border-strong)] hover:border-[var(--neon-green)]'
                }
              `}
            >
              {company.label}
            </button>
          ))}
        </div>

        {/* 年度フィルタ */}
        {availableYears.length > 0 && (
          <div className="mb-6 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedYear(null)}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${selectedYear === null
                  ? 'bg-[var(--cyan)] text-black'
                  : 'bg-[var(--surface)] text-[var(--fg)] border border-[var(--border-strong)] hover:border-[var(--cyan)]'
                }
              `}
            >
              全期間
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${selectedYear === year
                    ? 'bg-[var(--cyan)] text-black'
                    : 'bg-[var(--surface)] text-[var(--fg)] border border-[var(--border-strong)] hover:border-[var(--cyan)]'
                  }
                `}
              >
                {year}年
              </button>
            ))}
          </div>
        )}

        {/* データテーブル */}
        <div className="neumorphic-card overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--border-strong)]">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[var(--cyan)] font-semibold"
                  >
                    {translateFinancialLabel(String(col))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={`${rowIndex}-${col}`}
                      className="px-4 py-3 text-[var(--fg)]"
                    >
                      {typeof row[col] === 'number'
                        ? (row[col] / 100).toLocaleString('ja-JP', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                        : row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12 text-[var(--fg)] opacity-60">
              データがありません
            </div>
          )}
        </div>

        {/* データ件数 */}
        <div className="mt-4 text-center text-[var(--cyan)] text-sm">
          {filteredData.length}件のデータを表示
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
