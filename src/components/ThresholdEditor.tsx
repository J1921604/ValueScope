/**
 * ThresholdEditor.tsx - KPI閾値編集モーダルコンポーネント（US5）
 * Version: 1.0.0
 * Date: 2025-12-15
 * 
 * 憲法遵守:
 * - localStorage永続化
 * - リアルタイムスコア更新
 * - Cyberpunk Neumorphismスタイル
 */

import { useState, useEffect } from 'react';

interface ThresholdValues {
  green: number;
  yellow: number;
}

interface AllThresholds {
  roe: ThresholdValues;
  equityRatio: ThresholdValues;
  dscr: ThresholdValues;
}

interface ThresholdEditorProps {
  /** 表示/非表示状態 */
  isOpen: boolean;
  /** 閉じるハンドラ */
  onClose: () => void;
  /** 保存ハンドラ */
  onSave: (thresholds: AllThresholds) => void;
  /** 現在の閾値 */
  currentThresholds: AllThresholds;
}

const DEFAULT_THRESHOLDS: AllThresholds = {
  roe: { green: 10, yellow: 5 },
  equityRatio: { green: 30, yellow: 20 },
  dscr: { green: 1.5, yellow: 1.0 },
};

/**
 * ThresholdEditor - 閾値カスタマイズモーダル
 */
export function ThresholdEditor({
  isOpen,
  onClose,
  onSave,
  currentThresholds,
}: ThresholdEditorProps) {
  const [thresholds, setThresholds] = useState<AllThresholds>(currentThresholds);

  useEffect(() => {
    setThresholds(currentThresholds);
  }, [currentThresholds]);

  if (!isOpen) return null;

  const handleSave = () => {
    // localStorageに保存
    localStorage.setItem('kpi_thresholds', JSON.stringify(thresholds));
    onSave(thresholds);
    onClose();
  };

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS);
  };

  const handleChange = (
    kpi: keyof AllThresholds,
    level: keyof ThresholdValues,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setThresholds((prev) => ({
        ...prev,
        [kpi]: {
          ...prev[kpi],
          [level]: numValue,
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="neumorphic-card p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-neon-green mb-6">閾値カスタマイズ</h2>
        <p className="text-fg-dim mb-8">
          各KPIの評価基準を変更できます。優良（緑）と普通（黄）の境界値を設定してください。
        </p>

        <div className="space-y-6">
          {/* ROE */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyber-blue mb-4">ROE（自己資本利益率）</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">優良（緑）以上</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.roe.green}
                    onChange={(e) => handleChange('roe', 'green', e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-neon-green"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">普通（黄）以上</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.roe.yellow}
                    onChange={(e) => handleChange('roe', 'yellow', e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-neon-green"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 自己資本比率 */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyber-blue mb-4">自己資本比率</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">優良（緑）以上</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.equityRatio.green}
                    onChange={(e) => handleChange('equityRatio', 'green', e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-neon-green"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">普通（黄）以上</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.equityRatio.yellow}
                    onChange={(e) => handleChange('equityRatio', 'yellow', e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-neon-green"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* DSCR */}
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold text-cyber-blue mb-4">DSCR（債務返済能力）</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">優良（緑）以上</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.dscr.green}
                    onChange={(e) => handleChange('dscr', 'green', e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-neon-green"
                  />
                  <span className="text-gray-400">倍</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">普通（黄）以上</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={thresholds.dscr.yellow}
                    onChange={(e) => handleChange('dscr', 'yellow', e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-fg focus:outline-none focus:border-neon-green"
                  />
                  <span className="text-gray-400">倍</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-end">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-700 text-fg rounded-lg hover:bg-gray-600 transition-colors"
          >
            デフォルトに戻す
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-fg rounded-lg hover:bg-gray-600 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-neon-green text-bg rounded-lg hover:bg-opacity-80 transition-colors font-semibold"
          >
            保存
          </button>
        </div>

        <p className="text-xs text-fg-dim mt-4">
          ※ 閾値はブラウザのlocalStorageに保存され、次回アクセス時も維持されます
        </p>
      </div>
    </div>
  );
}
