/**
 * KPIスコアデータフック
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { useState, useEffect } from 'react';
import type { CompanyName, ScoreColor, PeriodFilter } from '../types';

export interface ScoreDataItem {
  value: number;
  score: ScoreColor;
  change: number;
}

export interface ScoreCardDataItem {
  date: string;
  companyCode: string;
  roe: ScoreDataItem;
  equityRatio: ScoreDataItem;
  dscr: ScoreDataItem;
}

export function useScores(companyName: CompanyName, period: PeriodFilter = 'Annual') {
  const [data, setData] = useState<ScoreCardDataItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        console.log(`[useScores] Fetching scorecard data for ${companyName} (${period})...`);
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
          ? import.meta.env.BASE_URL 
          : `${import.meta.env.BASE_URL}/`;
        const response = await fetch(`${baseUrl}data/scorecards.json`);
        console.log(`[useScores] Response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        // console.log(`[useScores] JSON keys:`, Object.keys(json));
        
        const companyData = json.companies?.[companyName];

        if (!companyData) {
          console.error(`[useScores] Data not found for ${companyName}`);
          throw new Error(`Data not found for ${companyName}`);
        }

        // 期間データを取得（存在しない場合はlatest、それもなければnull）
        const periodData = companyData[period] || companyData['latest'];

        if (!periodData) {
             console.warn(`[useScores] Period data not found for ${companyName} ${period}`);
             // データがない場合はnullを設定（エラーにはしない）
             setData(null);
        } else {
             console.log(`[useScores] Successfully loaded data for ${companyName} (${period}):`, periodData);
             setData(periodData);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[useScores] Error:`, errorMessage, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [companyName, period]);

  return { data, loading, error };
}
