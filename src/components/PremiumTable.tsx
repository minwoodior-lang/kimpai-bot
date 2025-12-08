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
  formatPercentDynamic,
} from "@/components/TwoLinePriceCell";
import { useUserPrefs } from "@/hooks/useUserPrefs";
import IndicatorSelector from "@/components/IndicatorSelector";

const TradingViewChart = dynamic(
  () => import("@/components/charts/TradingViewChart"),
  { ssr: false }
);

export type PremiumTableRow = {
  symbol: string;
  name_ko?: string | null;
  name_en?: string | null;
  icon_url?: string | null;
  koreanPrice: number | null;
  foreignPrice: number | null;
  premiumRate: number | null;
  changeRate: number | null;
  highRate: number | null;
  lowRate: number | null;
  volume24hKrw: number | null;
  domesticExchange: string;
  foreignExchange: string;
  isListed: boolean;
  fromHighRate: number | null;
  fromLowRate: number | null;
  high24h: number | null;
  low24h: number | null;
  koreanPriceChange24h: number | null;
  foreignPriceChange24h: number | null;
  tickerChangeRate24h: number | null;
  cmcSlug?: string | null;
};

type SortColumn =
  | "symbol"
  | "koreanPrice"
  | "premiumRate"
  | "changeRate"
  | "fromHighRate"
  | "fromLowRate"
  | "volume24hKrw";

type SortDirection = "asc" | "desc";

interface PremiumTableProps {
  data: PremiumTableRow[];
  isLoading: boolean;
  error?: string | null;
  onRowClick?: (row: PremiumTableRow) => void;
  onRowSymbolClick?: (row: PremiumTableRow) => void;
  onChartSymbolChange?: (symbol: string, from: string, to: string) => void;
  activeSymbol?: string;
  domesticExchange: string;
  foreignExchange: string;
  onExchangeChange?: (domestic: string, foreign: string) => void;
  availableExchanges: {
    domestic: { id: string; name: string; shortName?: string; logo: string }[];
    foreign: { id: string; name: string; shortName?: string; logo: string }[];
  };
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  filteredCount?: number;
  symbolsCount?: number;
  isChartVisible?: boolean;
  onToggleChart?: () => void;
}

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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
        className="flex items-center gap-0.5 sm:gap-1 bg-slate-700/80 hover:bg-slate-600 rounded-lg px-1.5 sm:px-2 py-1 text-xs sm:text-[13px] text-[#E3ECFF] border border-slate-600 hover:border-slate-500 transition-colors"
      >
        {value && (
          <>
            {options.find((o) => o.id === value)?.logo && (
              <img
                src={options.find((o) => o.id === value)!.logo}
                alt=""
                className="w-4 h-4 rounded flex-shrink-0 my-auto"
              />
            )}
            <span className="truncate max-w-[72px] sm:max-w-[96px]">
              {renderLabel(options.find((o) => o.id === value))}
            </span>
          </>
        )}
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-[160px] sm:w-[180px] bg-slate-900 border border-slate-700 rounded-lg shadow-lg max-h-[260px] overflow-y-auto">
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
      )}
    </div>
  );
}

function SortIcon({
  columnKey,
  activeSort,
}: {
  columnKey: SortColumn;
  activeSort?: { column: SortColumn; direction: SortDirection } | null;
}) {
  if (!activeSort || activeSort.column !== columnKey) {
    return (
      <svg className="w-3 h-3 opacity-30" viewBox="0 0 20 20" fill="none">
        <path
          d="M7 8L10 5L13 8"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 12L10 15L13 12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (activeSort.direction === "desc") {
    return (
      <svg className="w-3 h-3 text-[#6FB4FF]" viewBox="0 0 20 20" fill="none">
        <path
          d="M7 8L10 5L13 8"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="w-3 h-3 text-[#6FB4FF]" viewBox="0 0 20 20" fill="none">
      <path
        d="M7 12L10 15L13 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PremiumTable({
  data = [],               // 🔴 data 기본값 추가
  isLoading,
  error,
  onRowClick,
  onRowSymbolClick,
  onChartSymbolChange,
  activeSymbol,
  domesticExchange,
  foreignExchange,
  onExchangeChange,
  availableExchanges,
  searchQuery = "",
  onSearchChange,
  filteredCount,
  symbolsCount,
  isChartVisible = true,
  onToggleChart,
}: PremiumTableProps) {
  const [sort, setSort] = useState<{
    column: SortColumn;
    direction: SortDirection;
  } | null>({
    column: "volume24hKrw",
    direction: "desc",
  });

  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [stickyHeaderVisible, setStickyHeaderVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [isChartPinned, setIsChartPinned] = useState(false);
  const { ref, inView } = useInView({ threshold: 0 });
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [showStickySearchBar, setShowStickySearchBar] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [showMobileIndicators, setShowMobileIndicators] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string>("premium");

  const { userPrefs, updateUserPrefs } = useUserPrefs();

  const indicatorValue = useMemo(() => {
    if (userPrefs?.defaultIndicator) return userPrefs.defaultIndicator;
    return "premium";
  }, [userPrefs?.defaultIndicator]);

  const updateIndicator = useCallback(
    (value: string) => {
      setSelectedIndicator(value);
      updateUserPrefs({ defaultIndicator: value });
    },
    [updateUserPrefs]
  );

  const handleSort = useCallback(
    (column: SortColumn) => {
      setSort((prev) => {
        if (!prev || prev.column !== column) {
          return { column, direction: "desc" };
        }
        if (prev.direction === "desc") {
          return { column, direction: "asc" };
        }
        return null;
      });
    },
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!tableContainerRef.current) return;
      const rect = tableContainerRef.current.getBoundingClientRect();
      setStickyHeaderVisible(rect.top < 60);
      setShowStickySearchBar(rect.top < 120);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔧 정렬/검색 로직 – data 가 undefined 여도 항상 배열로 처리
  const filteredAndSortedData = useMemo(() => {
    let result: PremiumTableRow[] = Array.isArray(data) ? data : [];

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((row) => {
        const combined = (
          `${row.symbol} ${row.name_ko ?? ""} ${row.name_en ?? ""}`
        ).toLowerCase();
        return combined.includes(lower);
      });
    }

    if (!sort) return result;

    const { column, direction } = sort;

    const sorted = [...result].sort((a, b) => {
      const multiplier = direction === "asc" ? 1 : -1;

      const getValue = (row: PremiumTableRow): number => {
        switch (column) {
          case "symbol": {
            const name = `${row.name_ko ?? ""} ${row.symbol}`.toLowerCase();
            // 문자열 비교를 위해 첫 글자 코드 사용 (상대적 순서만 맞으면 됨)
            return name.charCodeAt(0) || 0;
          }
          case "koreanPrice":
            return row.koreanPrice ?? 0;
          case "premiumRate":
            return row.premiumRate ?? -9999;
          case "changeRate":
            return row.changeRate ?? -9999;
          case "fromHighRate":
            return row.fromHighRate ?? 9999;
          case "fromLowRate":
            return row.fromLowRate ?? -9999;
          case "volume24hKrw":
            return row.volume24hKrw ?? 0;
          default:
            return 0;
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue === bValue) return 0;
      return aValue > bValue ? multiplier : -multiplier;
    });

    return sorted;
  }, [data, searchQuery, sort]);

  const pinnedChartData = useMemo(() => {
    if (!activeSymbol) return null;
    const found = data.find((row) => row.symbol === activeSymbol);
    if (!found) return null;
    return {
      symbol: found.symbol,
      koreanName: found.name_ko ?? found.name_en ?? found.symbol,
      domesticExchange: found.domesticExchange,
      foreignExchange: found.foreignExchange,
    };
  }, [activeSymbol, data]);

  useEffect(() => {
    if (!inView) {
      return;
    }
    const timer = setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + 50, filteredAndSortedData.length)
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [inView, filteredAndSortedData.length]);

  const visibleRows = useMemo(
    () => filteredAndSortedData.slice(0, visibleCount),
    [filteredAndSortedData, visibleCount]
  );

  const handleRowClick = useCallback(
    (row: PremiumTableRow) => {
      if (onRowClick) onRowClick(row);
    },
    [onRowClick]
  );

  const handleSymbolClick = useCallback(
    (row: PremiumTableRow) => {
      if (onRowSymbolClick) onRowSymbolClick(row);
    },
    [onRowSymbolClick]
  );

  const renderStickyHeader = () => {
    if (!stickyHeaderVisible) return null;

    return (
      <div className="sticky top-[56px] z-30 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/80">
        <div className="px-3 sm:px-4 lg:px-5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">기준:</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <MiniDropdown
                value={domesticExchange}
                options={availableExchanges.domestic}
                onChange={(value) =>
                  onExchangeChange?.(value, foreignExchange)
                }
                showShortName
              />
              <span className="text-xs text-slate-500">↔</span>
              <MiniDropdown
                value={foreignExchange}
                options={availableExchanges.foreign}
                onChange={(value) =>
                  onExchangeChange?.(domesticExchange, value)
                }
                showShortName
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <IndicatorSelector
              value={indicatorValue}
              onChange={updateIndicator}
            />
          </div>
        </div>
      </div>
    );
  };

  const handleScrollToTop = () => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const visibleCountLabel =
    filteredCount && symbolsCount
      ? `${filteredCount}/${symbolsCount}`
      : `${visibleRows.length}/${filteredAndSortedData.length}`;

  const domesticOptions: DropdownOption[] = availableExchanges.domestic.map(
    (item) => ({
      id: item.id,
      name: item.name,
      shortName: item.shortName,
      logo: item.logo,
    })
  );

  const foreignOptions: DropdownOption[] = availableExchanges.foreign.map(
    (item) => ({
      id: item.id,
      name: item.name,
      shortName: item.shortName,
      logo: item.logo,
    })
  );

  const formatKrwDomestic = (value: number | null) =>
    formatKrwDynamic(value, { signed: false });

  const formatPercent = (value: number | null) =>
    formatPercentDynamic(value, { signed: true });

  const getChangeColor = (value: number | null) => {
    if (value === null || value === 0) return "text-slate-200";
    return value > 0 ? "text-[#5AD766]" : "text-[#FF5C5C]";
  };

  const TwoLineCell = ({
    line1,
    line2,
    line1Color,
    line2Color,
  }: {
    line1: string;
    line2: string;
    line1Color?: string;
    line2Color?: string;
  }) => (
    <div className="flex flex-col items-end leading-tight">
      <span
        className={`text-[12px] md:text-[13px] font-medium tabular-nums ${line1Color}`}
      >
        {line1}
      </span>
      <span
        className={`text-[10px] md:text-[11px] tabular-nums ${line2Color}`}
      >
        {line2}
      </span>
    </div>
  );

  return (
    <section className="mt-3 sm:mt-4 lg:mt-5">
      {renderStickyHeader()}

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-300">
            <span className="font-medium">기준 거래소</span>
            <span className="text-[10px] sm:text-xs text-slate-500">
              (김프 계산 기준)
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <MiniDropdown
              value={domesticExchange}
              options={domesticOptions}
              onChange={(value) => onExchangeChange?.(value, foreignExchange)}
            />
            <span className="text-xs text-slate-500">↔</span>
            <MiniDropdown
              value={foreignExchange}
              options={foreignOptions}
              onChange={(value) => onExchangeChange?.(domesticExchange, value)}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">지표</span>
            <IndicatorSelector
              value={indicatorValue}
              onChange={updateIndicator}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">
              암호화폐 총{" "}
              <span className="text-[#9BC5FF] font-medium">
                {symbolsCount ?? filteredAndSortedData.length}
              </span>
              개 중{" "}
              <span className="text-[#9BC5FF] font-medium">
                {filteredCount ?? filteredAndSortedData.length}
              </span>
              개 표시 중
            </span>
            <span className="sm:hidden">
              <span className="text-[#9BC5FF] font-medium">
                {visibleCountLabel}
              </span>{" "}
              표시 중
            </span>
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="BTC, 비트코인, 심볼 검색"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4C8DFF]/60 focus:border-[#4C8DFF]"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M9.16667 14.1667C11.4678 14.1667 13.3333 12.3012 13.3333 10C13.3333 7.69881 11.4678 5.83333 9.16667 5.83333C6.86548 5.83333 5 7.69881 5 10C5 12.3012 6.86548 14.1667 9.16667 14.1667Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.1667 14.1667L15.8334 15.8333"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleScrollToTop}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 11L10 6L15 11"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {error ? (
        <div className="mt-4 px-4 py-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-100 text-sm">
          데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : (
        <div
          ref={tableContainerRef}
          className="mt-2 rounded-xl border border-slate-800 bg-[radial-gradient(circle_at_top,#1E2A3C_0,#020617_55%)] overflow-hidden"
        >
          <table className="w-full table-auto md:table-fixed border-separate border-spacing-y-0">
            <colgroup>
              <col className="w-[24px] sm:w-[30px]" />
              <col />
              <col className="w-[90px] sm:w-[120px] md:w-[140px]" />
              <col className="w-[70px] sm:w-[85px] md:w-[90px]" />
              <col className="w-[110px] sm:w-[140px] md:w-[180px]" />
              <col className="hidden md:table-column w-[90px] sm:w-[100px]" />
              <col className="hidden md:table-column w-[90px] sm:w-[100px]" />
              <col className="w-[90px] sm:w-[110px] md:w-[120px]" />
            </colgroup>

            <thead>
              <tr className="bg-slate-900/60 text-[#A7B3C6]/60 text-[11px] md:text-sm leading-tight">
                <th className="w-[26px] sm:w-[30px] min-h-11">
                  <div className="flex items-center justify-center h-[32px]" />
                </th>

                {/* 코인명 */}
                <th
                  className="px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-left whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("symbol")}
                >
                  <div className="flex items-center gap-[2px] sm:gap-[4px]">
                    <span className="inline-block w-[16px] sm:w-[18px] md:w-[20px]" />
                    <span className="inline-block w-[18px] sm:w-[20px] md:w-[22px]" />
                    <span className="whitespace-nowrap">코인명</span>
                    <SortIcon columnKey="symbol" activeSort={sort} />
                  </div>
                </th>

                {/* 현재가 */}
                <th
                  className="w-[90px] sm:w-[120px] md:w-[140px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("koreanPrice")}
                >
                  현재가
                  <SortIcon columnKey="koreanPrice" activeSort={sort} />
                </th>

                {/* 김프 */}
                <th
                  className="w-[70px] sm:w-[85px] md:w-[95px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("premiumRate")}
                >
                  김프
                  <SortIcon columnKey="premiumRate" activeSort={sort} />
                </th>

                {/* 전일대비 */}
                <th
                  className="w-[110px] sm:w-[140px] md:w-[180px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("changeRate")}
                >
                  전일대비
                  <SortIcon columnKey="changeRate" activeSort={sort} />
                </th>

                {/* 고가대비 */}
                <th
                  className="hidden md:table-cell w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("fromHighRate")}
                >
                  고가대비
                  <SortIcon columnKey="fromHighRate" activeSort={sort} />
                </th>

                {/* 저가대비 */}
                <th
                  className="hidden md:table-cell w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("fromLowRate")}
                >
                  저가대비
                  <SortIcon columnKey="fromLowRate" activeSort={sort} />
                </th>

                {/* 거래액 */}
                <th
                  className="w-[90px] sm:w-[110px] md:w-[120px] px-1 sm:px-2 md:px-3 lg:px-4 py-2.5 text-right whitespace-nowrap cursor-pointer hover:text-white transition-colors min-h-11"
                  onClick={() => handleSort("volume24hKrw")}
                >
                  거래액(일)
                  <SortIcon columnKey="volume24hKrw" activeSort={sort} />
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const isActive = activeSymbol === row.symbol;

                const handleRowMouseEnter = () => setHoveredSymbol(row.symbol);
                const handleRowMouseLeave = () => setHoveredSymbol(null);

                return (
                  <tr
                    key={row.symbol}
                    className={`group border-t border-slate-800/60 hover:bg-slate-800/40 cursor-pointer ${
                      isActive ? "bg-slate-800/60" : ""
                    }`}
                    onClick={() => handleRowClick(row)}
                    onMouseEnter={handleRowMouseEnter}
                    onMouseLeave={handleRowMouseLeave}
                  >
                    {/* 즐겨찾기 */}
                    <td className="w-[26px] sm:w-[30px] px-1">
                      <button
                        type="button"
                        className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-800"
                      >
                        <span className="text-slate-500 group-hover:text-yellow-400">
                          ★
                        </span>
                      </button>
                    </td>

                    {/* 코인명 */}
                    <td className="px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSymbolClick(row);
                          }}
                          className="flex items-center gap-1.5 sm:gap-2"
                        >
                          <CoinIcon
                            symbol={row.symbol}
                            iconUrl={row.icon_url ?? undefined}
                            size={20}
                            className="flex-shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-[12px] md:text-[13px] font-medium text-slate-100 truncate max-w-[120px] sm:max-w-[160px]">
                              {row.name_ko ?? row.name_en ?? row.symbol}
                            </span>
                            <span className="text-[10px] md:text-[11px] text-slate-400 uppercase">
                              {row.symbol}
                            </span>
                          </div>
                        </button>
                      </div>
                    </td>

                    {/* 현재가 */}
                    <td className="w-[90px] sm:w-[120px] md:w-[140px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
                      <TwoLinePriceCell
                        topValue={row.koreanPrice}
                        bottomValue={row.foreignPrice}
                        topPrefix="₩"
                        bottomPrefix="$"
                        formatTop={formatKrwDomestic}
                        formatBottom={formatKrwDomestic}
                        isUnlisted={!row.isListed}
                      />
                    </td>

                    {/* 김프 */}
                    <td className="w-[70px] sm:w-[85px] md:w-[90px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
                      <TwoLineCell
                        line1={formatPercent(row.premiumRate)}
                        line2={formatPercent(row.tickerChangeRate24h)}
                        line1Color={getChangeColor(row.premiumRate)}
                        line2Color={getChangeColor(row.tickerChangeRate24h)}
                      />
                    </td>

                    {/* 전일대비 */}
                    <td className="w-[110px] sm:w-[140px] md:w-[180px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
                      <TwoLineCell
                        line1={formatPercent(row.changeRate)}
                        line2={formatKrwDomestic(row.koreanPriceChange24h)}
                        line1Color={getChangeColor(row.changeRate)}
                        line2Color={getChangeColor(row.koreanPriceChange24h)}
                      />
                    </td>

                    {/* 고가대비 */}
                    <td className="hidden md:table-cell w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
                      <TwoLineCell
                        line1={formatPercent(row.fromHighRate)}
                        line2={formatKrwDomestic(row.high24h)}
                        line1Color={getChangeColor(row.fromHighRate)}
                      />
                    </td>

                    {/* 저가대비 */}
                    <td className="hidden md:table-cell w-[90px] sm:w-[100px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap">
                      <TwoLineCell
                        line1={formatPercent(row.fromLowRate)}
                        line2={formatKrwDomestic(row.low24h)}
                        line1Color={getChangeColor(row.fromLowRate)}
                      />
                    </td>

                    {/* 거래액(일) */}
                    <td className="w-[90px] sm:w-[110px] md:w-[120px] px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-3 text-right whitespace-nowrap pr-0">
                      <TwoLineCell
                        line1={formatKrwDomestic(row.volume24hKrw)}
                        line2={formatKrwDomestic(row.volume24hKrw)}
                        line1Color="text-slate-200"
                        line2Color="text-slate-500"
                      />
                    </td>
                  </tr>
                );
              })}

              {visibleRows.length < filteredAndSortedData.length && (
                <tr ref={ref}>
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
