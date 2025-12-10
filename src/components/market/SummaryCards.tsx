import { useState, useEffect } from "react";

interface SummaryData {
  avgPremium: number;
  minPremium: { value: number; symbol: string };
  maxPremium: { value: number; symbol: string };
  btcDominance: number;
  btcDominanceChange: number;
  globalVolumeUsd: number;
  globalVolumeChange24h: number;
  domesticVolumeKrw: number;
  usdKrw: number;
  usdtPremium: number;
  topGainers: { symbol: string; change: number }[];
  topLosers: { symbol: string; change: number }[];
}

function formatNumber(num: number, suffix: string = ""): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + "조" + suffix;
  if (num >= 1e8) return (num / 1e8).toFixed(1) + "억" + suffix;
  if (num >= 1e4) return (num / 1e4).toFixed(1) + "만" + suffix;
  return num.toLocaleString() + suffix;
}

function formatUsd(num: number): string {
  if (num >= 1e9) return "$" + (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return "$" + (num / 1e6).toFixed(1) + "M";
  return "$" + num.toLocaleString();
}

export default function SummaryCards() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market/summary");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Summary fetch error:", err);
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
            <div className="h-6 bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      icon: "🇰🇷",
      label: "평균 김프",
      value: `${data.avgPremium > 0 ? "+" : ""}${data.avgPremium.toFixed(2)}%`,
      sub: `최소 ${data.minPremium.value.toFixed(1)}% / 최대 ${data.maxPremium.value.toFixed(1)}%`,
      color: data.avgPremium > 0 ? "text-red-400" : "text-blue-400",
    },
    {
      icon: "🟧",
      label: "BTC 도미넌스",
      value: `${data.btcDominance.toFixed(1)}%`,
      sub: `${data.btcDominanceChange > 0 ? "+" : ""}${data.btcDominanceChange.toFixed(1)}%`,
      color: "text-orange-400",
    },
    {
      icon: "🌍",
      label: "글로벌 24h 거래액",
      value: formatUsd(data.globalVolumeUsd),
      sub: `${data.globalVolumeChange24h > 0 ? "+" : ""}${data.globalVolumeChange24h.toFixed(1)}%`,
      color: "text-emerald-400",
    },
    {
      icon: "🇰🇷",
      label: "국내 24h 거래액",
      value: formatNumber(data.domesticVolumeKrw, "원"),
      sub: "업비트+빗썸+코인원",
      color: "text-sky-400",
    },
    {
      icon: "💱",
      label: "환율 & USDT",
      value: `₩${data.usdKrw.toLocaleString()}`,
      sub: `USDT ${data.usdtPremium > 0 ? "+" : ""}${data.usdtPremium.toFixed(2)}%`,
      color: "text-purple-400",
    },
    {
      icon: "📈",
      label: "상승률 TOP3",
      value: data.topGainers[0]?.symbol || "N/A",
      sub: data.topGainers
        .slice(0, 3)
        .map((g) => `${g.symbol} +${g.change.toFixed(1)}%`)
        .join(", "),
      color: "text-green-400",
    },
    {
      icon: "📉",
      label: "하락률 TOP3",
      value: data.topLosers[0]?.symbol || "N/A",
      sub: data.topLosers
        .slice(0, 3)
        .map((l) => `${l.symbol} ${l.change.toFixed(1)}%`)
        .join(", "),
      color: "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 flex flex-col gap-1 hover:border-slate-700 transition-colors"
        >
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>{card.icon}</span>
            <span>{card.label}</span>
          </div>
          <div className={`text-lg font-semibold ${card.color}`}>
            {card.value}
          </div>
          <div className="text-xs text-slate-500 truncate">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
