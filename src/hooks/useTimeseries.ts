/**
 * useTimeseries.ts - 時系列データ読み込みカスタムフック
 * Version: 1.0.0
 * Date: 2025-12-15
 * 
 * Purpose: 年次KPI推移データを取得
 */

import { useState, useEffect } from 'react';
import type { CompanyName } from '../types';

export interface TimeSeriesDataPoint {
  date: string;
  year: number;
  // KPI指標
  roic?: number;
  wacc?: number;
  ebitdaMargin?: number;
  fcfMargin?: number;
  // EV関連指標
  enterpriseValue?: number;
  marketCap?: number;
  interestBearingDebt?: number;
  cashAndDeposits?: number;
  netDebt?: number;
  operatingCashFlow?: number;
  ebitda?: number;
  netIncome?: number;
  equity?: number;
  evEbitdaRatio?: number;
  per?: number;
  pbr?: number;
  stockPrice?: number;
  // PL項目（14項目対応）
  revenue?: number; // 売上高（営業収益）
  operatingIncome?: number; // 営業利益
  ordinaryIncome?: number; // 経常利益
  // BS項目
  totalAssets?: number; // 総資産
  netAssets?: number; // 純資産
  // CF項目
  investingCashFlow?: number; // 投資活動CF
  financingCashFlow?: number; // 財務活動CF
}

export type CompanyTimeseries = Partial<Record<CompanyName, TimeSeriesDataPoint[]>>;

interface UseTimeseriesReturn {
  data: CompanyTimeseries | null;
  loading: boolean;
  error: Error | null;
}

/**
 * useTimeseries - 時系列データを取得するフック
 */
export function useTimeseries(): UseTimeseriesReturn {
  const [data, setData] = useState<CompanyTimeseries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const windowOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const absoluteBase = new URL(import.meta.env.BASE_URL || '/', windowOrigin || 'http://localhost');
        const dataUrl = new URL('data/timeseries.json', absoluteBase);
        const response = await fetch(dataUrl.toString());
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();

        if (isMounted) {
          setData(jsonData);
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
