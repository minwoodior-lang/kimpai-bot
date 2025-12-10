import { useState, useEffect } from "react";

interface HeatmapRow {
  symbol: string;
  UPBIT_KRW: number | null;
  BITHUMB_KRW: number | null;
  COINONE_KRW: number | null;
  BINANCE_USDT: number | null;
  OKX_USDT: number | null;
  BYBIT_USDT: number | null;
}

function getPremiumColor(premium: number | null): string {
  if (premium === null) return "bg-slate-800 text-slate-500";
  if (premium > 3) return "bg-red-900/60 text-red-300";
  if (premium > 1) return "bg-red-900/40 text-red-400";
  if (premium > 0) return "bg-red-900/20 text-red-400";
  if (premium > -1) return "bg-blue-900/20 text-blue-400";
  if (premium > -3) return "bg-blue-900/40 text-blue-400";
  return "bg-blue-900/60 text-blue-300";
}

function formatPremium(premium: number | null): string {
  if (premium === null) return "-";
  return `${premium > 0 ? "+" : ""}${premium.toFixed(2)}%`;
}

const EXCHANGE_LABELS: Record<string, string> = {
  UPBIT_KRW: "업비트",
  BITHUMB_KRW: "빗썸",
  COINONE_KRW: "코인원",
  BINANCE_USDT: "바이낸스",
  OKX_USDT: "OKX",
  BYBIT_USDT: "Bybit",
};

export default function PremiumHeatmap() {
  const [data, setData] = useState<HeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market/premium-heatmap");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Heatmap fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayData = showAll ? data : data.slice(0, 10);
  const exchanges = ["UPBIT_KRW", "BITHUMB_KRW", "COINONE_KRW", "BINANCE_USDT", "OKX_USDT", "BYBIT_USDT"];

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
        <div className="h-6 bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-3">
        🔥 거래소별 김프 히트맵
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 px-1 text-slate-400 font-medium">코인</th>
              {exchanges.map((ex) => (
                <th key={ex} className="text-center py-2 px-1 text-slate-400 font-medium">
                  {EXCHANGE_LABELS[ex]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row) => (
              <tr key={row.symbol} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-1.5 px-1 font-medium text-white">{row.symbol}</td>
                {exchanges.map((ex) => {
                  const value = row[ex as keyof HeatmapRow] as number | null;
                  return (
                    <td key={ex} className="py-1.5 px-1 text-center">
                      <span className={`inline-block rounded-md px-2 py-0.5 font-medium ${getPremiumColor(value)}`}>
                        {formatPremium(value)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full py-2 text-xs text-slate-400 hover:text-white transition-colors border-t border-slate-800"
        >
          {showAll ? "접기 ▲" : `전체보기 (${data.length}개) ▼`}
        </button>
      )}
    </div>
  );
}
