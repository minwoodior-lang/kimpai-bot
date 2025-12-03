import { useState } from "react";
import dynamic from "next/dynamic";

const TradingViewChart = dynamic(() => import("./TradingViewChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-800/50 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

const KoreaPremiumChart = dynamic(() => import("./KoreaPremiumChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-800/50 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface ChartPreset {
  id: string;
  label: string;
  tvSymbol: string;
  isCustom?: boolean;
}

const CHART_PRESETS: ChartPreset[] = [
  {
    id: "btc_binance",
    label: "BTC Binance",
    tvSymbol: "BINANCE:BTCUSDT",
  },
  {
    id: "btc_kimp_upbit",
    label: "BTC 김치프리미엄 (Upbit)",
    tvSymbol: "UPBIT:BTCKRW/BINANCE:BTCUSDT",
  },
  {
    id: "btc_kimp_bithumb",
    label: "BTC 김치프리미엄 (Bithumb)",
    tvSymbol: "BITHUMB:BTCKRW/BINANCE:BTCUSDT",
  },
  {
    id: "btc_coinbase_premium",
    label: "BTC Coinbase Premium",
    tvSymbol: "COINBASE:BTCUSD/BINANCE:BTCUSDT",
  },
  {
    id: "btc_longs",
    label: "BTC Longs",
    tvSymbol: "BITFINEX:BTCUSDLONGS",
  },
  {
    id: "btc_shorts",
    label: "BTC Shorts",
    tvSymbol: "BITFINEX:BTCUSDSHORTS",
  },
  {
    id: "btc_dominance",
    label: "BTC Dominance",
    tvSymbol: "CRYPTOCAP:BTC.D",
  },
  {
    id: "total_marketcap",
    label: "TOTAL Market Cap",
    tvSymbol: "CRYPTOCAP:TOTAL",
  },
  {
    id: "total2_marketcap",
    label: "TOTAL2 (Ex-BTC)",
    tvSymbol: "CRYPTOCAP:TOTAL2",
  },
  {
    id: "total3_marketcap",
    label: "TOTAL3 (Ex-BTC & ETH)",
    tvSymbol: "CRYPTOCAP:TOTAL3",
  },
  {
    id: "alt_dominance",
    label: "ALT Dominance",
    tvSymbol: "CRYPTOCAP:OTHERS.D",
  },
  {
    id: "korea_premium_index",
    label: "Korea Premium Index",
    tvSymbol: "",
    isCustom: true,
  },
];

interface TimeframeOption {
  id: string;
  label: string;
  interval: string;
}

const TIMEFRAMES: TimeframeOption[] = [
  { id: "1m", label: "1분", interval: "1" },
  { id: "3m", label: "3분", interval: "3" },
  { id: "5m", label: "5분", interval: "5" },
  { id: "15m", label: "15분", interval: "15" },
  { id: "30m", label: "30분", interval: "30" },
  { id: "45m", label: "45분", interval: "45" },
  { id: "1h", label: "1시간", interval: "60" },
  { id: "2h", label: "2시간", interval: "120" },
  { id: "3h", label: "3시간", interval: "180" },
  { id: "4h", label: "4시간", interval: "240" },
  { id: "1d", label: "1일", interval: "D" },
  { id: "1w", label: "1주", interval: "W" },
  { id: "1M", label: "1월", interval: "M" },
];

interface ChartWithControlsProps {
  height?: number;
}

export default function ChartWithControls({
  height = 400,
}: ChartWithControlsProps) {
  const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';
  const defaultPreset = isHomePage ? CHART_PRESETS[0] : CHART_PRESETS[0];
  const [chartPreset, setChartPreset] = useState<ChartPreset>(defaultPreset);
  const [timeframe, setTimeframe] = useState<TimeframeOption>(TIMEFRAMES[6]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={chartPreset.id}
            onChange={(e) => {
              const preset = CHART_PRESETS.find((p) => p.id === e.target.value);
              if (preset) {
                setChartPreset(preset);
              }
            }}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm min-w-[180px]"
          >
            <optgroup label="BTC / 프리미엄 지표">
              {CHART_PRESETS.slice(0, 7).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="시장 전체 지표 (Market Index)">
              {CHART_PRESETS.slice(7, 10).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="추가 분석 지표 (Extended Indicators)">
              {CHART_PRESETS.slice(10).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </optgroup>
          </select>

          {!chartPreset.isCustom && (
            <select
              value={timeframe.id}
              onChange={(e) => {
                const tf = TIMEFRAMES.find((t) => t.id === e.target.value);
                if (tf) {
                  setTimeframe(tf);
                }
              }}
              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm min-w-[80px]"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf.id} value={tf.id}>
                  {tf.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <span className="text-slate-500 text-xs hidden sm:inline">
          {chartPreset.isCustom ? "KimpAI" : "TradingView"}
        </span>
      </div>
      {chartPreset.isCustom ? (
        <KoreaPremiumChart height={height} />
      ) : (
        <TradingViewChart 
          tvSymbol={chartPreset.tvSymbol} 
          interval={timeframe.interval}
          height={height} 
        />
      )}
    </div>
  );
}
