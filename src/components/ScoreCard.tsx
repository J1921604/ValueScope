/**
 * スコアカードコンポーネント
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import type { ScoreColor } from '../types';

interface ScoreCardProps {
  title: string;
  value: number;
  unit: string;
  score: ScoreColor;
  change?: number;
  description?: string;
}

const scoreColors = {
  green: 'score-green',
  yellow: 'score-yellow',
  red: 'score-red',
};

const scoreLabels = {
  green: '優良',
  yellow: '普通',
  red: '要改善',
};

export function ScoreCard({ title, value, unit, score, change, description }: ScoreCardProps) {
  console.log(`[ScoreCard] ${title}:`, { value, unit, score, change });
  
  if (value === undefined || value === null) {
    console.error(`[ScoreCard] ${title}: value is undefined or null`);
    return (
      <div className="p-6 bg-gray-800 rounded-lg neumorphic">
        <h3 className="text-lg font-semibold text-neon-green">{title}</h3>
        <p className="text-danger-red mt-2">データエラー: 値が未定義です</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-800 rounded-lg neumorphic hover:scale-105 transition-transform duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-neon-green">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${scoreColors[score]}`}>
          {scoreLabels[score]}
        </span>
      </div>
      
      <div className="mt-4">
        <div className="text-4xl font-bold text-white">
          {value.toFixed(2)}{unit}
        </div>
        
        {change !== undefined && change !== 0 && (
          <p className={`mt-2 text-sm ${change > 0 ? 'text-neon-green' : 'text-danger-red'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}{unit} 前期比
          </p>
        )}
        
        {description && (
          <p className="mt-3 text-sm text-gray-400 border-t border-gray-700 pt-3">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
