import { useState, useEffect } from "react";

interface LongShortRatio {
  symbol: string;
  longRatio: number;
  shortRatio: number;
  price: number;
  volume24h: number;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return (vol / 1e9).toFixed(1) + "B";
  if (vol >= 1e6) return (vol / 1e6).toFixed(1) + "M";
  return vol.toLocaleString();
}

export default function LongShortChart() {
  const [data, setData] = useState<LongShortRatio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market/futures-long-short");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Long/Short fetch error:", err);
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
        <div className="h-6 bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
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
        📊 롱 vs 숏 포지션 비율 (Binance Futures 기준)
      </h2>
      
      <div className="space-y-2">
        {data.slice(0, 15).map((item) => (
          <div
            key={item.symbol}
            className="flex items-center gap-3 py-1.5"
          >
            <div className="w-20 flex-shrink-0">
              <div className="font-medium text-white text-sm">{item.symbol}</div>
              <div className="text-xs text-slate-500">${formatPrice(item.price)}</div>
            </div>
            
            <div className="flex-1 flex items-center gap-1">
              <div
                className="h-2.5 bg-teal-500 rounded-l-lg transition-all"
                style={{ width: `${item.longRatio}%` }}
              ></div>
              <div
                className="h-2.5 bg-red-500 rounded-r-lg transition-all"
                style={{ width: `${item.shortRatio}%` }}
              ></div>
            </div>
            
            <div className="w-32 flex-shrink-0 text-right">
              <span className="text-xs text-teal-400">{item.longRatio.toFixed(1)}%</span>
              <span className="text-xs text-slate-600 mx-1">/</span>
              <span className="text-xs text-red-400">{item.shortRatio.toFixed(1)}%</span>
            </div>
            
            <div className="w-20 flex-shrink-0 text-right">
              <span className="text-xs text-slate-500">${formatVolume(item.volume24h)}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-teal-500 rounded"></div>
          <span className="text-xs text-slate-400">롱 (Long)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-xs text-slate-400">숏 (Short)</span>
        </div>
      </div>
    </div>
  );
}
