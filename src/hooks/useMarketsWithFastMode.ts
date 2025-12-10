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

type UseMarketsFastModeResult = {
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
  fastSymbolSet: Set<string>;
};

/**
 * FAST(1초, TOP30) + SLOW(6초, 전체) 이중 폴링 훅
 * - FAST: 국내 KRW 기준 거래대금 TOP30만 1초 간격 폴링
 * - SLOW: 전체 코인 6초 간격 폴링
 * - SLOW 응답을 base로 사용하되, FAST 심볼은 덮어쓰기
 */
export function useMarketsWithFastMode(
  domestic?: string,
  foreign?: string
): UseMarketsFastModeResult {
  const [data, setData] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fxRate, setFxRate] = useState(1400);
  const [averagePremium, setAveragePremium] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("BINANCE_USDT");
  const [totalCoins, setTotalCoins] = useState(0);
  const [listedCoins, setListedCoins] = useState(0);
  const [fastSymbolSet, setFastSymbolSet] = useState<Set<string>>(new Set());

  // SLOW 응답 (전체, 6초)
  const [slowData, setSlowData] = useState<MarketRow[] | null>(null);
  // FAST 응답 (TOP30, 1초)
  const [fastData, setFastData] = useState<MarketRow[] | null>(null);

  const buildQueryString = useCallback(
    (mode?: string) => {
      const params = new URLSearchParams();
      if (domestic) params.append("domestic", domestic);
      if (foreign) params.append("foreign", foreign);
      if (mode) params.append("mode", mode);
      return params.toString();
    },
    [domestic, foreign]
  );

  // 응답 파싱 헬퍼
  const parseResponse = useCallback((json: any): MarketRow[] => {
    if (!json.success || !json.data) return [];
    return json.data.map((item: any) => ({
      symbol: item.symbol,
      name: item.name_en || item.symbol,
      koreanName: item.name_ko || item.symbol,
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
  }, []);

  // SLOW 폴링 (6초)
  const fetchSlow = useCallback(async () => {
    try {
      const queryString = buildQueryString();
      const url = `/api/premium/table-filtered${
        queryString ? `?${queryString}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch SLOW data");
      const json = await res.json();
      const rows = parseResponse(json);
      setSlowData(rows);
      setFxRate(json.fxRate);
      setAveragePremium(json.averagePremium);
      setUpdatedAt(json.updatedAt);
      setDomesticExchange(json.domesticExchange || "UPBIT_KRW");
      setForeignExchange(json.foreignExchange || "BINANCE_USDT");
      setTotalCoins(json.totalCoins || 0);
      setListedCoins(json.listedCoins || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [buildQueryString, parseResponse]);

  // FAST 폴링 (1초)
  const fetchFast = useCallback(async () => {
    try {
      const queryString = buildQueryString("fast");
      const url = `/api/premium/table-filtered${
        queryString ? `?${queryString}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch FAST data");
      const json = await res.json();
      const rows = parseResponse(json);
      setFastData(rows);
      setFastSymbolSet(new Set(rows.map((r) => r.symbol)));
    } catch (err) {
      // FAST 에러는 조용히 무시 (SLOW가 있으니까)
    }
  }, [buildQueryString, parseResponse]);

  // 초기 로드 + SLOW/FAST 폴링 시작
  useEffect(() => {
    // 초기 로드: SLOW만 먼저
    setLoading(true);
    fetchSlow().finally(() => setLoading(false));

    // SLOW: 6초 간격
    const slowInterval = setInterval(fetchSlow, 6000);

    // FAST: 1초 간격
    const fastInterval = setInterval(fetchFast, 1000);

    // 탭 숨겨짐 감지 (선택사항)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(slowInterval);
        clearInterval(fastInterval);
      } else {
        fetchSlow();
        fetchFast();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(slowInterval);
      clearInterval(fastInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSlow, fetchFast]);

  // SLOW + FAST 병합: SLOW를 base로, FAST 심볼만 덮어쓰기
  useEffect(() => {
    if (!slowData) return;

    const baseRows = [...slowData];
    if (!fastData || fastData.length === 0) {
      setData(baseRows);
      return;
    }

    // FAST 심볼 맵 생성
    const fastMap = new Map(fastData.map((r) => [r.symbol, r]));

    // SLOW 행 중 FAST에 있으면 덮어쓰기
    const mergedRows = baseRows.map((row) => fastMap.get(row.symbol) ?? row);

    setData(mergedRows);
  }, [slowData, fastData]);

  return {
    data,
    loading,
    error,
    fxRate,
    averagePremium,
    updatedAt,
    refetch: fetchSlow,
    domesticExchange,
    foreignExchange,
    totalCoins,
    listedCoins,
    fastSymbolSet,
  };
}
