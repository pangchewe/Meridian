/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";

export interface KaminoRates {
  solLendApy: number;
  solBorrowApy: number;
  solMaxLtv: number;
  usdcLendApy: number;
  usdcBorrowApy: number;
  usdcMaxLtv: number;
}

export function useKaminoRates() {
  const [rates, setRates] = useState<KaminoRates>({
    solLendApy: 6.5,
    solBorrowApy: 7.4,
    solMaxLtv: 74,
    usdcLendApy: 4.5,
    usdcBorrowApy: 7.0,
    usdcMaxLtv: 80,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://api.kamino.finance/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/metrics?env=mainnet-beta"
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch Kamino rates: ${res.statusText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const solReserve = data.find((r: any) => r.liquidityToken === "SOL");
        const usdcReserve = data.find((r: any) => r.liquidityToken === "USDC");

        const newRates: KaminoRates = { ...rates };

        if (solReserve) {
          newRates.solLendApy = parseFloat(solReserve.supplyApy) * 100;
          newRates.solBorrowApy = parseFloat(solReserve.borrowApy) * 100;
          newRates.solMaxLtv = parseFloat(solReserve.maxLtv) * 100;
        }

        if (usdcReserve) {
          newRates.usdcLendApy = parseFloat(usdcReserve.supplyApy) * 100;
          newRates.usdcBorrowApy = parseFloat(usdcReserve.borrowApy) * 100;
          newRates.usdcMaxLtv = parseFloat(usdcReserve.maxLtv) * 100;
        }

        setRates(newRates);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching Kamino rates:", err);
      setError(err.message || "Failed to load real-time Kamino rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();

    // Poll every 60 seconds
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    rates,
    loading,
    error,
    refetch: fetchRates,
  };
}
