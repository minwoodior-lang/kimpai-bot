import { useState } from "react";
import dynamic from "next/dynamic";
import ExchangeSelector from "@/components/ExchangeSelector";
import { useExchangeSelection } from "@/contexts/ExchangeSelectionContext";

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

interface ChartWithControlsProps {
  defaultSymbol?: string;
  height?: number;
  showDualChart?: boolean;
}

export default function ChartWithControls({
  defaultSymbol = "BTC",
  height = 400,
  showDualChart = false,
}: ChartWithControlsProps) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const { getTradingViewDomesticSymbol, getTradingViewForeignSymbol, getDomesticExchangeInfo, getForeignExchangeInfo } = useExchangeSelection();

  const domesticInfo = getDomesticExchangeInfo();
  const foreignInfo = getForeignExchangeInfo();

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-700/50 gap-3">
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
          <ExchangeSelector compact showLabels={false} />
        </div>
        <div className="text-slate-400 text-sm">
          1시간 차트 • TradingView
        </div>
      </div>
      
      {showDualChart ? (
        <div className="grid md:grid-cols-2 gap-0">
          <div className="border-r border-slate-700/50">
            <div className="px-4 py-2 bg-slate-700/30 text-sm text-slate-300">
              {domesticInfo.exchange} {symbol}/{domesticInfo.quote}
            </div>
            <TradingViewChart 
              tvSymbol={getTradingViewDomesticSymbol(symbol)} 
              height={height} 
            />
          </div>
          <div>
            <div className="px-4 py-2 bg-slate-700/30 text-sm text-slate-300">
              {foreignInfo.exchange === "BINANCE_FUTURES" ? "Binance Futures" : foreignInfo.exchange} {symbol}/{foreignInfo.quote}
            </div>
            <TradingViewChart 
              tvSymbol={getTradingViewForeignSymbol(symbol)} 
              height={height} 
            />
          </div>
        </div>
      ) : (
        <TradingViewChart 
          tvSymbol={getTradingViewForeignSymbol(symbol)} 
          height={height} 
        />
      )}
    </div>
  );
}
