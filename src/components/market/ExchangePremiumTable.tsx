import { useState, useEffect } from "react";

interface ExchangeSummary {
  exchange: string;
  avgPremium: number;
  maxPremium: { symbol: string; value: number };
  minPremium: { symbol: string; value: number };
  coinCount: number;
}

const EXCHANGE_LABELS: Record<string, string> = {
  UPBIT: "업비트",
  BITHUMB: "빗썸",
  COINONE: "코인원",
};

function getPremiumColorClass(value: number): string {
  if (value > 0) return "text-red-400";
  if (value < 0) return "text-blue-400";
  return "text-slate-400";
}

export default function ExchangePremiumTable() {
  const [data, setData] = useState<ExchangeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market/exchange-premium");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Exchange premium fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
        <div className="h-6 bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-3">
        🏛️ 거래소별 김프 요약
      </h2>
      
      <div className="space-y-3">
        {data.map((exchange) => (
          <div
            key={exchange.exchange}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-white text-sm">
                {EXCHANGE_LABELS[exchange.exchange] || exchange.exchange}
              </span>
              <span className="text-xs text-slate-500">
                ({exchange.coinCount}개)
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className="text-slate-500">평균</div>
                <div className={`font-medium ${getPremiumColorClass(exchange.avgPremium)}`}>
                  {exchange.avgPremium > 0 ? "+" : ""}{exchange.avgPremium.toFixed(2)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-slate-500">최대</div>
                <div className="text-red-400 font-medium">
                  +{exchange.maxPremium.value.toFixed(1)}%
                  <span className="text-slate-500 ml-1">({exchange.maxPremium.symbol})</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-slate-500">최소</div>
                <div className="text-blue-400 font-medium">
                  {exchange.minPremium.value.toFixed(1)}%
                  <span className="text-slate-500 ml-1">({exchange.minPremium.symbol})</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
