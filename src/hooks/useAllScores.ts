/**
 * useAllScores.ts - 3社のKPIスコアカードデータを同時取得するカスタムフック
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { useState, useEffect } from 'react';
import type { PeriodFilter } from '../types';

interface KPIScore {
  value: number;
  score: string;
  change?: number;
}

interface ScoreCardData {
  date: string;
  companyCode: string;
  roe: KPIScore;
  equityRatio: KPIScore;
  dscr: KPIScore;
}

interface AllScoresData {
  TEPCO: ScoreCardData | null;
  CHUBU: ScoreCardData | null;
  JERA: ScoreCardData | null;
}

interface UseAllScoresReturn {
  data: AllScoresData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * useAllScores - 3社のスコアカードデータを一括取得
 */
export function useAllScores(periodFilter: PeriodFilter): UseAllScoresReturn {
  const [data, setData] = useState<AllScoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/ValueScope/data/scorecards.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (isMounted) {
          const allScores: AllScoresData = {
            TEPCO: jsonData.companies?.TEPCO?.[periodFilter] ?? null,
            CHUBU: jsonData.companies?.CHUBU?.[periodFilter] ?? null,
            JERA: jsonData.companies?.JERA?.[periodFilter] ?? null,
          };
          setData(allScores);
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
  }, [periodFilter]);

  return { data, loading, error };
}
