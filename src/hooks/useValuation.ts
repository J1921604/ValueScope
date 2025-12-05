/**
 * 企業価値データフック
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { useState, useEffect } from 'react';
import type { CompanyName } from '../types';

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

export function useValuation(companyName: CompanyName) {
  const [data, setData] = useState<ValuationDataItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        console.log(`[useValuation] Fetching valuation data for ${companyName}...`);
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
          ? import.meta.env.BASE_URL 
          : `${import.meta.env.BASE_URL}/`;
        const response = await fetch(`${baseUrl}data/valuation.json`);
        console.log(`[useValuation] Response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        console.log(`[useValuation] JSON keys:`, Object.keys(json));
        console.log(`[useValuation] Companies:`, Object.keys(json.companies || {}));
        
        const companyData = json.companies?.[companyName];

        if (!companyData) {
          console.error(`[useValuation] Data not found for ${companyName}`);
          throw new Error(`Data not found for ${companyName}`);
        }

        console.log(`[useValuation] Successfully loaded data for ${companyName}:`, companyData);
        setData(companyData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[useValuation] Error:`, errorMessage, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
        console.log(`[useValuation] Loading complete. Data exists:`, !!data);
      }
    }

    fetchData();
  }, [companyName]);

  return { data, loading, error };
}
