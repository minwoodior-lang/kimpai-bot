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
  description?: string;
}

const CHART_PRESETS: ChartPreset[] = [
  {
    id: "btc_kimp",
    label: "BTC 김프 (업비트 vs 바이낸스)",
    tvSymbol: "UPBIT:BTCKRW/BINANCE:BTCUSDT",
    description: "BTC 김치 프리미엄 차트",
  },
  {
    id: "btc_upbit",
    label: "BTC 업비트 현물",
    tvSymbol: "UPBIT:BTCKRW",
    description: "업비트 BTC/KRW",
  },
  {
    id: "btc_binance",
    label: "BTC 바이낸스 현물",
    tvSymbol: "BINANCE:BTCUSDT",
    description: "바이낸스 BTC/USDT",
  },
  {
    id: "eth_kimp",
    label: "ETH 김프 (업비트 vs 바이낸스)",
    tvSymbol: "UPBIT:ETHKRW/BINANCE:ETHUSDT",
    description: "ETH 김치 프리미엄 차트",
  },
  {
    id: "eth_upbit",
    label: "ETH 업비트 현물",
    tvSymbol: "UPBIT:ETHKRW",
    description: "업비트 ETH/KRW",
  },
  {
    id: "eth_binance",
    label: "ETH 바이낸스 현물",
    tvSymbol: "BINANCE:ETHUSDT",
    description: "바이낸스 ETH/USDT",
  },
  {
    id: "xrp_kimp",
    label: "XRP 김프 (업비트 vs 바이낸스)",
    tvSymbol: "UPBIT:XRPKRW/BINANCE:XRPUSDT",
    description: "XRP 김치 프리미엄 차트",
  },
  {
    id: "sol_kimp",
    label: "SOL 김프 (업비트 vs 바이낸스)",
    tvSymbol: "UPBIT:SOLKRW/BINANCE:SOLUSDT",
    description: "SOL 김치 프리미엄 차트",
  },
];

interface ChartWithControlsProps {
  defaultSymbol?: string;
  height?: number;
  showDualChart?: boolean;
}

export default function ChartWithControls({
  height = 400,
  showDualChart = false,
}: ChartWithControlsProps) {
  const [chartPreset, setChartPreset] = useState<ChartPreset>(CHART_PRESETS[0]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-700/50 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm whitespace-nowrap">차트 프리셋</label>
            <select
              value={chartPreset.id}
              onChange={(e) => {
                const preset = CHART_PRESETS.find((p) => p.id === e.target.value);
                if (preset) {
                  setChartPreset(preset);
                }
              }}
              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm min-w-[220px]"
            >
              {CHART_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span className="hidden sm:inline">{chartPreset.description}</span>
          <span className="text-slate-500">• TradingView</span>
        </div>
      </div>

      {showDualChart ? (
        <div className="grid md:grid-cols-2 gap-0">
          <div className="border-r border-slate-700/50">
            <div className="px-4 py-2 bg-slate-700/30 text-sm text-slate-300">
              국내 차트
            </div>
            <TradingViewChart
              tvSymbol={chartPreset.tvSymbol.split("/")[0] || chartPreset.tvSymbol}
              height={height}
            />
          </div>
          <div>
            <div className="px-4 py-2 bg-slate-700/30 text-sm text-slate-300">
              해외 차트
            </div>
            <TradingViewChart
              tvSymbol={chartPreset.tvSymbol.split("/")[1] || chartPreset.tvSymbol}
              height={height}
            />
          </div>
        </div>
      ) : (
        <TradingViewChart tvSymbol={chartPreset.tvSymbol} height={height} />
      )}
    </div>
  );
}
