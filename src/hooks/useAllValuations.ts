/**
 * useAllValuations.ts - 3社の企業価値データを同時取得するカスタムフック
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { useState, useEffect } from 'react';

export interface ValuationDataItem {
  date: string;
  marketCap: number;
  enterpriseValue: number;
  evEbitdaRatio: number;
  per: number;
  pbr: number;
  netDebt: number;
  ebitda: number;
}

interface AllValuationsData {
  TEPCO: ValuationDataItem | null;
  CHUBU: ValuationDataItem | null;
  JERA: ValuationDataItem | null;
}

interface UseAllValuationsReturn {
  data: AllValuationsData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * useAllValuations - 3社の企業価値データを一括取得
 */
export function useAllValuations(): UseAllValuationsReturn {
  const [data, setData] = useState<AllValuationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
          ? import.meta.env.BASE_URL 
          : `${import.meta.env.BASE_URL}/`;
        const response = await fetch(`${baseUrl}data/valuation.json`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (isMounted) {
          const allValuations: AllValuationsData = {
            TEPCO: jsonData.companies?.TEPCO ?? null,
            CHUBU: jsonData.companies?.CHUBU ?? null,
            JERA: jsonData.companies?.JERA ?? null,
          };
          setData(allValuations);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}
