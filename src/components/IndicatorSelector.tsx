import { useState } from "react";

const SYMBOL_MAP: Record<string, string> = {
  "BINANCE_BTC": "BINANCE:BTCUSDT",
  "UPBIT_BTC_KRW_PREMIUM": "KRW_BTC_PREMIUM",
  "BITHUMB_BTC_KRW_PREMIUM": "KRW_BTC_BITHUMB_PREMIUM",
  "COINBASE_BTC_PREMIUM": "BTC_COINBASE_PREMIUM",
  "BTC_LONGS": "BTC_LONGS",
  "BTC_SHORTS": "BTC_SHORTS",
  "BTC_DOMINANCE": "CRYPTOCAP:BTC.D",
  "TOTAL_MARKET_CAP": "CRYPTOCAP:TOTAL",
  "TOTAL2_INDEX": "CRYPTOCAP:TOTAL2",
  "TOTAL3_INDEX": "CRYPTOCAP:TOTAL3",
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

interface IndicatorSelectorProps {
  selectedIndicator: string;
  onIndicatorChange: (indicator: string) => void;
}

export default function IndicatorSelector({
  selectedIndicator,
  onIndicatorChange,
}: IndicatorSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentLabel = Object.entries(INDICATOR_GROUPS)
    .flatMap(([, items]) => items)
    .find((item) => item.id === selectedIndicator)?.label || "BTC Binance";

  const handleSelect = (indicatorId: string) => {
    onIndicatorChange(indicatorId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="inline-flex items-center rounded-md dark:bg-slate-800 light:bg-slate-200 dark:border dark:border-slate-700 light:border light:border-slate-300 px-3 py-2 text-sm dark:text-white light:text-slate-900 hover:dark:border-slate-600 hover:light:border-slate-400 transition-colors"
      >
        <span>{currentLabel}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
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

      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 dark:bg-slate-800 light:bg-white dark:border dark:border-slate-700 light:border light:border-slate-300 rounded-lg shadow-2xl z-50 overflow-y-auto max-h-[400px]">
          {Object.entries(INDICATOR_GROUPS).map(([groupName, items]) => (
            <div key={groupName}>
              <div className="sticky top-0 px-4 py-2.5 dark:bg-slate-900/80 light:bg-slate-100/80 backdrop-blur dark:text-slate-300 light:text-slate-700 text-xs font-bold uppercase tracking-wider dark:border-b dark:border-slate-700 light:border-b light:border-slate-300">
                {groupName}
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedIndicator === item.id
                      ? "dark:bg-blue-500/25 dark:text-blue-300 dark:border-l-2 dark:border-blue-400 light:bg-blue-100 light:text-blue-700 light:border-l-2 light:border-blue-400"
                      : "dark:hover:bg-slate-700/40 dark:text-slate-300 dark:border-l-2 dark:border-transparent light:hover:bg-slate-100 light:text-slate-700 light:border-l-2 light:border-transparent"
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
  );
}
