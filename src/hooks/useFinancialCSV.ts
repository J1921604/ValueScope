import { useState, useEffect } from 'react';

export interface FinancialData {
  [key: string]: string | number;
}

export interface CompanyFinancialData {
  company: string;
  data: FinancialData[];
}

/**
 * XBRL_outputからCSVデータを読み込むカスタムフック
 * @param company 企業名（TEPCO, CHUBU, JERA）
 * @param statementType 財務諸表タイプ（PL, BS, CF）
 */
export function useFinancialCSV(company: string, statementType: 'PL' | 'BS' | 'CF') {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // GitHub Pages対応: BASE_URLを正しく適用
        const basePath = import.meta.env.BASE_URL || '/';
        // 末尾のスラッシュを正規化
        const normalizedBase = basePath.endsWith('/') ? basePath : basePath + '/';
        const csvPath = `${normalizedBase}XBRL_output/${company}/${statementType}.csv`;
        
        console.log(`[useFinancialCSV] Fetching: ${csvPath}`);
        
        const response = await fetch(csvPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${company} ${statementType} data: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('CSV data is empty');
        }

        const rows = text.split('\n').filter(row => row.trim().length > 0);
        
        if (rows.length < 2) {
          throw new Error('CSV data has no data rows');
        }

        // ヘッダー行を取得（BOM削除）
        const headers = rows[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
        
        // データ行をパース
        const parsedData = rows.slice(1).map((row) => {
          // CSVパース（カンマ区切り、ダブルクォート対応）
          const values: string[] = [];
          let currentValue = '';
          let insideQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          
          const obj: FinancialData = {};
          
          headers.forEach((header, index) => {
            const value = values[index] || '';
            // 空文字列の場合はそのまま、数値変換可能な場合は数値に
            if (value === '') {
              obj[header] = '';
            } else {
              const numValue = Number(value);
              obj[header] = isNaN(numValue) ? value : numValue;
            }
          });
          
          return obj;
        });

        setData(parsedData);
      } catch (err) {
        console.error(`Error fetching CSV for ${company} ${statementType}:`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCSV();
  }, [company, statementType]);

  return { data, loading, error };
}
