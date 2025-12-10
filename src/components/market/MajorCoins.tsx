import { useState, useEffect } from "react";

interface MajorCoin {
  symbol: string;
  name: string;
  price: number;
  priceKrw: number;
  change24h: number;
  marketCap: number;
  marketCapChange: number;
  rank: number;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(1) + "T";
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  return value.toLocaleString();
}

function formatMarketCapChange(value: number): string {
  const absValue = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (absValue >= 1e9) return `${sign}$${(absValue / 1e9).toFixed(1)}B`;
  if (absValue >= 1e6) return `${sign}$${(absValue / 1e6).toFixed(1)}M`;
  return `${sign}$${absValue.toLocaleString()}`;
}

export default function MajorCoins() {
  const [data, setData] = useState<MajorCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market/majors");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Majors fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
        <div className="h-6 bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-3">
        💎 메이저 코인 시총 변화
      </h2>
      
      <div className="grid grid-cols-2 gap-2">
        {data.map((coin) => (
          <div
            key={coin.symbol}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">#{coin.rank}</span>
              <span className="font-medium text-white text-sm">{coin.symbol}</span>
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${coin.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
              </div>
              <div className={`text-xs ${coin.marketCapChange >= 0 ? "text-green-500/70" : "text-red-500/70"}`}>
                {formatMarketCapChange(coin.marketCapChange)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
