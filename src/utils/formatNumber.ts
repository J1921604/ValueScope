/**
 * 数値フォーマットユーティリティ
 * 
 * 憲法遵守:
 * - ロケール対応（日本語）
 * - 単位自動選択（億円、兆円）
 * - ゼロ除算防止
 * - パーセンテージ精度制御
 */

/**
 * 数値を日本円形式でフォーマット（カンマ区切り）
 * 
 * @param value - 数値（百万円単位）
 * @param decimals - 小数点以下桁数（デフォルト: 0）
 * @returns フォーマット済み文字列（例: "1,234"）
 */
export function formatNumber(value: number, decimals: number = 0): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    return value.toLocaleString("ja-JP", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.error(`formatNumber error: ${error}`);
    return value.toString();
  }
}

/**
 * 百万円単位の数値を億円単位でフォーマット
 * 
 * @param value - 数値（百万円単位）
 * @param decimals - 小数点以下桁数（デフォルト: 0）
 * @returns フォーマット済み文字列（例: "1,234億円"）
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    const okuyen = value / 100; // 百万円 → 億円
    return `${formatNumber(okuyen, decimals)}億円`;
  } catch (error) {
    console.error(`formatCurrency error: ${error}`);
    return `${value}百万円`;
  }
}

/**
 * 百万円単位の数値を兆円/億円で自動フォーマット
 * 
 * @param value - 数値（百万円単位）
 * @param decimals - 小数点以下桁数（デフォルト: 2）
 * @returns フォーマット済み文字列（例: "1.23兆円" or "1,234億円"）
 */
export function formatCurrencyAuto(value: number, decimals: number = 2): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    const okuyen = value / 100;
    
    // 1兆円（10,000億円）以上なら兆円表記
    if (Math.abs(okuyen) >= 10000) {
      const choyen = okuyen / 10000;
      return `${formatNumber(choyen, decimals)}兆円`;
    } else {
      return `${formatNumber(okuyen, decimals)}億円`;
    }
  } catch (error) {
    console.error(`formatCurrencyAuto error: ${error}`);
    return `${value}百万円`;
  }
}

/**
 * 倍率（ratio）をフォーマット
 * 
 * @param value - 倍率
 * @param decimals - 小数点以下桁数（デフォルト: 2）
 * @returns フォーマット済み文字列（例: "12.34x"）
 */
export function formatRatio(value: number, decimals: number = 2): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    return `${formatNumber(value, decimals)}x`;
  } catch (error) {
    console.error(`formatRatio error: ${error}`);
    return `${value}x`;
  }
}

/**
 * パーセンテージをフォーマット
 * 
 * @param value - パーセンテージ値（0-100）
 * @param decimals - 小数点以下桁数（デフォルト: 2）
 * @returns フォーマット済み文字列（例: "12.34%"）
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    return `${formatNumber(value, decimals)}%`;
  } catch (error) {
    console.error(`formatPercentage error: ${error}`);
    return `${value}%`;
  }
}

/**
 * 小数（0.0-1.0）をパーセンテージでフォーマット
 * 
 * @param value - 小数値（0.0-1.0）
 * @param decimals - 小数点以下桁数（デフォルト: 2）
 * @returns フォーマット済み文字列（例: "12.34%"）
 */
export function formatDecimalAsPercentage(value: number, decimals: number = 2): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    return formatPercentage(value * 100, decimals);
  } catch (error) {
    console.error(`formatDecimalAsPercentage error: ${error}`);
    return `${value * 100}%`;
  }
}

/**
 * 前期比変動率をフォーマット（±表記、矢印付き）
 * 
 * @param current - 当期値
 * @param previous - 前期値
 * @param decimals - 小数点以下桁数（デフォルト: 2）
 * @returns フォーマット済み文字列（例: "+12.34% ↑" or "-5.67% ↓"）
 */
export function formatChangePercentage(
  current: number,
  previous: number,
  decimals: number = 2
): string {
  try {
    if (!isFinite(current) || !isFinite(previous) || previous === 0) {
      return "N/A";
    }
    
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const sign = change >= 0 ? "+" : "";
    const arrow = change >= 0 ? "↑" : "↓";
    
    return `${sign}${formatNumber(change, decimals)}% ${arrow}`;
  } catch (error) {
    console.error(`formatChangePercentage error: ${error}`);
    return "N/A";
  }
}

/**
 * 絶対変動額をフォーマット
 * 
 * @param current - 当期値
 * @param previous - 前期値
 * @param unit - 単位（デフォルト: "億円"）
 * @param decimals - 小数点以下桁数（デフォルト: 0）
 * @returns フォーマット済み文字列（例: "+123億円"）
 */
export function formatChangeAmount(
  current: number,
  previous: number,
  unit: string = "億円",
  decimals: number = 0
): string {
  try {
    if (!isFinite(current) || !isFinite(previous)) {
      return "N/A";
    }
    
    const change = current - previous;
    const sign = change >= 0 ? "+" : "";
    
    return `${sign}${formatNumber(change, decimals)}${unit}`;
  } catch (error) {
    console.error(`formatChangeAmount error: ${error}`);
    return "N/A";
  }
}

/**
 * 数値を短縮形式でフォーマット（1K、1M、1B等）
 * 
 * @param value - 数値
 * @param decimals - 小数点以下桁数（デフォルト: 1）
 * @returns フォーマット済み文字列（例: "1.2M"）
 */
export function formatCompact(value: number, decimals: number = 1): string {
  try {
    if (!isFinite(value)) {
      return "N/A";
    }
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    
    if (absValue >= 1e9) {
      return `${sign}${formatNumber(absValue / 1e9, decimals)}B`;
    } else if (absValue >= 1e6) {
      return `${sign}${formatNumber(absValue / 1e6, decimals)}M`;
    } else if (absValue >= 1e3) {
      return `${sign}${formatNumber(absValue / 1e3, decimals)}K`;
    } else {
      return `${sign}${formatNumber(absValue, decimals)}`;
    }
  } catch (error) {
    console.error(`formatCompact error: ${error}`);
    return value.toString();
  }
}

/**
 * 安全な除算（ゼロ除算防止）
 * 
 * @param numerator - 分子
 * @param denominator - 分母
 * @param defaultValue - ゼロ除算時のデフォルト値（デフォルト: 0）
 * @returns 除算結果
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  try {
    if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
      return defaultValue;
    }
    
    const result = numerator / denominator;
    return isFinite(result) ? result : defaultValue;
  } catch (error) {
    console.error(`safeDivide error: ${error}`);
    return defaultValue;
  }
}
