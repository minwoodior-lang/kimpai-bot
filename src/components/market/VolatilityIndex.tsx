import { useState, useEffect } from "react";

interface VolatilityData {
  index: number;
  level: "low" | "medium" | "high" | "extreme";
  description: string;
  avgChange24h: number;
  avgVolatility: number;
  topVolatile: { symbol: string; volatility: number }[];
}

function getLevelColor(level: string): string {
  switch (level) {
    case "low":
      return "text-teal-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-orange-400";
    case "extreme":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

function getLevelLabel(level: string): string {
  switch (level) {
    case "low":
      return "안정";
    case "medium":
      return "보통";
    case "high":
      return "높음";
    case "extreme":
      return "극단적";
    default:
      return "분석중";
  }
}

function getBarColor(index: number): string {
  if (index < 30) return "bg-teal-500";
  if (index < 60) return "bg-yellow-500";
  return "bg-red-500";
}

export default function VolatilityIndex() {
  const [data, setData] = useState<VolatilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market/volatility");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Volatility fetch error:", err);
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
        <div className="h-6 bg-slate-700 rounded w-36 mb-4 animate-pulse"></div>
        <div className="h-16 bg-slate-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      <h2 className="text-sm font-medium text-slate-300 mb-3">
        ⚡ 시장 변동성 지수
      </h2>
      
      <div className="flex items-center justify-between mb-3">
        <div className={`text-3xl font-bold ${getLevelColor(data.level)}`}>
          {data.index}
        </div>
        <div className={`text-sm font-medium px-2 py-1 rounded ${getLevelColor(data.level)} bg-slate-800`}>
          {getLevelLabel(data.level)}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="h-3 bg-slate-800 rounded-lg overflow-hidden flex">
          <div
            className={`h-full ${getBarColor(data.index)} transition-all duration-500`}
            style={{ width: `${data.index}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0</span>
          <span>30</span>
          <span>60</span>
          <span>100</span>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 mb-3">{data.description}</p>
      
      <div className="text-xs text-slate-500 border-t border-slate-800 pt-2">
        <div className="flex justify-between">
          <span>24h 평균 변동률</span>
          <span className="text-slate-300">{data.avgChange24h.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>평균 변동성</span>
          <span className="text-slate-300">{data.avgVolatility.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
