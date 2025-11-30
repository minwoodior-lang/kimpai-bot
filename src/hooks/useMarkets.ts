import { useState, useEffect, useCallback } from "react";

export type MarketRow = {
  symbol: string;
  name: string;
  upbitPrice: number;
  binancePrice: number;
  premium: number;
  volume24h: number;
  change24h: number;
  domesticExchange?: string;
  foreignExchange?: string;
};

type UseMarketsOptions = {
  limit?: number;
  domestic?: string;
  foreign?: string;
};

type UseMarketsResult = {
  data: MarketRow[];
  loading: boolean;
  error: Error | null;
  fxRate: number;
  averagePremium: number;
  updatedAt: string;
  refetch: () => void;
  domesticExchange: string;
  foreignExchange: string;
};

export function useMarkets(options?: UseMarketsOptions | number): UseMarketsResult {
  const limit = typeof options === "number" ? options : options?.limit;
  const domestic = typeof options === "object" ? options?.domestic : undefined;
  const foreign = typeof options === "object" ? options?.foreign : undefined;

  const [data, setData] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fxRate, setFxRate] = useState(1400);
  const [averagePremium, setAveragePremium] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("BINANCE_USDT");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (domestic) params.append("domestic", domestic);
      if (foreign) params.append("foreign", foreign);
      
      const queryString = params.toString();
      const url = `/api/premium/table${queryString ? `?${queryString}` : ""}`;
      
      const res = await fetch(url);
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
          domesticExchange?: string;
          foreignExchange?: string;
        }) => ({
          symbol: `${item.symbol}/KRW`,
          name: item.name,
          upbitPrice: item.koreanPrice,
          binancePrice: item.globalPrice * json.fxRate,
          premium: item.premium,
          volume24h: item.volume24h,
          change24h: item.change24h,
          domesticExchange: item.domesticExchange,
          foreignExchange: item.foreignExchange,
        }));

        const slicedData = limit ? rows.slice(0, limit) : rows;
        setData(slicedData);
        setFxRate(json.fxRate);
        setAveragePremium(json.averagePremium);
        setUpdatedAt(json.updatedAt);
        setDomesticExchange(json.domesticExchange || "UPBIT_KRW");
        setForeignExchange(json.foreignExchange || "BINANCE_USDT");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [limit, domestic, foreign]);

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
    domesticExchange,
    foreignExchange,
  };
}
