/**
 * 企業価値指標テーブルコンポーネント
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import type { ValuationDataItem } from '../hooks/useValuation';

interface ValuationTableProps {
  data: ValuationDataItem;
  companyName: string;
}

export function ValuationTable({ data, companyName }: ValuationTableProps) {
  const formatCurrency = (value: number) => {
    return `¥${(value / 1000).toFixed(0)}億円`;
  };

  const formatRatio = (value: number) => {
    return `${value.toFixed(2)}倍`;
  };

  return (
    <div className="neumorphic-card">
      <h2 className="text-2xl font-bold mb-6 text-neon-green neon-glow">
        {companyName === 'TEPCO' ? '東京電力HD' : companyName === 'CHUBU' ? '中部電力' : 'JERA'} - 企業価値指標
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-3 px-4 text-cyan font-semibold">指標</th>
              <th className="py-3 px-4 text-cyan font-semibold text-right">値</th>
              <th className="py-3 px-4 text-cyan font-semibold">説明</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4 font-medium">時価総額</td>
              <td className="py-4 px-4 text-right font-mono">{formatCurrency(data.marketCap)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">株価 × 発行済株式数</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4 font-medium">企業価値（EV）</td>
              <td className="py-4 px-4 text-right font-mono text-neon-green font-bold">{formatCurrency(data.enterpriseValue)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">時価総額 + 純有利子負債</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4 font-medium">EBITDA</td>
              <td className="py-4 px-4 text-right font-mono">{formatCurrency(data.ebitda)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">営業利益 + 減価償却費</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4 font-medium">EV/EBITDA倍率</td>
              <td className="py-4 px-4 text-right font-mono text-cyan font-bold">{formatRatio(data.evEbitdaRatio)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">企業価値 ÷ EBITDA</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4 font-medium">PER（株価収益率）</td>
              <td className="py-4 px-4 text-right font-mono">{formatRatio(data.per)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">時価総額 ÷ 当期純利益</td>
            </tr>
            <tr className="hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4 font-medium">PBR（株価純資産倍率）</td>
              <td className="py-4 px-4 text-right font-mono">{formatRatio(data.pbr)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">時価総額 ÷ 純資産</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400">
          <span className="text-neon-green font-semibold">データ基準日:</span> {data.date}
        </p>
      </div>
    </div>
  );
}
