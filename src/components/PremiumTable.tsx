import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { useInView } from "react-intersection-observer";
import {
  FOREIGN_EXCHANGES as CONTEXT_FOREIGN_EXCHANGES,
  EXCHANGE_LOGOS,
} from "@/contexts/ExchangeSelectionContext";
import CoinIcon from "@/components/CoinIcon";
import PriceCell from "@/components/PriceCell";
import TwoLinePriceCell from "@/components/TwoLinePriceCell";
import TwoLineCell from "@/components/TwoLineCell";
import { openCmcPage } from "@/lib/coinMarketCapUtils";
import { useUserPrefs } from "@/hooks/useUserPrefs";

interface DropdownOption {
  id: string;
  name: string;
  shortName?: string;
  logo: string;
}

interface PremiumTableProps {
  showHeader?: boolean;
  showFilters?: boolean;
  limit?: number;
  refreshInterval?: number;
  onChartSelect?: (symbol: string, domesticExchange: string, foreignExchange: string) => void;
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
        className="flex items-center gap-0.5 sm:gap-1 bg-slate-700 rounded-lg px-2.5 sm:px-3 h-9 sm:h-10 border border-slate-600 hover:border-slate-500 transition-colors"
      >
        {selectedOption && (
          <img
            src={selectedOption.logo}
            alt=""
            className="w-4 h-4 rounded flex-shrink-0 my-auto"
          />
        )}
        <span className="text-white text-xs sm:text-sm whitespace-nowrap my-auto">
          {renderLabel(selectedOption)}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 my-auto ${
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
                className={`w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-700 transition-colors text-left min-h-10 ${
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

// Memoized Row Component for performance
interface PremiumTableRowProps {
  row: PremiumData;
  index: number;
  favorites: Set<string>;
  expandedSymbol: string | null;
  domesticExchange: string;
  foreignExchange: string;
  toggleFavorite: (symbol: string) => void;
  setExpandedSymbol: (symbol: string | null) => void;
  onChartSelect?: (symbol: string, domesticExchange: string, foreignExchange: string) => void;
  getDisplayName: (item: PremiumData) => string;
  getDisplaySymbol: (symbol: string) => string;
  formatPercent: (value: number | null) => string;
  formatKrwPrice: (value: number | null) => string;
  formatVolumeKRW: (value: number | null) => string;
  getPremiumColor: (premium: number | null) => string;
  getChangeColor: (change: number | null) => string;
  calcDiff: (current: number, base: number) => { percent: number; diff: number; valid: boolean };
  getTvSymbolForRow: (params: { symbol: string; domesticExchange: string; foreignExchange: string }) => string;
  openCmcPage: (symbol: string, cmcSlug?: string) => void;
}

const PremiumTableRow = React.memo(({
  row,
  index,
  favorites,
  expandedSymbol,
  domesticExchange,
  foreignExchange,
  toggleFavorite,
  setExpandedSymbol,
  onChartSelect,
  getDisplayName,
  getDisplaySymbol,
  formatPercent,
  formatKrwPrice,
  formatVolumeKRW,
  getPremiumColor,
  getChangeColor,
  calcDiff,
  getTvSymbolForRow,
  openCmcPage,
}: PremiumTableRowProps) => {
  const uniqueKey = `${row.symbol}_${index}`;
  const normalizedSymbol = row.symbol.replace("/KRW", "").replace("/USDT", "").replace("/BTC", "").toUpperCase();
  const isFav = favorites.has(normalizedSymbol);
  const isUnlisted = !row.foreignPriceKrw || row.foreignPriceKrw <= 0;

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
        className="text-[9px] sm:text-[10px] md:text-sm hover:bg-slate-800/60 transition-colors leading-relaxed"
        data-symbol={row.symbol}
      >
        <td className="w-[24px] sm:w-[30px] text-center py-1 sm:py-1.5 md:py-3 px-1 sm:px-2 md:px-3 lg:px-4 min-h-[44px] sm:min-h-auto">
          <button
            type="button"
            className={`p-0.5 leading-none transition-colors ${
              isFav
                ? "text-[#FDCB52]"
                : "text-[#A7B3C6]/40 hover:text-[#FDCB52]"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(row.symbol);
            }}
            title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            ★
          </button>
        </td>
        <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 md:py-3 min-h-[44px] sm:min-h-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                const next = expandedSymbol === row.symbol ? null : row.symbol;
                setExpandedSymbol(next);
                if (onChartSelect && next) {
                  onChartSelect(row.symbol, domesticExchange, foreignExchange);
                }
              }}
              className="p-0.5 sm:p-1 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0 text-xs sm:text-base"
              title="차트 보기"
            >
              📈
            </button>
            <CoinIcon symbol={row.symbol} className="w-3 sm:w-3.5 md:w-8 h-3 sm:h-3.5 md:h-8 flex-shrink-0" iconUrl={row.icon_url} />
            <div className="flex flex-col flex-1 min-w-0 cursor-pointer"
              onClick={() => openCmcPage(row.symbol, row.cmcSlug)}>
              <span className="truncate text-[11px] sm:text-[13px] md:text-[14px] font-medium text-white hover:text-blue-400 transition-colors">
                {getDisplayName(row)}
              </span>
              <span className="truncate text-[9px] sm:text-[11px] md:text-[12px] text-gray-500 uppercase tracking-tight">
                {getDisplaySymbol(row.symbol)}
              </span>
            </div>
          </div>
        </td>

        <td className="w-[110px] sm:w-[140px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
          <TwoLinePriceCell
            topValue={row.koreanPrice}
            bottomValue={row.foreignPriceKrw}
            topPrefix="₩"
            bottomPrefix="₩"
            isUnlisted={isUnlisted}
          />
        </td>

        <td className="w-[85px] sm:w-[90px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
          <TwoLineCell
            line1={isUnlisted ? "-" : formatPercent(row.premiumRate)}
            line2={`${row.premiumDiffKrw >= 0 ? "+" : ""}₩${formatKrwPrice(Math.abs(row.premiumDiffKrw || 0))}`}
            line1Color={isUnlisted ? "text-gray-500" : getPremiumColor(row.premiumRate)}
            isUnlisted={isUnlisted}
          />
        </td>

        <td className="w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-3 text-right whitespace-nowrap">
          <TwoLineCell
            line1={formatPercent(row.changeRate)}
            line2={`${row.changeAbsKrw >= 0 ? "+" : ""}₩${formatKrwPrice(Math.abs(row.changeAbsKrw || 0))}`}
            line1Color={getChangeColor(row.changeRate)}
          />
        </td>

        <td className="hidden md:table-cell w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
          <TwoLineCell
            line1={formatPercent(row.fromHighRate)}
            line2={`${row.highDiffKrw > 0 ? "-" : "+"}₩${formatKrwPrice(Math.abs(row.highDiffKrw || 0))}`}
            line1Color={getChangeColor(row.fromHighRate)}
          />
        </td>

        <td className="hidden md:table-cell w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
          <TwoLineCell
            line1={formatPercent(row.fromLowRate)}
            line2={`${row.lowDiffKrw >= 0 ? "+" : ""}₩${formatKrwPrice(Math.abs(row.lowDiffKrw || 0))}`}
            line1Color={getChangeColor(row.fromLowRate)}
          />
        </td>

        <td className="w-[105px] sm:w-[120px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap pr-0">
          <TwoLineCell
            line1={formatVolumeKRW(row.volume24hKrw)}
            line2={
              row.volume24hForeignKrw && row.volume24hForeignKrw > 0
                ? formatVolumeKRW(row.volume24hForeignKrw)
                : "-"
            }
          />
        </td>
      </tr>

      {expandedSymbol === row.symbol && (
        <tr key={`${row.symbol}-chart`}>
          <td colSpan={8} className="p-0">
            <div className="w-full rounded-b-xl overflow-hidden bg-[#050819]">
              <TradingViewChart
                tvSymbol={getTvSymbolForRow({
                  symbol: row.symbol,
                  domesticExchange,
                  foreignExchange,
                })}
                height={360}
                domesticExchange={domesticExchange}
                foreignExchange={foreignExchange}
              />
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

interface PremiumData {
  symbol: string;
  exchange: string;
  market_symbol: string;
  name: string;
  koreanName: string;
  koreanPrice: number;
  foreignPriceKrw: number;
  globalPrice: number | null;
  globalPriceKrw: number | null;
  premium: number | null;
  premiumRate: number;
  premiumDiffKrw: number;
  volume24hKrw: number | null;
  volume24hUsdt: number | null;
  volume24hForeignKrw: number | null;
  change24h: number | null;
  changeRate: number;
  changeAbsKrw: number;
  high24h: number;
  low24h: number;
  fromHighRate: number;
  highDiffKrw: number;
  fromLowRate: number;
  lowDiffKrw: number;
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
  | "premiumRate"
  | "volume24hKrw"
  | "changeRate"
  | "koreanPrice"
  | "fromHighRate"
  | "fromLowRate"
  | null;

type SortOrder = "asc" | "desc";

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

export default function PremiumTable({
  showHeader = true,
  showFilters = true,
  limit = 0,
  refreshInterval = 1000,
  onChartSelect,
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
  const [foreignExchange, setForeignExchange] = useState<string>("BINANCE_USDT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24hKrw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // Virtualized Rendering: 무한 스크롤 방식
  const [visibleCount, setVisibleCount] = useState(100);
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  // useUserPrefs hook으로 즐겨찾기 관리
  const { prefs, toggleFavorite, isFavorite, isLoaded: prefsLoaded } = useUserPrefs();
  const favorites = useMemo(() => new Set(prefs.favorites || []), [prefs.favorites]);

  const toggleChart = (symbol: string) => {
    setExpandedSymbol((prev) => (prev === symbol ? null : symbol));
  };

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

  const handleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      // 같은 컬럼 클릭 시: desc → asc → null (정렬 해제)
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortKey(null);
        setSortOrder("desc");
      }
    } else {
      // 다른 컬럼 클릭 시: desc로 시작
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // filterMode에 따른 필터링
    if (prefsLoaded && prefs.filterMode === "favorites") {
      result = result.filter((item) => {
        const normalizedSymbol = item.symbol.replace("/KRW", "").replace("/USDT", "").replace("/BTC", "").toUpperCase();
        return favorites.has(normalizedSymbol);
      });
    } else if (prefsLoaded && prefs.filterMode === "foreign") {
      // 해외 거래소에 상장된 코인만 (globalPrice가 있는 경우)
      result = result.filter((item) => item.globalPrice !== null && item.globalPrice > 0);
    }

    if (searchQuery) {
      result = result.filter((item) => matchSearch(item, searchQuery));
    }

    // 즐겨찾기 우선 정렬
    result.sort((a, b) => {
      const aNormalized = a.symbol.replace("/KRW", "").replace("/USDT", "").replace("/BTC", "").toUpperCase();
      const bNormalized = b.symbol.replace("/KRW", "").replace("/USDT", "").replace("/BTC", "").toUpperCase();
      const aIsFavorite = favorites.has(aNormalized);
      const bIsFavorite = favorites.has(bNormalized);

      if (aIsFavorite !== bIsFavorite) {
        return aIsFavorite ? -1 : 1;
      }

      // sortKey가 null이면 정렬하지 않음 (원본 순서 유지)
      if (sortKey === null) {
        return 0;
      }

      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      // null/undefined/NaN 값은 항상 맨 아래로
      const aIsInvalid = aVal === null || aVal === undefined || (typeof aVal === "number" && isNaN(aVal));
      const bIsInvalid = bVal === null || bVal === undefined || (typeof bVal === "number" && isNaN(bVal));

      if (aIsInvalid && bIsInvalid) return 0;
      if (aIsInvalid) return 1; // a를 아래로
      if (bIsInvalid) return -1; // b를 아래로

      // 정상 값 정렬
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
  }, [data, searchQuery, sortKey, sortOrder, limit, favorites, prefs.filterMode, prefsLoaded]);

  // 무한 스크롤: 스크롤 시 더 많은 row 로드
  useEffect(() => {
    if (loadMoreInView && visibleCount < filteredAndSortedData.length) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredAndSortedData.length));
    }
  }, [loadMoreInView, visibleCount, filteredAndSortedData.length]);

  // 데이터 변경 시 visibleCount 초기화
  useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, domesticExchange, foreignExchange, sortKey, sortOrder]);

  // 코인 표시명 생성: displayName ?? name_ko ?? name_en ?? koreanName ?? symbol
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getDisplayName = useCallback((item: PremiumData): string => {
    const baseKoName = item.name_ko || "";
    // 모바일에서 5글자 이상이면 자르기
    if (isMobile && baseKoName.length > 5) {
      return baseKoName.slice(0, 5) + "…";
    }
    return baseKoName;
  }, [isMobile]);

  const getOriginalDisplayName = (item: PremiumData): string => {
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

  const getDisplaySymbol = useCallback((symbol: string): string => {
    // 모바일에서 8글자 이상이면 자르기
    if (isMobile && symbol.length > 8) {
      return symbol.slice(0, 8) + "…";
    }
    return symbol;
  }, [isMobile]);

  const formatPercent = useCallback((value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  }, []);

  const formatKRW = (value: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return value.toLocaleString("ko-KR");
  };

  const formatKrwPrice = useCallback((value: number | null) => {
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
  }, []);

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

  // 🚨 IMPORTANT: 거래액(일) 표시 로직
  // - null/undefined: 데이터 없음 → "-" 표시
  // - 0 이하: 실제 거래 없음 → "-" 표시
  // - 0 초과: 숫자 포맷 출력
  // - 임의 수정 금지 (PM 협의 필수)
  const formatVolumeKRW = useCallback((value: number | null) => {
    // null/undefined 또는 0 이하는 "-" 표시
    if (value == null || Number.isNaN(value) || value <= 0) {
      return "-";
    }

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
    if (value >= 1e6) {
      return `${Math.floor(value / 1e6)}백만`;
    }
    if (value >= 1e4) {
      return `${Math.floor(value / 1e4)}만`;
    }
    return Math.round(value).toLocaleString("ko-KR");
  }, []);

  const formatVolumeUsdt = (value: number | null) => {
    // null/undefined 또는 0 이하는 "-" 표시
    if (value == null || Number.isNaN(value) || value <= 0) {
      return "-";
    }

    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getPremiumColor = useCallback((premium: number | null) => {
    if (premium === null) return "text-[#A7B3C6]";
    if (premium > 0) return "text-[#50e3a4]";
    if (premium < 0) return "text-[#ff6b6b]";
    return "text-[#A7B3C6]";
  }, []);

  const getChangeColor = useCallback((change: number | null) => {
    if (change === null) return "text-[#A7B3C6]";
    if (change > 0) return "text-[#50e3a4]";
    if (change < 0) return "text-[#ff6b6b]";
    return "text-[#A7B3C6]";
  }, []);

  const SortIcon = ({ columnKey }: { columnKey: Exclude<SortKey, null> }) => {
    if (sortKey !== columnKey || sortKey === null) {
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

  const calcDiff = useCallback((current: number, base: number) => {
    if (!current || !base || isNaN(current) || isNaN(base) || base === 0) {
      return { percent: 0, diff: 0, valid: false };
    }
    const diff = current - base;
    const percent = (diff / base) * 100;
    return { percent, diff, valid: true };
  }, []);

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

  // TV 심볼 매핑 - 거래소별
  const TV_DOMESTIC_PREFIX: Record<string, string> = {
    UPBIT: "UPBIT",
    BITHUMB: "BITHUMB",
  };

  const TV_FOREIGN_PREFIX: Record<string, string> = {
    BINANCE: "BINANCE",
    OKX: "OKX",
    BYBIT: "BYBIT",
    BITGET: "BITGET",
    GATEIO: "GATEIO",
    MEXC: "MEXC",
    HTX: "HTX",
  };

  // 코인 row별 TV 심볼 생성 (조건부)
  const getTvSymbolForRow = useCallback(({
    symbol,
    domesticExchange,
    foreignExchange
  }: {
    symbol: string;
    domesticExchange: string;
    foreignExchange: string;
  }): string => {

    // BTC/KRW → BTC 등 슬래시 제거
    const base = symbol
      .replace("/KRW", "")
      .replace("/BTC", "")
      .replace("/USDT", "")
      .toUpperCase();

    // 국내/해외 거래소 정보 분리
    const [domEx, domMarket] = domesticExchange.split("_");
    const [forEx, forMarket] = foreignExchange.split("_");

    // 업비트 또는 빗썸이면 그대로 국내 거래소 차트 사용
    if (domEx === "UPBIT" || domEx === "BITHUMB") {
      const prefix = domEx === "UPBIT" ? "UPBIT" : "BITHUMB";
      return `${prefix}:${base}${domMarket}`;
    }

    // 코인원은 TradingView 심볼이 없으므로 해외 거래소 기준으로 연결
    const foreignPrefix = TV_FOREIGN_PREFIX[forEx] ?? "BINANCE";
    const market = forMarket || "USDT";
    return `${foreignPrefix}:${base}${market}`;
  }, []);

  return (
    <section className="w-full px-0 md:px-0 mb-20">

      {showFilters && (
        <>
          {/* PC 레이아웃: 한 줄 정렬 (justify-between) */}
          <div className="hidden md:flex items-center justify-between gap-4 mt-3 mb-2">
            {/* 왼쪽: 기준/해외 거래소 + ↔ */}
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-[13px] text-white/60">기준 거래소</span>
              <MiniDropdown
                value={domesticExchange}
                options={DOMESTIC_EXCHANGES}
                onChange={setDomesticExchange}
              />
              <span className="text-white/30 text-xs md:text-sm px-1">↔</span>
              <MiniDropdown
                value={foreignExchange}
                options={FOREIGN_EXCHANGES}
                onChange={setForeignExchange}
                showShortName={true}
              />
              <span className="text-xs md:text-[13px] text-white/60">해외 거래소</span>
            </div>

            {/* 오른쪽: 암호화폐 총 N개 + 검색 */}
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm text-white/50 whitespace-nowrap">
                암호화폐 총 <span className="font-semibold text-white">{totalCoins}</span>개
              </span>
              <div className="w-48 md:w-56 relative">
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
                  className="w-full bg-slate-700 text-white rounded-lg pl-8 pr-3 h-[34px] border border-slate-600 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* 모바일 레이아웃: 2단 구조 */}
          <div className="flex md:hidden flex-col gap-1.5 mb-2">
            {/* 거래소 선택 - 1줄 */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
              <span className="text-[12px] text-white/60">기준</span>
              <MiniDropdown
                value={domesticExchange}
                options={DOMESTIC_EXCHANGES}
                onChange={setDomesticExchange}
              />
              <span className="text-white/30 text-xs px-0.5">↔</span>
              <MiniDropdown
                value={foreignExchange}
                options={FOREIGN_EXCHANGES}
                onChange={setForeignExchange}
                showShortName={true}
              />
              <span className="text-[12px] text-white/60">해외</span>
            </div>

            {/* 검색 및 개수 - 2줄 */}
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-white/50">
                암호화폐 총 <span className="font-semibold text-white">{totalCoins}</span>개
              </span>
              <div className="w-full relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BTC, 비트코인, ㅂㅌ"
                  className="w-full bg-slate-700 text-white rounded-lg pl-8 pr-3 h-[32px] border border-slate-600 focus:border-blue-500 focus:outline-none text-[12px]"
                />
              </div>
            </div>
          </div>
        </>
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
        <div className="w-full rounded-xl border border-white/5 bg-[#050819] overflow-hidden">
          <table className="w-full table-fixed border-separate border-spacing-y-0">
            <colgroup><col className="w-[30px]" /><col className="w-[35%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[17%]" /><col className="hidden md:table-column w-[8%]" /><col className="hidden md:table-column w-[8%]" /><col className="w-[16%]" /></colgroup>
            <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-[11px] md:text-sm">
                  <th className="w-[30px] text-center text-[12px] text-[#A7B3C6]/50 py-2.5 min-h-11">★</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[12px] md:text-sm font-medium text-[#A7B3C6]/60 tracking-wide cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("symbol")}>
                    코인명
                    <SortIcon columnKey="symbol" />
                  </th>
                  <th className="px-3 lg:px-4 py-2.5 text-right text-[12px] md:text-sm font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("koreanPrice")}>
                    현재가
                    <SortIcon columnKey="koreanPrice" />
                  </th>
                  <th className="px-3 lg:px-4 py-2.5 text-right text-[12px] md:text-sm font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("premiumRate")}>
                    김프
                    <SortIcon columnKey="premiumRate" />
                  </th>
                  <th className="px-3 lg:px-4 py-2.5 text-right text-[12px] md:text-sm font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("changeRate")}>
                    전일대비
                    <SortIcon columnKey="changeRate" />
                  </th>
                  <th className="hidden md:table-cell px-3 lg:px-4 py-2.5 text-right text-[11px] md:text-xs font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("fromHighRate")}>
                    고가대비
                    <SortIcon columnKey="fromHighRate" />
                  </th>
                  <th className="hidden md:table-cell px-3 lg:px-4 py-2.5 text-right text-[11px] md:text-xs font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("fromLowRate")}>
                    저가대비
                    <SortIcon columnKey="fromLowRate" />
                  </th>
                  <th className="px-3 lg:px-4 py-2.5 text-right text-[12px] md:text-sm font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11" onClick={() => handleSort("volume24hKrw")}>
                    거래액(일)
                    <SortIcon columnKey="volume24hKrw" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.slice(0, visibleCount).map((row, index) => (
                  <PremiumTableRow
                    key={row.symbol}
                    row={row}
                    index={index}
                    favorites={favorites}
                    expandedSymbol={expandedSymbol}
                    domesticExchange={domesticExchange}
                    foreignExchange={foreignExchange}
                    toggleFavorite={toggleFavorite}
                    setExpandedSymbol={setExpandedSymbol}
                    onChartSelect={onChartSelect}
                    getDisplayName={getDisplayName}
                    getDisplaySymbol={getDisplaySymbol}
                    formatPercent={formatPercent}
                    formatKrwPrice={formatKrwPrice}
                    formatVolumeKRW={formatVolumeKRW}
                    getPremiumColor={getPremiumColor}
                    getChangeColor={getChangeColor}
                    calcDiff={calcDiff}
                    getTvSymbolForRow={getTvSymbolForRow}
                    openCmcPage={openCmcPage}
                  />
                ))}
                {visibleCount < filteredAndSortedData.length && (
                  <tr ref={loadMoreRef}>
                    <td colSpan={8} className="text-center py-4 text-slate-400 text-sm">
                      {visibleCount} / {filteredAndSortedData.length} 로딩 중...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      )}
    </section>
  );
}
