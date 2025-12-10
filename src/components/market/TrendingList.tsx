import { useState, useEffect } from "react";

interface TrendingCoin {
  rank: number;
  symbol: string;
  name: string;
  priceKrw: number;
  priceUsd: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24hKrw: number;
  marketCap: number;
  premium: number;
}

type FilterType = "top50" | "marketcap" | "volume" | "gainers" | "losers" | "new";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "top50", label: "인기 TOP50" },
  { key: "marketcap", label: "시총 TOP100" },
  { key: "volume", label: "거래대금 TOP100" },
  { key: "gainers", label: "급등" },
  { key: "losers", label: "급락" },
  { key: "new", label: "신규상장" },
];

function formatKrw(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(1) + "조";
  if (value >= 1e8) return (value / 1e8).toFixed(0) + "억";
  if (value >= 1e4) return (value / 1e4).toFixed(0) + "만";
  return value.toLocaleString();
}

function formatPrice(price: number): string {
  if (price >= 1e6) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return price.toFixed(4);
}

export default function TrendingList() {
  const [data, setData] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("top50");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/trending?filter=${filter}&limit=50`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Trending fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [filter]);

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-300">
          🔥 트렌드 랭킹
        </h2>
        
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                filter === f.key
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">코인</th>
                <th className="text-right py-2 px-2">가격 (KRW)</th>
                <th className="text-right py-2 px-2">1h</th>
                <th className="text-right py-2 px-2">24h</th>
                <th className="text-right py-2 px-2">7d</th>
                <th className="text-right py-2 px-2">거래대금</th>
                <th className="text-right py-2 px-2">김프</th>
              </tr>
            </thead>
            <tbody>
              {data.map((coin) => (
                <tr
                  key={coin.symbol}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2 px-2 text-slate-500">{coin.rank}</td>
                  <td className="py-2 px-2">
                    <div className="font-medium text-white">{coin.symbol}</div>
                    <div className="text-slate-500 truncate max-w-[120px]">{coin.name}</div>
                  </td>
                  <td className="py-2 px-2 text-right text-white font-medium">
                    ₩{formatPrice(coin.priceKrw)}
                  </td>
                  <td className={`py-2 px-2 text-right ${coin.change1h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {coin.change1h >= 0 ? "+" : ""}{coin.change1h.toFixed(1)}%
                  </td>
                  <td className={`py-2 px-2 text-right ${coin.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                  </td>
                  <td className={`py-2 px-2 text-right ${coin.change7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {coin.change7d >= 0 ? "+" : ""}{coin.change7d.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400">
                    {formatKrw(coin.volume24hKrw)}
                  </td>
                  <td className={`py-2 px-2 text-right ${coin.premium >= 0 ? "text-red-400" : "text-blue-400"}`}>
                    {coin.premium >= 0 ? "+" : ""}{coin.premium.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
