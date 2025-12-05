/**
 * 日付フォーマットユーティリティ
 * 
 * 憲法遵守:
 * - ISO 8601形式対応
 * - タイムゾーン考慮
 * - エラーハンドリング
 */

/**
 * ISO 8601形式の日付文字列をローカライズされた日本語形式に変換
 * 
 * @param dateString - ISO 8601形式の日付文字列（例: "2024-03-31T00:00:00Z"）
 * @returns 日本語形式の日付（例: "2024年3月31日"）
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString; // 無効な日付はそのまま返す
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed
    const day = date.getDate();
    
    return `${year}年${month}月${day}日`;
  } catch (error) {
    console.error(`formatDate error: ${error}`);
    return dateString;
  }
}

/**
 * ISO 8601形式の日付文字列を四半期形式に変換
 * 
 * @param dateString - ISO 8601形式の日付文字列
 * @returns 四半期形式（例: "2024Q1"）
 */
export function formatQuarter(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    
    return `${year}Q${quarter}`;
  } catch (error) {
    console.error(`formatQuarter error: ${error}`);
    return dateString;
  }
}

/**
 * ISO 8601形式の日付文字列を年月形式に変換
 * 
 * @param dateString - ISO 8601形式の日付文字列
 * @returns 年月形式（例: "2024年3月"）
 */
export function formatYearMonth(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    return `${year}年${month}月`;
  } catch (error) {
    console.error(`formatYearMonth error: ${error}`);
    return dateString;
  }
}

/**
 * 2つの日付の差分を計算（日数）
 * 
 * @param startDate - 開始日（ISO 8601形式）
 * @param endDate - 終了日（ISO 8601形式）
 * @returns 日数（小数点以下切り捨て）
 */
export function dateDiffDays(startDate: string, endDate: string): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error(`dateDiffDays error: ${error}`);
    return 0;
  }
}

/**
 * 相対日付表記に変換（"X日前"、"Y週間前"等）
 * 
 * @param dateString - ISO 8601形式の日付文字列
 * @returns 相対日付表記
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "今日";
    } else if (diffDays === 1) {
      return "昨日";
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}週間前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}ヶ月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
  } catch (error) {
    console.error(`formatRelativeDate error: ${error}`);
    return dateString;
  }
}
