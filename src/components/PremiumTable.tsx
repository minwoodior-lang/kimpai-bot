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
import { UserPrefs, normalizeSymbol } from "@/hooks/useUserPrefs";

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
  prefs?: UserPrefs;
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 min-w-[180px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
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
              <img src={option.logo} alt="" className="w-4 h-4 rounded flex-shrink-0" />
              <span className="text-white text-sm whitespace-nowrap">{renderLabel(option)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TradingViewChart = dynamic(() => import("./charts/TradingViewChart"), {
  ssr: false,
  loading: () => <div className="h-[360px] bg-slate-900/50 animate-pulse rounded-xl" />,
});

// =======================
// Premium Data 타입
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
  if (usdt >= 1) return `$${usdt.toFixed(2)}`;
  if (usdt >= 0.01) return `$${usdt.toFixed(4)}`;
  return `$${usdt.toFixed(6)}`;
};

// =========================
// 🔥 PremiumTableRow — 아이콘/차트 버튼 축소 적용 완료
// =========================

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
        <tr className="text-[9px] sm:text-[10px] md:text-sm hover:bg-slate-800/60 transition-colors leading-relaxed">

          {/* ★ 즐겨찾기 — 크기 축소됨 */}
          <td className="w-[24px] sm:w-[30px] text-center py-1 sm:py-1.5 md:py-3 px-1">
            <button
              type="button"
              className={`text-[12px] sm:text-[14px] p-0.5 leading-none transition-colors ${
                isFav ? "text-[#FDCB52]" : "text-[#A7B3C6]/40 hover:text-[#FDCB52]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite?.(row.symbol);
              }}
            >
              ★
            </button>
          </td>

          {/* 코인명 + 아이콘 */}
          <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 md:py-3">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3">

              {/* 📈 차트 버튼 — 크기 축소됨 */}
              <button
                type="button"
                className="p-0.5 text-[10px] sm:text-[14px] text-slate-400 hover:text-slate-200"
                onClick={() => {
                  const next = expandedSymbol === row.symbol ? null : row.symbol;
                  setExpandedSymbol(next);
                  if (next && onChartSelect) {
                    onChartSelect(row.symbol, domesticExchange, foreignExchange);
                  }
                }}
              >
                📈
              </button>

              {/* 코인 아이콘 — 모바일 크기 축소됨 */}
              <CoinIcon
                symbol={row.symbol}
                iconUrl={row.icon_url}
                className="w-3 h-3 sm:w-4 sm:h-4 md:w-8 md:h-8 flex-shrink-0"
              />

              <div
                className="flex flex-col flex-1 min-w-0 cursor-pointer"
                onClick={() => openCmcPage(row.symbol, row.cmcSlug)}
              >
                <span className="truncate text-[11px] sm:text-[13px] md:text-[14px] font-medium text-white">
                  {getDisplayName(row)}
                </span>
                <span className="truncate text-[9px] sm:text-[11px] md:text-[12px] text-gray-500 uppercase">
                  {getDisplaySymbol(row.symbol)}
                </span>
              </div>
            </div>
          </td>
          {/* 현재가 */}
          <td className="w-[110px] sm:w-[140px] px-1 sm:px-2 md:px-3 lg:px-4 text-right">
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
          <td className="w-[60px] sm:w-[95px] px-1 sm:px-2 md:px-3 lg:px-4 text-right">
            <TwoLineCell
              line1={row.premiumRate !== null ? formatPercent(row.premiumRate) : "-"}
              line2={
                row.premiumDiffKrw !== null
                  ? formatKrwDiffByBase(row.premiumDiffKrw, row.koreanPrice)
                  : "-"
              }
              line1Color={getPremiumColor(row.premiumRate)}
              isUnlisted={isUnlisted}
            />
          </td>

          {/* 전일대비 */}
          <td className="w-[90px] sm:w-[160px] md:w-[180px] px-1 sm:px-2 text-right">
            <TwoLineCell
              line1={row.changeRate !== null ? formatPercent(row.changeRate) : "-"}
              line2={
                row.changeAbsKrw !== null
                  ? formatKrwDiffByBase(row.changeAbsKrw, row.koreanPrice)
                  : "-"
              }
              line1Color={getChangeColor(row.changeRate)}
            />
          </td>

          {/* 고가대비 */}
          <td className="hidden md:table-cell w-[90px] text-right">
            <TwoLineCell
              line1={formatPercent(row.fromHighRate)}
              line2={formatKrwDomestic(row.high24h)}
              line1Color={getChangeColor(row.fromHighRate)}
            />
          </td>

          {/* 저가대비 */}
          <td className="hidden md:table-cell w-[90px] text-right">
            <TwoLineCell
              line1={formatPercent(row.fromLowRate)}
              line2={formatKrwDomestic(row.low24h)}
              line1Color={getChangeColor(row.fromLowRate)}
            />
          </td>

          {/* 거래액 */}
          <td className="w-[110px] md:w-[140px] px-1 sm:px-2 text-right pr-0">
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

          {/* 펼쳐진 차트 */}
          {expandedSymbol === row.symbol && (
          <tr>
            <td colSpan={8} className="p-0">
              <div className="w-full bg-[#050819] overflow-hidden">
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
// PremiumTable Component
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
  const [domesticExchange, setDomesticExchange] = useState("UPBIT_KRW");
  const [foreignExchange, setForeignExchange] = useState("BINANCE_USDT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24hKrw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const [visibleCount, setVisibleCount] = useState(100);
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  const favorites = useMemo(
    () => new Set((prefs?.favorites || []).map((s) => normalizeSymbol(s))),
    [prefs?.favorites]
  );

  // ==========================
  // 데이터 Fetch
  // ==========================

  const fetchData = async () => {
    if (rateLimitRetryAfter > 0) return;

    try {
      const res = await fetch(
        `/api/premium/table-filtered?domestic=${domesticExchange}&foreign=${foreignExchange}`
      );

      if (!res.ok) return;

      const json = (await res.json()) as ApiResponse;
      if (!json.success) return;

      setData(json.data);
      setFxRate(json.fxRate);
      setTotalCoins(json.totalCoins);
      setListedCoins(json.listedCoins);
      setLoading(false);
    } catch (e) {
      //
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [domesticExchange, foreignExchange]);

  // ==========================
  // 정렬 + 검색 + 필터
  // ==========================

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (prefs?.filterMode === "favorites") {
      result = result.filter((row) =>
        favorites.has(normalizeSymbol(row.symbol))
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.symbol.toLowerCase().includes(q));
    }

    // 정렬
    if (sortKey) {
      result.sort((a, b) => {
        let av = a[sortKey] ?? -999999;
        let bv = b[sortKey] ?? -999999;

        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();

        return sortOrder === "asc" ? av - bv : bv - av;
      });
    }

    if (limit > 0) result = result.slice(0, limit);

    return result;
  }, [data, searchQuery, favorites, sortKey, sortOrder, limit, prefs?.filterMode]);

  // 무한스크롤
  useEffect(() => {
    if (loadMoreInView) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredAndSortedData.length));
    }
  }, [loadMoreInView, filteredAndSortedData.length]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ==========================
  // 렌더링
  // ==========================

  return (
    <section className="w-full mb-20">

      {/* 테이블 */}
      <div className="w-full border border-white/5 bg-[#050819] overflow-hidden">

        {/* 🔥 모바일 table-auto 유지됨 */}
        <table className="w-full table-auto md:table-fixed border-separate border-spacing-y-0">

          <colgroup>
            <col className="w-[26px]" />
            <col className="w-[88px] md:w-auto" />
            <col className="w-[82px] md:w-[140px]" />
            <col className="w-[60px] md:w-[90px]" />
            <col className="w-[90px] md:w-[180px]" />
            <col className="hidden md:table-column w-[90px]" />
            <col className="hidden md:table-column w-[90px]" />
            <col className="w-[110px] md:w-[140px]" />
          </colgroup>

          <thead>
            <tr className="bg-slate-900/60 text-[#A7B3C6]/60 text-[11px] md:text-sm">
              <th />
              <th className="cursor-pointer">코인명</th>
              <th className="cursor-pointer">현재가</th>
              <th className="cursor-pointer">김프</th>
              <th className="cursor-pointer">전일대비</th>
              <th className="hidden md:table-cell cursor-pointer">고가대비</th>
              <th className="hidden md:table-cell cursor-pointer">저가대비</th>
              <th className="cursor-pointer">거래액(일)</th>
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
                getDisplayName={(i) => i.name_ko || i.koreanName || i.symbol}
                getDisplaySymbol={(s) => s}
                formatPercent={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`}
                formatKrwPrice={(v) => (v ? v.toLocaleString() : "-")}
                formatVolumeKRW={(v) => (v ? v.toLocaleString() : "-")}
                getPremiumColor={(v) =>
                  v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "text-gray-400"
                }
                getChangeColor={(v) =>
                  v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "text-gray-400"
                }
                calcDiff={(c, b) => ({ percent: 0, diff: 0, valid: true })}
                getTvSymbolForRow={() => ""}
                openCmcPage={openCmcPage}
              />
            ))}

            {visibleCount < filteredAndSortedData.length && (
              <tr ref={loadMoreRef}>
                <td colSpan={8} className="text-center py-4 text-slate-400 text-sm">
                  {visibleCount} / {filteredAndSortedData.length} 로딩 중…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
