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
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `¥${(value / 1000).toFixed(0)}億円`;
  };

  const formatRatio = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}倍`;
  };

  // ツールチップ付き指標名コンポーネント
  const MetricName = ({ name, tooltip }: { name: string; tooltip: string }) => (
    <div className="flex items-center gap-2">
      <span className="font-medium">{name}</span>
      <div className="relative group">
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 cursor-help">
          ?
        </span>
        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-cyan-500 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-sm">
          {tooltip}
        </div>
      </div>
    </div>
  );

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
              <th className="py-3 px-4 text-cyan font-semibold">計算式</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="時価総額" 
                  tooltip="企業の株式市場における評価額。決算日の株価に発行済株式数を乗じて算出します。" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono">{formatCurrency(data.marketCap)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">株価 × 発行済株式数</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="純有利子負債" 
                  tooltip="企業が負担する実質的な負債額。有利子負債から現金・預金を差し引いた金額です。" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono">{formatCurrency(data.netDebt)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">有利子負債 - 現金及び預金</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="企業価値（EV）" 
                  tooltip="企業の総合的な価値評価。株主と債権者双方の価値を合計した金額で、M&Aや企業評価の基準となります。" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono text-neon-green font-bold">{formatCurrency(data.enterpriseValue)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">時価総額 + 純有利子負債</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="EBITDA" 
                  tooltip="金利・税金・減価償却費控除前利益。企業の本業の稼ぐ力を示す指標で、設備投資型産業の評価に適しています。" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono">{formatCurrency(data.ebitda)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">営業利益 + 減価償却費</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="連結当期利益" 
                  tooltip="親会社株主に帰属する当期純利益。XBRLタグ: jpcrp_cor:ProfitLossAttributableToOwnersOfParent" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono">{formatCurrency(data.netIncome)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">親会社株主帰属当期純利益</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="EV/EBITDA倍率" 
                  tooltip="企業価値がEBITDAの何倍かを示す投資指標。低いほど割安とされ、電力業界の平均は6-10倍程度です。" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono text-cyan font-bold">{formatRatio(data.evEbitdaRatio)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">企業価値 ÷ EBITDA</td>
            </tr>
            <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="PER（株価収益率）" 
                  tooltip="株価が1株当たり純利益の何倍かを示す指標。低いほど割安とされ、成長性や収益安定性で評価が異なります。" 
                />
              </td>
              <td className="py-4 px-4 text-right font-mono">{formatRatio(data.per)}</td>
              <td className="py-4 px-4 text-gray-400 text-sm">時価総額 ÷ 連結当期利益</td>
            </tr>
            <tr className="hover:bg-gray-800/50 transition-colors">
              <td className="py-4 px-4">
                <MetricName 
                  name="PBR（株価純資産倍率）" 
                  tooltip="株価が1株当たり純資産の何倍かを示す指標。1倍未満は簿価割れを意味し、割安の目安となります。" 
                />
              </td>
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
