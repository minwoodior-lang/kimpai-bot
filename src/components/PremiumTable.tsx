import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import {
  FOREIGN_EXCHANGES as CONTEXT_FOREIGN_EXCHANGES,
  EXCHANGE_LOGOS,
} from "@/contexts/ExchangeSelectionContext";
import CoinIcon from "@/components/CoinIcon";
import { openCmcPage } from "@/lib/coinMarketCapUtils";

interface DropdownOption {
  id: string;
  name: string;
  shortName?: string;
  logo: string;
}

function MiniDropdown({
  value,
  options,
  onChange,
  showShortName = false,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  showShortName?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderLabel = (option?: DropdownOption) => {
    if (!option) return "";
    if (showShortName && option.shortName) return option.shortName;
    return option.name.replace("🇰🇷 ", "");
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-600 hover:border-slate-500 transition-colors"
      >
        {selectedOption && (
          <img
            src={selectedOption.logo}
            alt=""
            className="w-4 h-4 rounded flex-shrink-0"
          />
        )}
        <span className="text-white text-sm whitespace-nowrap">
          {renderLabel(selectedOption)}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          <div>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 transition-colors text-left ${
                  value === option.id ? "bg-slate-700/50" : ""
                }`}
              >
                <img
                  src={option.logo}
                  alt=""
                  className="w-4 h-4 rounded flex-shrink-0"
                />
                <span className="text-white text-sm whitespace-nowrap">
                  {renderLabel(option)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TradingViewChart = dynamic(() => import("./charts/TradingViewChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] bg-slate-900/50 animate-pulse rounded-xl" />
  ),
});

interface PremiumData {
  symbol: string;
  exchange: string;
  market_symbol: string;
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
  high24h: number;
  low24h: number;
  isListed: boolean;
  cmcSlug?: string;
  displayName?: string;
  name_ko?: string;
  name_en?: string;
  icon_url?: string;
}

interface ApiResponse {
  success: boolean;
  data: PremiumData[];
  averagePremium: number;
  fxRate: number;
  updatedAt: string;
  domesticExchange: string;
  foreignExchange: string;
  totalCoins: number;
  listedCoins: number;
}

type SortKey =
  | "symbol"
  | "premium"
  | "volume24hKrw"
  | "change24h"
  | "koreanPrice"
  | "high24h"
  | "low24h";

type SortOrder = "asc" | "desc";

interface FlashState {
  [key: string]: {
    price?: "up" | "down";
    premium?: "up" | "down";
  };
}

const DOMESTIC_EXCHANGES: DropdownOption[] = [
  {
    id: "UPBIT_KRW",
    name: "🇰🇷 업비트 KRW",
    logo: EXCHANGE_LOGOS.UPBIT,
  },
  {
    id: "UPBIT_BTC",
    name: "🇰🇷 업비트 BTC",
    logo: EXCHANGE_LOGOS.UPBIT,
  },
  {
    id: "UPBIT_USDT",
    name: "🇰🇷 업비트 USDT",
    logo: EXCHANGE_LOGOS.UPBIT,
  },
  {
    id: "BITHUMB_KRW",
    name: "🇰🇷 빗썸 KRW",
    logo: EXCHANGE_LOGOS.BITHUMB,
  },
  {
    id: "BITHUMB_BTC",
    name: "🇰🇷 빗썸 BTC",
    logo: EXCHANGE_LOGOS.BITHUMB,
  },
  {
    id: "BITHUMB_USDT",
    name: "🇰🇷 빗썸 USDT",
    logo: EXCHANGE_LOGOS.BITHUMB,
  },
  {
    id: "COINONE_KRW",
    name: "🇰🇷 코인원 KRW",
    logo: EXCHANGE_LOGOS.COINONE,
  },
];

const FOREIGN_EXCHANGES: DropdownOption[] = CONTEXT_FOREIGN_EXCHANGES.map(
  (ex) => ({
    id: ex.value,
    name: ex.label,
    shortName: ex.shortName ?? ex.label,
    logo: ex.logo,
  }),
);

// 거래소 한글 라벨 맵
const EXCHANGE_LABEL_KO: Record<string, string> = {
  UPBIT: "업비트",
  BITHUMB: "빗썸",
  COINONE: "코인원",
  OKX: "OKX",
  GATE: "Gate.io",
  BINANCE: "바이낸스",
  BYBIT: "바이비트",
  BITGET: "Bitget",
  HTX: "HTX",
  MEXC: "MEXC",
  FOREIGN: "해외 거래소",
  DOMESTIC: "국내 거래소",
};

function getExchangeLabel(exchange: string | undefined): string {
  if (!exchange) return "거래소";
  return EXCHANGE_LABEL_KO[exchange] || exchange;
}

const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

function getChosung(str: string): string {
  let result = "";

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code >= 0xac00 && code <= 0xd7a3) {
      const chosungIndex = Math.floor((code - 0xac00) / 588);
      result += CHOSUNG[chosungIndex];
    } else {
      result += str[i];
    }
  }

  return result;
}

function matchSearch(item: PremiumData, query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return true;

  if (item.symbol.toLowerCase().includes(lowerQuery)) return true;
  if ((item.name || "").toLowerCase().includes(lowerQuery)) return true;
  if ((item.koreanName || "").toLowerCase().includes(lowerQuery)) return true;
  if ((item.name_ko || "").toLowerCase().includes(lowerQuery)) return true;
  if ((item.name_en || "").toLowerCase().includes(lowerQuery)) return true;

  const displayName = item.name_ko || item.koreanName || item.symbol;
  const chosung = getChosung(displayName);
  if (chosung.toLowerCase().includes(lowerQuery)) return true;

  return false;
}

export interface PremiumTableProps {
  showHeader?: boolean;
  showFilters?: boolean;
  limit?: number;
  refreshInterval?: number;
}

export default function PremiumTable({
  showHeader = true,
  showFilters = true,
  limit = 0,
  refreshInterval = 3000,
}: PremiumTableProps) {
  const [data, setData] = useState<PremiumData[]>([]);
  const [averagePremium, setAveragePremium] = useState(0);
  const [fxRate, setFxRate] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [listedCoins, setListedCoins] = useState(0);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState(0);
  const [consecutiveRateLimits, setConsecutiveRateLimits] = useState(0);
  const [domesticExchange, setDomesticExchange] = useState<string>("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState<string>("BINANCE_BTC");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24hKrw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [flashStates, setFlashStates] = useState<FlashState>({});

  const prevDataRef = useRef<
    Record<string, { price: number; premium: number | null }>
  >({});

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const toggleChart = (symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol));
  };

  const detectChanges = useCallback((newData: PremiumData[]) => {
    try {
      if (!Array.isArray(newData)) return;

      const newFlashStates: FlashState = {};
      const newPrevData: Record<
        string,
        { price: number; premium: number | null }
      > = {};

      newData.forEach((item) => {
        if (
          !item ||
          typeof item.symbol !== "string" ||
          typeof item.koreanPrice !== "number"
        ) {
          return;
        }

        const prev = prevDataRef.current[item.symbol];
        newPrevData[item.symbol] = {
          price: item.koreanPrice,
          premium: item.premium,
        };

        if (prev) {
          const priceDiff = Math.abs(item.koreanPrice - prev.price);
          const priceThreshold = Math.max(prev.price * 0.0001, 0.00001);

          if (priceDiff > priceThreshold && priceDiff > 0) {
            newFlashStates[item.symbol] = {
              ...newFlashStates[item.symbol],
              price: item.koreanPrice > prev.price ? "up" : "down",
            };
          }

          if (
            item.premium !== null &&
            prev.premium !== null &&
            Math.abs(item.premium - prev.premium) > 0.01
          ) {
            newFlashStates[item.symbol] = {
              ...newFlashStates[item.symbol],
              premium: item.premium > prev.premium ? "up" : "down",
            };
          }
        }
      });

      prevDataRef.current = newPrevData;

      if (Object.keys(newFlashStates).length > 0) {
        try {
          setFlashStates(newFlashStates);
          setTimeout(() => {
            try {
              setFlashStates({});
            } catch (e) {
              if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.error(
                  "[PremiumTable] setFlashStates cleanup error:",
                  e,
                );
              }
            }
          }, 600);
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error("[PremiumTable] setFlashStates error:", e);
          }
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[PremiumTable] detectChanges error:", err);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      if (rateLimitRetryAfter > 0) return;

      let response: Response | null = null;
      try {
        response = await fetch(
          `/api/premium/table-filtered?domestic=${domesticExchange}&foreign=${foreignExchange}`,
        );
      } catch (err) {
        // Network error - silently ignore (don't log, could trigger error handler)
        return;
      }

      if (!response) return;

      if (response.status === 429) {
        const retryAfter = Math.max(
          parseInt(response.headers.get("retry-after") || "10", 10),
          10,
        );
        const newCount = consecutiveRateLimits + 1;
        setConsecutiveRateLimits(newCount);
        const delayMs = newCount >= 5 ? 60000 : retryAfter * 1000;
        setRateLimitRetryAfter(delayMs / 1000);
        setTimeout(() => {
          setRateLimitRetryAfter(0);
          setConsecutiveRateLimits(0);
        }, delayMs);
        return;
      }

      if (!response.ok) return;

      let json: ApiResponse | null = null;
      try {
        json = await response.json();
      } catch (err) {
        // JSON parse error - silently ignore
        return;
      }

      if (!json || !json.success) {
        return;
      }

      if (!Array.isArray(json.data) || json.data.length === 0) {
        setData([]);
        return;
      }

      try {
        detectChanges(json.data);
        setData(json.data);
        setAveragePremium(typeof json.averagePremium === "number" ? json.averagePremium : 0);
        setFxRate(typeof json.fxRate === "number" ? json.fxRate : 0);
        setUpdatedAt(
          typeof json.updatedAt === "string"
            ? json.updatedAt
            : new Date().toISOString(),
        );
        setTotalCoins(typeof json.totalCoins === "number" ? json.totalCoins : 0);
        setListedCoins(typeof json.listedCoins === "number" ? json.listedCoins : 0);
        setError(null);
        setConsecutiveRateLimits(0);
      } catch (err) {
        // Catch-all: silently suppress all errors
      } finally {
        setLoading(false);
      }
    } catch (err) {
      // Silent error suppression
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domesticExchange, foreignExchange, refreshInterval]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      result = result.filter((item) => matchSearch(item, searchQuery));
    }

    result.sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      if (aVal === null || aVal === undefined) {
        aVal = sortOrder === "asc" ? Infinity : -Infinity;
      }
      if (bVal === null || bVal === undefined) {
        bVal = sortOrder === "asc" ? Infinity : -Infinity;
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    if (limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [data, searchQuery, sortKey, sortOrder, limit]);

  // 코인 표시명 생성: displayName ?? name_ko ?? name_en ?? koreanName ?? symbol
  const getDisplayName = (item: PremiumData): string => {
    // 백엔드에서 생성한 displayName 우선
    if (item.displayName && item.displayName.trim()) return item.displayName;
    // name_ko (한글명) 차선
    if (item.name_ko && item.name_ko.trim()) return item.name_ko;
    // koreanName (레거시) 폴백
    if (item.koreanName && item.koreanName.trim()) return item.koreanName;
    // name_en (영문명)
    if (item.name_en && item.name_en.trim()) return item.name_en;
    // 마지막은 심볼
    return item.symbol;
  };

  const formatKRW = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return value.toLocaleString("ko-KR");
  };

  const formatKrwPrice = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";

    if (value >= 1000) {
      return Math.round(value).toLocaleString("ko-KR");
    }
    if (value >= 100) {
      return value.toFixed(1);
    }
    if (value >= 1) {
      return value.toFixed(2);
    }
    return value.toFixed(4);
  };

  const formatUsdtPrice = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";

    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${value.toFixed(4)}`;
  };

  const formatVolumeKRW = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value) || value === 0)
      return "-";

    if (value >= 1e12) {
      const jo = Math.floor(value / 1e12);
      const eok = Math.floor((value % 1e12) / 1e8);
      if (eok > 0) {
        return `${jo}조 ${eok}억`;
      }
      return `${jo}조`;
    }
    if (value >= 1e8) {
      return `${Math.floor(value / 1e8)}억`;
    }
    if (value >= 1e4) {
      return `${Math.floor(value / 1e4)}만`;
    }
    return Math.round(value).toLocaleString("ko-KR");
  };

  const formatVolumeUsdt = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value) || value === 0)
      return "-";

    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getPremiumColor = (premium: number | null) => {
    if (premium === null) return "text-gray-500";
    if (premium >= 5) return "text-red-400";
    if (premium >= 3) return "text-orange-400";
    if (premium >= 1) return "text-yellow-400";
    if (premium >= 0) return "text-green-400";
    return "text-blue-400";
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-gray-500";
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getFlashClass = (symbol: string, field: "price" | "premium") => {
    const flash = flashStates[symbol]?.[field];
    if (!flash) return "";
    return flash === "up" ? "animate-flash-green" : "animate-flash-red";
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <span className="text-gray-600 ml-1 text-xs">↕</span>;
    }
    return sortOrder === "asc" ? (
      <span className="text-blue-400 ml-1 text-xs">↑</span>
    ) : (
      <span className="text-blue-400 ml-1 text-xs">↓</span>
    );
  };

  const getDomesticName = () => {
    const exchange = DOMESTIC_EXCHANGES.find((e) => e.id === domesticExchange);
    return exchange ? exchange.name : "국내";
  };

  const getForeignName = () => {
    const exchange = CONTEXT_FOREIGN_EXCHANGES.find(
      (e) => e.value === foreignExchange,
    );
    return exchange ? (exchange.shortName ?? exchange.label) : "해외";
  };

  const calcDiff = (current: number, base: number) => {
    if (!current || !base || isNaN(current) || isNaN(base) || base === 0) {
      return { percent: 0, diff: 0, valid: false };
    }
    const diff = current - base;
    const percent = (diff / base) * 100;
    return { percent, diff, valid: true };
  };

  // TradingView 심볼 오버라이드 (특수 마켓용)
  const TV_SYMBOL_OVERRIDES: Record<string, string> = {
    // 예시: H: "OKX:HUSDT",
  };

  const getTvSymbol = (symbol: string) => {
    const base = symbol.split("/")[0].toUpperCase();
    if (TV_SYMBOL_OVERRIDES[base]) {
      return TV_SYMBOL_OVERRIDES[base];
    }
    return `BINANCE:${base}USDT`;
  };

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">평균 김프</div>
            <div
              className={`text-xl font-bold ${getPremiumColor(averagePremium)}`}
            >
              {(averagePremium ?? 0) >= 0 ? "+" : ""}
              {(averagePremium ?? 0).toFixed(2)}%
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">환율 (USDT/KRW)</div>
            <div className="text-xl font-bold text-white">
              ₩{fxRate.toLocaleString("ko-KR")}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">코인 수</div>
            <div className="text-xl font-bold text-white">
              {listedCoins}
              <span className="text-sm text-gray-400">/{totalCoins}개</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">업데이트</div>
            <div className="text-lg font-medium text-white">
              {updatedAt
                ? new Date(updatedAt).toLocaleTimeString("ko-KR")
                : "--:--:--"}
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="mb-6 pt-4 space-y-3">
          {/* PC 레이아웃: 한 줄 */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            {/* 왼쪽: 기준/해외 거래소 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[12px] whitespace-nowrap">🇰🇷 기준 거래소</span>
                <MiniDropdown
                  value={domesticExchange}
                  options={DOMESTIC_EXCHANGES}
                  onChange={setDomesticExchange}
                />
              </div>

              <span className="text-gray-500">↔</span>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[12px] whitespace-nowrap">🌐 해외 거래소</span>
                <MiniDropdown
                  value={foreignExchange}
                  options={FOREIGN_EXCHANGES}
                  onChange={setForeignExchange}
                  showShortName={true}
                />
              </div>
            </div>

            {/* 오른쪽: 총 개수 + 검색 */}
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-[12px] whitespace-nowrap">
                암호화폐 총 <span className="text-white font-medium">{totalCoins}</span>개
              </span>
              <div className="w-[240px] relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BTC, 비트코인, ㅂㅌ"
                  className="w-full bg-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 border border-slate-600 focus:border-blue-500 focus:outline-none text-xs md:text-sm"
                />
              </div>
            </div>
          </div>

          {/* 모바일 레이아웃: 여러 줄 */}
          <div className="sm:hidden space-y-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px] whitespace-nowrap">🇰🇷 기준 거래소</span>
                <MiniDropdown
                  value={domesticExchange}
                  options={DOMESTIC_EXCHANGES}
                  onChange={setDomesticExchange}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px] whitespace-nowrap">🌐 해외 거래소</span>
                <MiniDropdown
                  value={foreignExchange}
                  options={FOREIGN_EXCHANGES}
                  onChange={setForeignExchange}
                  showShortName={true}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-gray-400 text-[10px] whitespace-nowrap">
                암호화폐 총 <span className="text-white font-medium">{totalCoins}</span>개
              </span>
              <div className="w-full relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BTC, 비트코인, ㅂㅌ"
                  className="w-full dark:bg-slate-700 light:bg-slate-100 dark:text-white light:text-slate-900 rounded-lg pl-8 pr-3 py-1.5 border dark:border-slate-600 light:border-slate-300 dark:focus:border-blue-500 light:focus:border-blue-400 focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full table-auto border-separate border-spacing-y-0">
              <thead>
                <tr className="dark:bg-slate-900/60 light:bg-slate-200 dark:text-slate-400 light:text-slate-700 text-[10px] sm:text-[11px] border-b dark:border-slate-800 light:border-slate-300">
                  <th className="px-1.5 sm:px-2 py-1 text-left font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("symbol")}>
                    코인명
                    <SortIcon columnKey="symbol" />
                  </th>
                  <th className="px-1.5 sm:px-2 py-1 text-right font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("koreanPrice")}>
                    현재가
                    <SortIcon columnKey="koreanPrice" />
                  </th>
                  <th className="px-1.5 sm:px-2 py-1 text-right font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("premium")}>
                    김프
                    <SortIcon columnKey="premium" />
                  </th>
                  <th className="px-1.5 sm:px-2 py-1 text-right font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("change24h")}>
                    전일
                    <SortIcon columnKey="change24h" />
                  </th>
                  <th className="hidden sm:table-cell px-1.5 sm:px-2 py-1 text-right font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("high24h")}>
                    고가대비
                    <SortIcon columnKey="high24h" />
                  </th>
                  <th className="hidden sm:table-cell px-1.5 sm:px-2 py-1 text-right font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("low24h")}>
                    저가대비
                    <SortIcon columnKey="low24h" />
                  </th>
                  <th className="px-1.5 sm:px-2 py-1 text-right font-medium whitespace-nowrap cursor-pointer dark:hover:text-white light:hover:text-slate-900 transition-colors" onClick={() => handleSort("volume24hKrw")}>
                    거래액
                    <SortIcon columnKey="volume24hKrw" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((row, index) => {
                  const uniqueKey = `${row.symbol}_${index}`;
                  const prevClose =
                    row.change24h !== null
                      ? row.koreanPrice / (1 + row.change24h / 100)
                      : row.koreanPrice;

                  const prevDiff =
                    row.change24h !== null
                      ? calcDiff(row.koreanPrice, prevClose)
                      : { percent: 0, diff: 0, valid: false };

                  const highDiff = calcDiff(row.koreanPrice, row.high24h);
                  const lowDiff = calcDiff(row.koreanPrice, row.low24h);

                  return (
                    <React.Fragment key={uniqueKey}>
                      <tr
                        className="border-b dark:border-slate-800/80 light:border-slate-200 dark:hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
                      >
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-3">
                            {/* 아이콘 + 별 (세로) */}
                            <div className="flex flex-col items-center justify-center gap-1 min-w-[36px]">
                              <CoinIcon symbol={row.symbol} className="h-7 w-7" iconUrl={row.icon_url} />
                              <button
                                type="button"
                                className="text-[11px] leading-none dark:text-slate-500 light:text-slate-400 dark:hover:text-yellow-400 light:hover:text-yellow-500 transition-colors"
                                onClick={() => toggleFavorite(row.symbol)}
                              >
                                {favorites.has(row.symbol) ? "★" : "☆"}
                              </button>
                            </div>
                            <div className="flex flex-col justify-center leading-tight min-w-0">
                              <button
                                onClick={() => openCmcPage(row.symbol, row.cmcSlug)}
                                className="dark:hover:text-blue-400 light:hover:text-blue-600 transition-colors text-left truncate"
                              >
                                <span className="text-[12px] dark:text-slate-100 light:text-slate-900 font-medium truncate max-w-[90px]">
                                  {getDisplayName(row)}
                                </span>
                              </button>
                              <span className="text-[11px] dark:text-slate-500 light:text-slate-600 truncate max-w-[90px]">
                                {row.symbol}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className={`px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[12px] whitespace-nowrap ${getFlashClass(row.symbol, "price")}`}>
                          ₩{formatKrwPrice(row.koreanPrice)}
                        </td>

                        <td className={`px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[12px] whitespace-nowrap ${getFlashClass(row.symbol, "premium")}`}>
                          {row.premium !== null && row.premium !== undefined ? (
                            <span className={getPremiumColor(row.premium)}>
                              {row.premium >= 0 ? "+" : ""}{Number(row.premium).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        <td className="px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[12px] whitespace-nowrap">
                          {row.change24h !== null && row.change24h !== undefined ? (
                            <span className={getChangeColor(row.change24h)}>
                              {row.change24h >= 0 ? "+" : ""}{Number(row.change24h).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        <td className="hidden sm:table-cell px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[12px] whitespace-nowrap">
                          {highDiff.valid && highDiff.percent !== null && highDiff.percent !== undefined ? (
                            <span className={getChangeColor(highDiff.percent)}>
                              {highDiff.percent >= 0 ? "+" : ""}{Number(highDiff.percent).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        <td className="hidden sm:table-cell px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[12px] whitespace-nowrap">
                          {lowDiff.valid && lowDiff.percent !== null && lowDiff.percent !== undefined ? (
                            <span className={getChangeColor(lowDiff.percent)}>
                              {lowDiff.percent >= 0 ? "+" : ""}{Number(lowDiff.percent).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        <td className="px-1 sm:px-2 py-1.5 text-right text-[10px] sm:text-[12px] whitespace-nowrap">
                          {row.volume24hKrw !== null && row.volume24hKrw !== undefined ? (
                            <span className="dark:text-slate-100 light:text-slate-900">{formatVolumeKRW(row.volume24hKrw)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>

                      {expandedSymbol === row.symbol && (
                        <tr key={`${row.symbol}-chart`}>
                          <td colSpan={7} className="p-0 lg:table-cell">
                            <div className="bg-[#0F111A] border-t border-b border-slate-700/50 py-3 px-3">
                              <div className="h-[360px] rounded-xl overflow-hidden bg-slate-900/50">
                                <TradingViewChart
                                  tvSymbol={getTvSymbol(row.symbol)}
                                  height={360}
                                  interval="60"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
