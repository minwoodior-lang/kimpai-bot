import { useState, useEffect, useCallback } from "react";

export type MarketRow = {
  symbol: string;
  name: string;
  upbitPrice: number;
  binancePrice: number;
  premium: number;
  volume24h: number;
  change24h: number;
};

type UseMarketsResult = {
  data: MarketRow[];
  loading: boolean;
  error: Error | null;
  fxRate: number;
  averagePremium: number;
  updatedAt: string;
  refetch: () => void;
};

export function useMarkets(limit?: number): UseMarketsResult {
  const [data, setData] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fxRate, setFxRate] = useState(1325);
  const [averagePremium, setAveragePremium] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/premium/table");
      if (!res.ok) {
        throw new Error("Failed to fetch market data");
      }

      const json = await res.json();

      if (json.success && json.data) {
        const rows: MarketRow[] = json.data.map((item: {
          symbol: string;
          name: string;
          koreanPrice: number;
          globalPrice: number;
          premium: number;
          volume24h: number;
          change24h: number;
        }) => ({
          symbol: `${item.symbol}/KRW`,
          name: item.name,
          upbitPrice: item.koreanPrice,
          binancePrice: item.globalPrice * json.fxRate,
          premium: item.premium,
          volume24h: item.volume24h,
          change24h: item.change24h,
        }));

        const slicedData = limit ? rows.slice(0, limit) : rows;
        setData(slicedData);
        setFxRate(json.fxRate);
        setAveragePremium(json.averagePremium);
        setUpdatedAt(json.updatedAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fxRate,
    averagePremium,
    updatedAt,
    refetch: fetchData,
  };
}
