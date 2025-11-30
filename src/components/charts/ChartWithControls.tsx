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

const SYMBOLS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "XRP", label: "Ripple (XRP)" },
  { value: "SOL", label: "Solana (SOL)" },
  { value: "ADA", label: "Cardano (ADA)" },
  { value: "DOGE", label: "Dogecoin (DOGE)" },
  { value: "AVAX", label: "Avalanche (AVAX)" },
];

const EXCHANGES = [
  { value: "UPBIT", label: "Upbit (KRW)" },
  { value: "BINANCE", label: "Binance (USDT)" },
];

interface ChartWithControlsProps {
  defaultSymbol?: string;
  defaultExchange?: "UPBIT" | "BINANCE";
  height?: number;
}

export default function ChartWithControls({
  defaultSymbol = "BTC",
  defaultExchange = "BINANCE",
  height = 400,
}: ChartWithControlsProps) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [exchange, setExchange] = useState<"UPBIT" | "BINANCE">(defaultExchange);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
          >
            {SYMBOLS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value as "UPBIT" | "BINANCE")}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm"
          >
            {EXCHANGES.map((ex) => (
              <option key={ex.value} value={ex.value}>
                {ex.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-slate-400 text-sm">
          1시간 차트 • TradingView
        </div>
      </div>
      <TradingViewChart symbol={symbol} exchange={exchange} height={height} />
    </div>
  );
}
