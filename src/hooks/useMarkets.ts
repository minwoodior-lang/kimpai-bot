import { useState, useEffect, useCallback } from "react";

export type MarketRow = {
  symbol: string;
  name: string;
  koreanName: string;
  upbitPrice: number;
  binancePrice: number | null;
  premium: number | null;
  volume24hKrw: number;
  volume24hUsdt: number | null;
  volume24hForeignKrw: number | null;
  change24h: number | null;
  domesticExchange?: string;
  foreignExchange?: string;
  isListed: boolean;
  cmcSlug?: string;
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
  totalCoins: number;
  listedCoins: number;
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
  const [foreignExchange, setForeignExchange] = useState("OKX_USDT");
  const [totalCoins, setTotalCoins] = useState(0);
  const [listedCoins, setListedCoins] = useState(0);

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
          koreanName: string;
          koreanPrice: number;
          globalPrice: number | null;
          globalPriceKrw: number | null;
          premium: number | null;
          volume24hKrw: number;
          volume24hUsdt: number | null;
          volume24hForeignKrw: number | null;
          change24h: number | null;
          domesticExchange?: string;
          foreignExchange?: string;
          isListed: boolean;
          cmcSlug?: string;
        }) => ({
          symbol: `${item.symbol}/KRW`,
          name: item.name,
          koreanName: item.koreanName,
          upbitPrice: item.koreanPrice,
          binancePrice: item.globalPriceKrw,
          premium: item.premium,
          volume24hKrw: item.volume24hKrw,
          volume24hUsdt: item.volume24hUsdt,
          volume24hForeignKrw: item.volume24hForeignKrw,
          change24h: item.change24h,
          domesticExchange: item.domesticExchange,
          foreignExchange: item.foreignExchange,
          isListed: item.isListed,
          cmcSlug: item.cmcSlug,
        }));

        const slicedData = limit ? rows.slice(0, limit) : rows;
        setData(slicedData);
        setFxRate(json.fxRate);
        setAveragePremium(json.averagePremium);
        setUpdatedAt(json.updatedAt);
        setDomesticExchange(json.domesticExchange || "UPBIT_KRW");
        setForeignExchange(json.foreignExchange || "OKX_USDT");
        setTotalCoins(json.totalCoins || 0);
        setListedCoins(json.listedCoins || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [limit, domestic, foreign]);

  useEffect(() => {
    fetchData();
    
    // 1초마다 폴링하여 실시간 가격 업데이트
    const interval = setInterval(fetchData, 1000);
    
    return () => clearInterval(interval);
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
    totalCoins,
    listedCoins,
  };
}
