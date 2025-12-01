import { useState } from "react";
import dynamic from "next/dynamic";

const TradingViewChart = dynamic(() => import("./TradingViewChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-800/50 rounded-xl flex items-center justify-center">
      <div className="text-slate-400">차트 로딩 중...</div>
    </div>
  ),
});

interface ChartPreset {
  id: string;
  label: string;
  tvSymbol: string;
}

const CHART_PRESETS: ChartPreset[] = [
  {
    id: "btc_binance",
    label: "BTC 바이낸스",
    tvSymbol: "BINANCE:BTCUSDT",
  },
  {
    id: "btc_kimp_upbit",
    label: "BTC 김치프리미엄 (업비트)",
    tvSymbol: "UPBIT:BTCKRW/BINANCE:BTCUSDT",
  },
  {
    id: "btc_kimp_bithumb",
    label: "BTC 김치프리미엄 (빗썸)",
    tvSymbol: "BITHUMB:BTCKRW/BINANCE:BTCUSDT",
  },
  {
    id: "btc_coinbase_premium",
    label: "BTC 코인베이스 프리미엄",
    tvSymbol: "COINBASE:BTCUSD/BINANCE:BTCUSDT",
  },
  {
    id: "btc_long",
    label: "BTC 롱 비율",
    tvSymbol: "BINANCE:BTCUSDTPERP*BINANCE:BTCLONGSUSDT/BINANCE:BTCUSDT",
  },
  {
    id: "btc_short",
    label: "BTC 숏 비율",
    tvSymbol: "BINANCE:BTCUSDTPERP*BINANCE:BTCSHORTSUSDT/BINANCE:BTCUSDT",
  },
  {
    id: "btc_dominance",
    label: "BTC 도미넌스",
    tvSymbol: "CRYPTOCAP:BTC.D",
  },
  {
    id: "alt_dominance",
    label: "알트코인 도미넌스",
    tvSymbol: "CRYPTOCAP:OTHERS.D",
  },
  {
    id: "total3",
    label: "TOTAL3 (알트 시총)",
    tvSymbol: "CRYPTOCAP:TOTAL3",
  },
];

interface ChartWithControlsProps {
  height?: number;
}

export default function ChartWithControls({
  height = 400,
}: ChartWithControlsProps) {
  const [chartPreset, setChartPreset] = useState<ChartPreset>(CHART_PRESETS[0]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <select
          value={chartPreset.id}
          onChange={(e) => {
            const preset = CHART_PRESETS.find((p) => p.id === e.target.value);
            if (preset) {
              setChartPreset(preset);
            }
          }}
          className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm min-w-[200px]"
        >
          {CHART_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <span className="text-slate-500 text-xs hidden sm:inline">TradingView</span>
      </div>
      <TradingViewChart tvSymbol={chartPreset.tvSymbol} height={height} />
    </div>
  );
}
