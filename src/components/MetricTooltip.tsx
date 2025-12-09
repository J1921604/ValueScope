/**
 * 指標ツールチップコンポーネント
 * XBRLタグやその他の説明を表示するツールチップ付き指標名
 * Version: 1.0.0
 * Date: 2025-12-15
 */

interface MetricTooltipProps {
  name: string;
  tooltip: string;
}

export function MetricTooltip({ name, tooltip }: MetricTooltipProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{name}</span>
      <div className="relative group metric-info">
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 cursor-help">
          ?
        </span>
        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-cyan-500 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-sm metric-tooltip">
          {tooltip}
        </div>
      </div>
    </div>
  );
}
