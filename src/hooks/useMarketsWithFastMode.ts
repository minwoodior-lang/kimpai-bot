import { useState, useEffect, useCallback, useRef } from "react";
import type { MarketRow } from "./useMarkets";

type UseMarketsWithFastModeOptions = {
  limit?: number;
  domestic?: string;
  foreign?: string;
};

type UseMarketsWithFastModeResult = {
  data: MarketRow[];
  loading: boolean;
  isSlowValidating: boolean;
  error: Error | null;
  fxRate: number;
  averagePremium: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
  totalCoins: number;
  listedCoins: number;
};

/**
 * FAST/SLOW 이중 갱신 훅
 * - TOP 20: 1초 갱신 (FAST)
 * - 나머지: 6초 갱신 (SLOW)
 * - 스크롤 안정성 100% 보장
 */
export function useMarketsWithFastMode(
  options?: UseMarketsWithFastModeOptions
): UseMarketsWithFastModeResult {
  const domestic = options?.domestic;
  const foreign = options?.foreign;
  const limit = options?.limit;

  const [data, setData] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSlowValidating, setIsSlowValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fxRate, setFxRate] = useState(1400);
  const [averagePremium, setAveragePremium] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("BINANCE_USDT");
  const [totalCoins, setTotalCoins] = useState(0);
  const [listedCoins, setListedCoins] = useState(0);

  // 마지막 정상 rows 보관 → 스크롤 안정성 확보
  const lastStableRows = useRef<MarketRow[]>([]);
  const slowDataRef = useRef<MarketRow[]>([]);
  const fastDataRef = useRef<MarketRow[]>([]);

  // 기본 query 생성
  const baseQuery = new URLSearchParams();
  if (domestic) baseQuery.append("domestic", domestic);
  if (foreign) baseQuery.append("foreign", foreign);
  const baseQueryString = baseQuery.toString();

  // SLOW API 호출 (전체 데이터)
  const fetchSlowData = useCallback(async () => {
    try {
      setIsSlowValidating(true);
      const url = `/api/premium/table-filtered?${baseQueryString}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch slow data");

      const json = await res.json();
      if (json.success && json.data) {
        const rows: MarketRow[] = json.data.map((item: any) => ({
          symbol: `${item.symbol}/KRW`,
          name: item.name_en,
          koreanName: item.name_ko,
          upbitPrice: item.koreanPrice,
          binancePrice: item.foreignPriceKrw,
          premium: item.premiumRate,
          volume24hKrw: item.volume24hKrw,
          volume24hUsdt: item.volume24hForeignKrw,
          volume24hForeignKrw: item.volume24hForeignKrw,
          change24h: item.changeRate,
          domesticExchange: item.domesticExchange,
          foreignExchange: item.foreignExchange,
          isListed: item.isListed,
          cmcSlug: item.cmcSlug,
        }));

        slowDataRef.current = rows;

        // SLOW 데이터로 병합 및 상태 업데이트
        const fastMap = new Map(fastDataRef.current.map((r) => [r.symbol, r]));
        const mergedRows = rows.map((row) => fastMap.get(row.symbol) ?? row);

        if (mergedRows.length > 0) {
          lastStableRows.current = mergedRows;
          setData(mergedRows);
        }

        setFxRate(json.fxRate);
        setAveragePremium(json.averagePremium);
        setUpdatedAt(json.updatedAt);
        setDomesticExchange(json.domesticExchange || "UPBIT_KRW");
        setForeignExchange(json.foreignExchange || "BINANCE_USDT");
        setTotalCoins(json.totalCoins || 0);
        setListedCoins(json.listedCoins || 0);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setLoading(false);
    } finally {
      setIsSlowValidating(false);
    }
  }, [baseQueryString]);

  // FAST API 호출 (TOP 20만)
  const fetchFastData = useCallback(async () => {
    try {
      const url = `/api/premium/table-filtered?${baseQueryString}&mode=fast`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch fast data");

      const json = await res.json();
      if (json.success && json.data) {
        const rows: MarketRow[] = json.data.map((item: any) => ({
          symbol: `${item.symbol}/KRW`,
          name: item.name_en,
          koreanName: item.name_ko,
          upbitPrice: item.koreanPrice,
          binancePrice: item.foreignPriceKrw,
          premium: item.premiumRate,
          volume24hKrw: item.volume24hKrw,
          volume24hUsdt: item.volume24hForeignKrw,
          volume24hForeignKrw: item.volume24hForeignKrw,
          change24h: item.changeRate,
          domesticExchange: item.domesticExchange,
          foreignExchange: item.foreignExchange,
          isListed: item.isListed,
          cmcSlug: item.cmcSlug,
        }));

        fastDataRef.current = rows;

        // FAST 데이터와 SLOW 데이터 병합
        // → SLOW 데이터 순서 유지하되, TOP 20은 FAST 최신값으로 갱신
        const fastMap = new Map(rows.map((r) => [r.symbol, r]));
        const mergedRows = slowDataRef.current
          .map((row) => fastMap.get(row.symbol) ?? row)
          .slice(0, limit || undefined);

        if (mergedRows.length > 0) {
          lastStableRows.current = mergedRows;
          setData(mergedRows);
        }
      }
    } catch (err) {
      // FAST API 에러는 무시 (SLOW로 복구)
      console.debug("[FAST] Fetch error (silent fallback):", err);
    }
  }, [baseQueryString, limit]);

  // 초기 로딩: SLOW 데이터 먼저 가져오기
  useEffect(() => {
    fetchSlowData();
  }, [fetchSlowData]);

  // FAST: 1초마다 갱신
  useEffect(() => {
    const fastInterval = setInterval(fetchFastData, 1000);
    return () => clearInterval(fastInterval);
  }, [fetchFastData]);

  // SLOW: 6초마다 갱신
  useEffect(() => {
    const slowInterval = setInterval(fetchSlowData, 6000);
    return () => clearInterval(slowInterval);
  }, [fetchSlowData]);

  // rows=0이 되는 순간 없도록 마지막 정상 rows 반환
  const rowsToRender =
    data.length > 0 ? data : lastStableRows.current;

  return {
    data: rowsToRender,
    loading,
    isSlowValidating,
    error,
    fxRate,
    averagePremium,
    updatedAt,
    domesticExchange,
    foreignExchange,
    totalCoins,
    listedCoins,
  };
}
