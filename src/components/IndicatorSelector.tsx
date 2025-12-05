import { useState } from "react";

export const SYMBOL_MAP: Record<string, string> = {
  "BINANCE_BTCUSDT": "BINANCE:BTCUSDT",
  "UPBIT_BTC_KRW": "UPBIT:BTCKRW",
  "BITHUMB_BTC_KRW": "BITHUMB:BTCKRW",
  "COINBASE_BTC_USD": "COINBASE:BTCUSD",
  "BTC_LONGS": "BITFINEX:BTCUSDLONGS",
  "BTC_SHORTS": "BITFINEX:BTCUSDSHORTS",
  "BTC_DOMINANCE": "CRYPTOCAP:BTC.D",
  "TOTAL_MARKET_CAP": "CRYPTOCAP:TOTAL",
  "TOTAL2_INDEX": "CRYPTOCAP:TOTAL2",
  "TOTAL3_INDEX": "CRYPTOCAP:TOTAL3",
};

const INDICATOR_GROUPS = {
  "BTC / PREMIUM": [
    { id: "BINANCE_BTCUSDT", label: "Binance BTC USDT" },
    { id: "UPBIT_BTC_KRW", label: "Upbit BTC KRW" },
    { id: "BITHUMB_BTC_KRW", label: "Bithumb BTC KRW" },
    { id: "COINBASE_BTC_USD", label: "Coinbase BTC USD" },
    { id: "BTC_LONGS", label: "BTC Longs" },
    { id: "BTC_SHORTS", label: "BTC Shorts" },
    { id: "BTC_DOMINANCE", label: "BTC Dominance" },
  ],
  "MARKET INDEX": [
    { id: "TOTAL_MARKET_CAP", label: "TOTAL Market Cap" },
    { id: "TOTAL2_INDEX", label: "TOTAL2" },
    { id: "TOTAL3_INDEX", label: "TOTAL3" },
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
    .find((item) => item.id === selectedIndicator)?.label || "Binance BTC USDT";

  const handleSelect = (indicatorId: string) => {
    onIndicatorChange(indicatorId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="inline-flex items-center h-9 rounded-md bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-100 hover:bg-slate-700 transition"
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
        <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[100] overflow-y-auto max-h-[400px]">
          {Object.entries(INDICATOR_GROUPS).map(([groupName, items]) => (
            <div key={groupName}>
              <div className="sticky top-0 px-4 py-2.5 bg-slate-900/90 backdrop-blur text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700">
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
  );
}
