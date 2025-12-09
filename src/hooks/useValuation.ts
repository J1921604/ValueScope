/**
 * 企業価値データフック
 * Version: 1.0.0
 * Date: 2025-12-15
 */

import { useState, useEffect } from 'react';
import type { CompanyName } from '../types';

export interface ValuationDataItem {
  date: string;
  // PL項目（オプショナル - データソースによっては未提供）
  revenue?: number; // 売上高（営業収益）jpcrp_cor:OperatingRevenue
  operatingIncome?: number; // 営業利益 jpcrp_cor:OperatingIncome
  ordinaryIncome?: number; // 経常利益 jpcrp_cor:OrdinaryIncome
  profitLoss?: number; // 当期純利益 jpcrp_cor:ProfitLoss
  netIncome: number; // 親会社株主帰属当期純利益 jpcrp_cor:ProfitLossAttributableToOwnersOfParent
  // BS項目（オプショナル）
  totalAssets?: number; // 総資産 jpcrp_cor:Assets
  netAssets?: number; // 純資産 jpcrp_cor:NetAssets
  equity: number; // 自己資本 jpcrp_cor:Equity
  interestBearingDebt?: number; // 有利子負債 jpcrp_cor:InterestBearingDebt
  // CF項目（オプショナル）
  operatingCashFlow?: number; // 営業活動CF jpcrp_cor:CashFlowsFromOperatingActivities
  investingCashFlow?: number; // 投資活動CF jpcrp_cor:CashFlowsFromInvestingActivities
  financingCashFlow?: number; // 財務活動CF jpcrp_cor:CashFlowsFromFinancingActivities
  // 計算指標
  ebitda: number; // EBITDA（営業利益+減価償却費）
  roic?: number; // ROIC（NOPAT÷投下資本）
  // EV関連
  marketCap: number;
  netDebt: number;
  enterpriseValue: number;
  evEbitdaRatio: number;
  per: number;
  pbr: number;
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
