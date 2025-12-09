// src/components/PremiumTable.tsx
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
import TwoLinePriceCell, {
  formatKrwDynamic,
  formatKrwDomestic,
  formatKrwDiffByBase,
} from "@/components/TwoLinePriceCell";
import TwoLineCell from "@/components/TwoLineCell";
import { openCmcPage } from "@/lib/coinMarketCapUtils";
import { normalizeSymbol } from "@/hooks/useUserPrefs";

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
  // 🔹 외부 타입에 안 의존하도록 로컬 타입으로 정의
  prefs?: {
    favorites?: string[];
    filterMode?: "all" | "favorites" | "foreign";
    priceUnit?: "KRW" | "USDT";
  };
  onChartSelect?: (
    symbol: string,
    domesticExchange: string,
    foreignExchange: string
  ) => void;
  toggleFavorite?: (symbol: string) => void;
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

// =======================
// Row 타입
// =======================

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

interface PremiumTableRowProps {
  row: PremiumData;
  index: number;
  favorites: Set<string>;
  expandedSymbol: string | null;
  domesticExchange: string;
  foreignExchange: string;
  priceUnit: "KRW" | "USDT";
  fxRate: number;
  toggleFavorite?: (symbol: string) => void;
  setExpandedSymbol: (symbol: string | null) => void;
  onChartSelect?: (
    symbol: string,
    domesticExchange: string,
    foreignExchange: string
  ) => void;
  getDisplayName: (item: PremiumData) => string;
  getDisplaySymbol: (symbol: string) => string;
  formatPercent: (value: number | null) => string;
  formatKrwPrice: (value: number | null) => string;
  formatVolumeKRW: (value: number | null) => string;
  getPremiumColor: (premium: number | null) => string;
  getChangeColor: (change: number | null) => string;
  calcDiff: (
    current: number,
    base: number
  ) => { percent: number; diff: number; valid: boolean };
  getTvSymbolForRow: (params: {
    symbol: string;
    domesticExchange: string;
    foreignExchange: string;
  }) => string;
  openCmcPage: (symbol: string, cmcSlug?: string) => void;
}

const formatUsdtDynamic = (
  value: number | null | undefined,
  fxRate: number
): string => {
  if (value === null || value === undefined || Number.isNaN(value) || fxRate <= 0)
    return "-";
  const usdt = value / fxRate;
  if (usdt >= 1000) {
    return `$${usdt.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (usdt >= 1) {
    return `$${usdt.toFixed(2)}`;
  }
  if (usdt >= 0.01) {
    return `$${usdt.toFixed(4)}`;
  }
  return `$${usdt.toFixed(6)}`;
};

const PremiumTableRow = React.memo(
  ({
    row,
    index,
    favorites,
    expandedSymbol,
    domesticExchange,
    foreignExchange,
    priceUnit,
    fxRate,
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
    const normalizedSymbol = normalizeSymbol(row.symbol);
    const isFav = favorites.has(normalizedSymbol);
    const isUnlisted = !row.foreignPriceKrw || row.foreignPriceKrw <= 0;

    return (
      <React.Fragment key={uniqueKey}>
        <tr
          className="text-[8px] sm:text-[9px] md:text-sm hover:bg-slate-800/60 transition-colors leading-relaxed"
          data-symbol={row.symbol}
        >
          {/* 즐겨찾기 (PC 전용) */}
          <td className="hidden md:table-cell w-[18px] sm:w-[24px] text-center py-1 sm:py-1.5 md:py-3 px-1 sm:px-2 md:px-3 lg:px-4 min-h-[40px] sm:min-h-auto">
            <button
              type="button"
              className={`text-[13px] sm:text-[14px] p-0 leading-none transition-colors ${
                isFav ? "text-[#FDCB52]" : "text-[#A7B3C6]/40 hover:text-[#FDCB52]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (toggleFavorite) toggleFavorite(row.symbol);
              }}
              title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              ★
            </button>
          </td>

          {/* 코인명 (모바일: 즐겨찾기 + 차트 버튼 포함) */}
          <td className="px-[2px] sm:px-2 md:px-3 lg:px-4 py-1.5 md:py-3 min-h-[40px] sm:min-h-auto">
            <div className="flex items-center gap-[2px] sm:gap-1 md:gap-2 min-w-0">
              {/* 모바일용 즐겨찾기 + 차트 버튼 묶음 */}
              <div className="flex items-center gap-[2px] mr-[2px] md:hidden">
                {/* 즐겨찾기 (모바일) */}
                <button
                  type="button"
                  className={`text-[11px] p-0 leading-none transition-colors ${
                    isFav
                      ? "text-[#FDCB52]"
                      : "text-[#A7B3C6]/40 hover:text-[#FDCB52]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (toggleFavorite) toggleFavorite?.(row.symbol);
                  }}
                  title={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                >
                  ★
                </button>

                {/* 차트 버튼 (모바일) */}
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      expandedSymbol === row.symbol ? null : row.symbol;
                    setExpandedSymbol(next);
                    if (onChartSelect && next) {
                      onChartSelect(row.symbol, domesticExchange, foreignExchange);
                    }
                  }}
                  className="p-0 text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                  title="차트 보기"
                >
                  📈
                </button>
              </div>

              {/* 차트 버튼 (PC 전용) */}
              <button
                type="button"
                onClick={() => {
                  const next =
                    expandedSymbol === row.symbol ? null : row.symbol;
                  setExpandedSymbol(next);
                  if (onChartSelect && next) {
                    onChartSelect(row.symbol, domesticExchange, foreignExchange);
                  }
                }}
                className="hidden md:inline-block p-0 text-[11px] sm:text-xs text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                title="차트 보기"
              >
                📈
              </button>

              <CoinIcon
                symbol={row.symbol}
                className="w-[12px] h-[12px] sm:w-3 sm:h-3 md:w-7 md:h-7 flex-shrink-0"
                iconUrl={row.icon_url}
              />
              <div
                className="flex flex-col flex-1 min-w-0 cursor-pointer"
                onClick={() => openCmcPage(row.symbol, row.cmcSlug)}
              >
                <span className="truncate text-[11px] sm:text-[13px] md:text-[14px] font-medium text-white hover:text-blue-400 transition-colors">
                  {getDisplayName(row)}
                </span>
                <span className="truncate text-[9px] sm:text-[11px] md:text-[12px] text-gray-500 uppercase tracking-tight">
                  {getDisplaySymbol(row.symbol)}
                </span>
              </div>
            </div>
          </td>

          {/* 현재가 */}
          <td
            className="
              md:w-[120px]
              px-[0.5px] sm:px-1.5 md:px-3 lg:px-4
              py-0.5 sm:py-1.5 md:py-3
              text-right whitespace-nowrap
              text-[8px] md:text-[14px]
            "
          >
            {priceUnit === "USDT" ? (
              <TwoLinePriceCell
                topValue={row.koreanPrice}
                bottomValue={row.foreignPriceKrw}
                formatTop={(v) => formatUsdtDynamic(v, fxRate)}
                formatBottom={(v) => formatUsdtDynamic(v, fxRate)}
                isUnlisted={isUnlisted}
              />
            ) : (
              <TwoLinePriceCell
                topValue={row.koreanPrice}
                bottomValue={row.foreignPriceKrw}
                formatTop={formatKrwDomestic}
                formatBottom={formatKrwDynamic}
                isUnlisted={isUnlisted}
              />
            )}
          </td>

          {/* 김프 */}
          <td
            className="
              md:w-[90px]
              px-[0.5px] sm:px-1.5 md:px-3 lg:px-4
              py-0.5 sm:py-1.5 md:py-3
              text-right whitespace-nowrap
              text-[8px] md:text-[14px]
            "
          >
            <TwoLineCell
              line1={
                row.premiumRate !== null ? formatPercent(row.premiumRate) : "-"
              }
              line2={
                row.premiumDiffKrw !== null && row.koreanPrice !== null
                  ? formatKrwDiffByBase(row.premiumDiffKrw, row.koreanPrice)
                  : "-"
              }
              line1Color={
                isUnlisted ? "text-gray-500" : getPremiumColor(row.premiumRate)
              }
              isUnlisted={isUnlisted}
            />
          </td>

          {/* 전일대비 */}
          <td
            className="
              md:w-[170px]
              px-[0.5px] sm:px-1.5 md:px-3 lg:px-4
              py-0.5 sm:py-1 md:py-3
              text-right whitespace-nowrap
              text-[8px] md:text-[14px]
            "
          >
            <TwoLineCell
              line1={
                row.changeRate !== null ? formatPercent(row.changeRate) : "-"
              }
              line2={
                row.changeAbsKrw !== null && row.koreanPrice !== null
                  ? formatKrwDiffByBase(row.changeAbsKrw, row.koreanPrice)
                  : "-"
              }
              line1Color={getChangeColor(row.changeRate)}
            />
          </td>

          {/* 고가대비(24h) */}
          <td className="hidden md:table-cell md:w-[90px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
            <TwoLineCell
              line1={formatPercent(row.fromHighRate)}
              line2={formatKrwDomestic(row.high24h)}
              line1Color={getChangeColor(row.fromHighRate)}
            />
          </td>

          {/* 저가대비(24h) */}
          <td className="hidden md:table-cell md:w-[90px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
            <TwoLineCell
              line1={formatPercent(row.fromLowRate)}
              line2={formatKrwDomestic(row.low24h)}
              line1Color={getChangeColor(row.fromLowRate)}
            />
          </td>

          {/* 거래액(일) */}
          <td
            className="
              md:w-[130px]
              px-[0.5px] sm:px-1.5 md:px-3 lg:px-4
              py-0.5 sm:py-1.5 md:py-3
              text-right whitespace-nowrap pr-0
              text-[8px] md:text-[14px]
            "
          >
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

        {/* 펼친 차트 */}
        {expandedSymbol === row.symbol && (
          <tr key={`${row.symbol}-chart`}>
            <td colSpan={8} className="p-0">
              <div className="w-full overflow-hidden bg-[#050819]">
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
  }
);

// =======================
// 검색/초성 매칭
// =======================

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
  })
);

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

// =======================
// 메인 컴포넌트
// =======================

export default function PremiumTable({
  showHeader = true,
  showFilters = true,
  limit = 0,
  refreshInterval = 1000,
  prefs,
  onChartSelect,
  toggleFavorite,
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
  const [domesticExchange, setDomesticExchange] =
    useState<string>("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] =
    useState<string>("BINANCE_USDT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24hKrw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // 가상 스크롤
  const [visibleCount, setVisibleCount] = useState(100);
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  const favorites = useMemo(
    () => new Set((prefs?.favorites || []).map((s) => normalizeSymbol(s))),
    [prefs?.favorites]
  );

  const fetchData = async () => {
    try {
      if (rateLimitRetryAfter > 0) return;

      let response: Response | null = null;
      try {
        response = await fetch(
          `/api/premium/table-filtered?domestic=${domesticExchange}&foreign=${foreignExchange}`
        );
      } catch {
        return;
      }

      if (!response) return;

      if (response.status === 429) {
        const retryAfter = Math.max(
          parseInt(response.headers.get("retry-after") || "10", 10),
          10
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
      } catch {
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
        setAveragePremium(
          typeof json.averagePremium === "number" ? json.averagePremium : 0
        );
        setFxRate(typeof json.fxRate === "number" ? json.fxRate : 0);
        setUpdatedAt(
          typeof json.updatedAt === "string"
            ? json.updatedAt
            : new Date().toISOString()
        );
        setTotalCoins(
          typeof json.totalCoins === "number" ? json.totalCoins : 0
        );
        setListedCoins(
          typeof json.listedCoins === "number" ? json.listedCoins : 0
        );
        setError(null);
        setConsecutiveRateLimits(0);
      } catch {
      } finally {
        setLoading(false);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();

    const isKoreanExchange = domesticExchange.includes("_KRW");
    const actualRefreshInterval = isKoreanExchange ? 800 : refreshInterval;

    const interval = setInterval(fetchData, actualRefreshInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domesticExchange, foreignExchange, refreshInterval]);

  const handleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      if (sortOrder === "desc") {
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortKey(null);
        setSortOrder("desc");
      }
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (prefs?.filterMode === "favorites") {
      result = result.filter((item) =>
        favorites.has(normalizeSymbol(item.symbol))
      );
    } else if (prefs?.filterMode === "foreign") {
      result = result.filter(
        (item) =>
          item.isListed === true &&
          item.foreignPriceKrw !== null &&
          item.foreignPriceKrw > 0
      );
    }

    if (searchQuery) {
      result = result.filter((item) => matchSearch(item, searchQuery));
    }

    // 즐겨찾기 우선
    result.sort((a, b) => {
      const aIsFavorite = favorites.has(normalizeSymbol(a.symbol));
      const bIsFavorite = favorites.has(normalizeSymbol(b.symbol));

      if (aIsFavorite !== bIsFavorite) {
        return aIsFavorite ? -1 : 1;
      }

      if (sortKey === null) {
        return 0;
      }

      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      const aIsInvalid =
        aVal === null ||
        aVal === undefined ||
        (typeof aVal === "number" && isNaN(aVal));
      const bIsInvalid =
        bVal === null ||
        bVal === undefined ||
        (typeof bVal === "number" && isNaN(bVal));

      if (aIsInvalid && bIsInvalid) return 0;
      if (aIsInvalid) return 1;
      if (bIsInvalid) return -1;

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
  }, [
    data,
    searchQuery,
    sortKey,
    sortOrder,
    limit,
    favorites,
    prefs?.filterMode,
  ]);

  // 무한 스크롤
  useEffect(() => {
    if (loadMoreInView && visibleCount < filteredAndSortedData.length) {
      setVisibleCount((prev) =>
        Math.min(prev + 50, filteredAndSortedData.length)
      );
    }
  }, [loadMoreInView, visibleCount, filteredAndSortedData.length]);

  useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, domesticExchange, foreignExchange, sortKey, sortOrder]);

  // 모바일 여부
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getDisplayName = useCallback(
    (item: PremiumData): string => {
      const baseKoName = item.name_ko || "";
      if (isMobile && baseKoName.length > 5) {
        return baseKoName.slice(0, 5) + "…";
      }
      return baseKoName;
    },
    [isMobile]
  );

  const getDisplaySymbol = useCallback(
    (symbol: string): string => {
      if (isMobile && symbol.length > 8) {
        return symbol.slice(0, 8) + "…";
      }
      return symbol;
    },
    [isMobile]
  );

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
    return value.toFixed(2);
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

  const formatVolumeKRW = useCallback((value: number | null) => {
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
      (e) => e.value === foreignExchange
    );
    return exchange ? exchange.shortName ?? exchange.label : "해외";
  };

  const calcDiff = useCallback((current: number, base: number) => {
    if (!current || !base || isNaN(current) || isNaN(base) || base === 0) {
      return { percent: 0, diff: 0, valid: false };
    }
    const diff = current - base;
    const percent = (diff / base) * 100;
    return { percent, diff, valid: true };
  }, []);

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

  const TV_SYMBOL_OVERRIDES: Record<string, string> = {};

  const getTvSymbolForRow = useCallback(
    ({
      symbol,
      domesticExchange,
      foreignExchange,
    }: {
      symbol: string;
      domesticExchange: string;
      foreignExchange: string;
    }): string => {
      const base = symbol
        .replace("/KRW", "")
        .replace("/BTC", "")
        .replace("/USDT", "")
        .toUpperCase();

      const [domEx, domMarket] = domesticExchange.split("_");
      const [forEx, forMarket] = foreignExchange.split("_");

      if (TV_SYMBOL_OVERRIDES[base]) {
        return TV_SYMBOL_OVERRIDES[base];
      }

      if (domEx === "UPBIT" || domEx === "BITHUMB") {
        const prefix = domEx === "UPBIT" ? "UPBIT" : "BITHUMB";
        return `${prefix}:${base}${domMarket}`;
      }

      const foreignPrefix = TV_FOREIGN_PREFIX[forEx] ?? "BINANCE";
      const market = forMarket || "USDT";
      return `${foreignPrefix}:${base}${market}`;
    },
    []
  );

  return (
    <section className="w-full mb-20">
      {showFilters && (
        <>
          {/* PC 필터 영역 */}
          <div className="hidden md:flex items-center justify-between gap-4 mt-3 mb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs md:text-[13px] text-white/60">
                기준 거래소
              </span>
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
              <span className="text-xs md:text-[13px] text-white/60">
                해외 거래소
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm text-white/50 whitespace-nowrap">
                암호화폐 총{" "}
                <span className="font-semibold text-white">
                  {totalCoins}
                </span>
                개
              </span>
              <div className="w-48 md:w-56 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
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

          {/* 모바일 필터 영역 */}
          <div className="flex md:hidden flex-col gap-1.5 mb-2">
            {/* 1줄: 기준 거래소 */}
            <div className="flex items-center gap-1 flex-nowrap mb-1 relative">
              <span className="text-[11px] sm:text-[12px] text-white/60 whitespace-nowrap">
                기준 거래소
              </span>

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

              <span className="text-[11px] sm:text-[12px] text-white/60 whitespace-nowrap ml-1">
                해외 거래소
              </span>
            </div>

            {/* 2줄: 암호화폐 개수 + 검색창 한 줄 정렬 */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-[11px] sm:text-[12px] text-white/60 whitespace-nowrap">
                암호화폐 총{" "}
                <span className="font-semibold text-white">
                  {totalCoins}
                </span>
                개
              </span>

              <div className="flex-1 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BTC, 비트코인, ㅂㅌ"
                  className="w-full bg-slate-700 text-white rounded-lg pl-8 pr-3 h-[32px] border border-slate-600 focus:border-blue-500 focus:outline-none text-[16px]"
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
        <div className="w-full border border-white/5 bg-[#050819] overflow-hidden">
          <table className="w-full border-separate border-spacing-y-0 table-auto md:table-fixed">
            <colgroup>
              {/* 즐겨찾기 */}
              <col className="w-[18px] md:w-[24px]" />
              {/* 코인명 */}
              <col className="w-auto" />
              {/* 현재가 */}
              <col className="w-[70px] min-[376px]:w-[90px] md:w-[120px]" />
              {/* 김프 */}
              <col className="w-[60px] min-[376px]:w-[80px] md:w-[90px]" />
              {/* 전일대비 */}
              <col className="w-[80px] min-[376px]:w-[110px] md:w-[170px]" />
              {/* 고가대비 / 저가대비 (PC 전용) */}
              <col className="hidden md:table-column md:w-[90px]" />
              <col className="hidden md:table-column md:w-[90px]" />
              {/* 거래액(일) */}
              <col className="w-[80px] min-[376px]:w-[100px] md:w-[130px]" />
            </colgroup>

            <thead>
              <tr className="bg-slate-900/60 text-[#A7B3C6]/60 text-[9px] md:text-sm leading-tight">
                {/* 즐겨찾기 헤더 (PC 전용) */}
                <th className="hidden md:table-cell w-[22px] sm:w-[26px] min-h-11">
                  <div className="flex items-center justify-center h-[32px]" />
                </th>

                {/* 코인명 */}
                <th
                  className="px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-left font-medium tracking-wide cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("symbol")}
                >
                  <div className="flex items-center gap-[1px] sm:gap-[3px] md:gap-[4px]">
                    <span className="hidden md:inline-block md:w-[18px]" />
                    <span className="hidden md:inline-block md:w-[20px]" />
                    <span className="whitespace-nowrap">코인명</span>
                    <SortIcon columnKey="symbol" />
                  </div>
                </th>

                {/* 현재가 */}
                <th
                  className="
                    px-1 sm:px-2 md:px-3 lg:px-4
                    py-2.5 text-right font-medium whitespace-nowrap
                    cursor-pointer hover:text-white transition-colors min-h-11
                  "
                  onClick={() => handleSort("koreanPrice")}
                >
                  현재가
                  {prefs?.priceUnit === "USDT" && (
                    <span className="text-[9px] text-blue-400 ml-0.5">(USDT)</span>
                  )}
                  <SortIcon columnKey="koreanPrice" />
                </th>

                {/* 김프 */}
                <th
                  className="
                    px-1 sm:px-2 md:px-3 lg:px-4
                    py-2.5 text-right font-medium whitespace-nowrap
                    cursor-pointer hover:text-white transition-colors min-h-11
                  "
                  onClick={() => handleSort("premiumRate")}
                >
                  김프
                  <SortIcon columnKey="premiumRate" />
                </th>

                {/* 전일대비 */}
                <th
                  className="
                    px-1 sm:px-2 md:px-3 lg:px-4
                    py-2.5 text-right font-medium whitespace-nowrap
                    cursor-pointer hover:text-white transition-colors min-h-11
                  "
                  onClick={() => handleSort("changeRate")}
                >
                  전일대비
                  <SortIcon columnKey="changeRate" />
                </th>

                {/* 고가대비 */}
                <th
                  className="hidden md:table-cell md:w-[90px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right text-[11px] md:text-xs font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("fromHighRate")}
                >
                  고가대비(24h)
                  <SortIcon columnKey="fromHighRate" />
                </th>

                {/* 저가대비 */}
                <th
                  className="hidden md:table-cell md:w-[90px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right text-[11px] md:text-xs font-medium whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("fromLowRate")}
                >
                  저가대비(24h)
                  <SortIcon columnKey="fromLowRate" />
                </th>

                {/* 거래액 */}
                <th
                  className="
                    px-1 sm:px-2 md:px-3 lg:px-4
                    py-2.5 text-right font-medium whitespace-nowrap
                    cursor-pointer hover:text-white transition-colors min-h-11
                  "
                  onClick={() => handleSort("volume24hKrw")}
                >
                  거래액(일)
                  <SortIcon columnKey="volume24hKrw" />
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSortedData.slice(0, visibleCount).map((row, index) => (
                <PremiumTableRow
                  key={`${row.symbol}_${index}`}
                  row={row}
                  index={index}
                  favorites={favorites}
                  expandedSymbol={expandedSymbol}
                  domesticExchange={domesticExchange}
                  foreignExchange={foreignExchange}
                  priceUnit={prefs?.priceUnit ?? "KRW"}
                  fxRate={fxRate}
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
                  <td
                    colSpan={8}
                    className="text-center py-4 text-slate-400 text-sm"
                  >
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
