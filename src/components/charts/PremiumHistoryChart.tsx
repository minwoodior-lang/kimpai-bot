import { useEffect, useState } from "react";

interface PremiumDataPoint {
  time: string;
  premium: number;
}

interface PremiumHistoryChartProps {
  symbol: string;
  hours?: number;
  height?: number;
}

export default function PremiumHistoryChart({ symbol, hours = 24, height }: PremiumHistoryChartProps) {
  const [data, setData] = useState<PremiumDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/premium/history?symbol=${symbol}&hours=${hours}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch premium history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [symbol, hours]);

  if (loading) {
    return (
      <div className="h-32 bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-slate-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-32 bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-slate-400 text-sm">데이터 없음</div>
      </div>
    );
  }

  const premiums = data.map((d) => d.premium);
  const minPremium = Math.min(...premiums);
  const maxPremium = Math.max(...premiums);
  const range = maxPremium - minPremium || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.premium - minPremium) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  const currentPremium = data[data.length - 1]?.premium || 0;
  const startPremium = data[0]?.premium || 0;
  const change = currentPremium - startPremium;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">{symbol} 김프 추이 (24h)</h4>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">현재: <span className={currentPremium > 0 ? "text-green-400" : "text-red-400"}>{currentPremium.toFixed(2)}%</span></span>
          <span className={`${change >= 0 ? "text-green-400" : "text-red-400"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
      </div>
      <svg viewBox="0 0 100 100" className="w-full" style={{ height: height ? `${height}px` : '6rem' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={currentPremium > 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={currentPremium > 0 ? "#22c55e" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${symbol})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={currentPremium > 0 ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>24시간 전</span>
        <span>현재</span>
      </div>
    </div>
  );
}
