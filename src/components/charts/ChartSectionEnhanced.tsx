import { useEffect, useRef, useState } from "react";

// 전체 지표 매핑 (KIMPGA 스타일)
const SYMBOL_MAP: Record<string, string> = {
  // A. BTC / Premium Indicators
  "BINANCE_BTC": "BINANCE:BTCUSDT",
  "UPBIT_BTC_KRW_PREMIUM": "KRW_BTC_PREMIUM",
  "BITHUMB_BTC_KRW_PREMIUM": "KRW_BTC_BITHUMB_PREMIUM",
  "COINBASE_BTC_PREMIUM": "BTC_COINBASE_PREMIUM",
  "BTC_LONGS": "BTC_LONGS",
  "BTC_SHORTS": "BTC_SHORTS",
  "BTC_DOMINANCE": "CRYPTOCAP:BTC.D",

  // B. Market Index
  "TOTAL_MARKET_CAP": "CRYPTOCAP:TOTAL",
  "TOTAL2_INDEX": "CRYPTOCAP:TOTAL2",
  "TOTAL3_INDEX": "CRYPTOCAP:TOTAL3",

  // C. Extended Indicators
  "ALT_DOMINANCE": "CRYPTOCAP:ALTCAP.D",
  "KOREA_PREMIUM_INDEX": "KRW_KOREA_PREMIUM_INDEX",
};

const INDICATOR_GROUPS = {
  "BTC / Premium": [
    { id: "BINANCE_BTC", label: "BTC Binance" },
    { id: "UPBIT_BTC_KRW_PREMIUM", label: "BTC 김치프리미엄 (Upbit)" },
    { id: "BITHUMB_BTC_KRW_PREMIUM", label: "BTC 김치프리미엄 (Bithumb)" },
    { id: "COINBASE_BTC_PREMIUM", label: "BTC Coinbase Premium" },
    { id: "BTC_LONGS", label: "BTC Longs" },
    { id: "BTC_SHORTS", label: "BTC Shorts" },
    { id: "BTC_DOMINANCE", label: "BTC Dominance" },
  ],
  "Market Index": [
    { id: "TOTAL_MARKET_CAP", label: "TOTAL Market Cap" },
    { id: "TOTAL2_INDEX", label: "TOTAL2" },
    { id: "TOTAL3_INDEX", label: "TOTAL3" },
  ],
  "Extended Indicators": [
    { id: "ALT_DOMINANCE", label: "ALT Dominance" },
    { id: "KOREA_PREMIUM_INDEX", label: "Korea Premium Index" },
  ],
};

interface ChartSectionEnhancedProps {
  selectedIndicator?: string;
  onIndicatorChange?: (indicator: string) => void;
}

/**
 * P-1 향상된 차트 섹션 (KIMPGA 스타일 드롭다운)
 * - 그룹별 지표 선택 가능
 * - TradingView 심볼 자동 연동
 */
export default function ChartSectionEnhanced({
  selectedIndicator = "BINANCE_BTC",
  onIndicatorChange,
}: ChartSectionEnhancedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentLabel = Object.entries(INDICATOR_GROUPS)
    .flatMap(([, items]) => items)
    .find((item) => item.id === selectedIndicator)?.label || "BTC Binance";

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    containerRef.current.innerHTML = "";

    const symbol = SYMBOL_MAP[selectedIndicator] ?? "BINANCE:BTCUSDT";

    try {
      // @ts-ignore
      const TV = (window as any).TradingView;
      if (TV && TV.widget) {
        new TV.widget({
          width: "100%",
          height: 360,
          symbol,
          interval: "60",
          timezone: "Asia/Seoul",
          theme: "dark",
          style: "1",
          locale: "kr",
          toolbar_bg: "#020617",
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          container_id: "kimpai-main-chart",
        });
      }
    } catch (error) {
      console.error("[ChartSectionEnhanced] Error:", error);
    }
  }, [selectedIndicator, isLoaded]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSelect = (indicatorId: string) => {
    onIndicatorChange?.(indicatorId);
    setIsDropdownOpen(false);
  };

  return (
    <section className="mb-6 space-y-3">
      {/* 섹션 헤더 라벨 */}
      <div className="text-sm font-semibold dark:text-slate-100 light:text-slate-900">
        BTC / 김프 차트
      </div>

      {/* 드롭다운 */}
      <div className="relative w-fit">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm hover:border-slate-600 transition-colors"
        >
          <span>{currentLabel}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-y-auto max-h-[400px]">
            {Object.entries(INDICATOR_GROUPS).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="sticky top-0 px-4 py-2.5 bg-slate-900/80 backdrop-blur text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
                  {groupName}
                </div>
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      selectedIndicator === item.id
                        ? "bg-blue-500/25 text-blue-300 border-l-2 border-blue-400"
                        : "hover:bg-slate-700/40 text-slate-300 border-l-2 border-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 차트 박스 */}
      <div className="w-full rounded-2xl dark:border dark:border-slate-700/60 light:border light:border-slate-300/40 dark:bg-slate-900/20 light:bg-slate-100/20 p-4 overflow-hidden">
        <div
          id="kimpai-main-chart"
          ref={containerRef}
          className="w-full h-[220px] sm:h-[260px] lg:h-[320px] rounded-lg overflow-hidden"
        >
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            차트 로딩 중...
          </div>
        </div>
      </div>
    </section>
  );
}
