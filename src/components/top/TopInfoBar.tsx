import { useEffect, useState } from "react";

interface GlobalMetrics {
  usdKrw: number;
  usdKrwChange: number;
  tetherKrw: number;
  tetherChange: number;
  btcDominance: number;
  marketCapKrw: number;
  marketCapChange: number;
  volume24hKrw: number;
  volume24hChange: number;
  concurrentUsers: number;
}

const getChangeColor = (value: number | null | undefined) => {
  if (!value) return "text-[#A7B3C6]";
  if (value > 0) return "text-[#50e3a4]";
  if (value < 0) return "text-[#ff6b6b]";
  return "text-[#A7B3C6]";
};

const formatNumber = (value: number, decimals: number = 2) => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export default function TopInfoBar() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/global-metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        // Silent error
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="w-full bg-[#050816] border-b border-[#0b1120] h-7 flex items-center">
        <div className="mx-auto max-w-[1200px] px-4 lg:px-5 w-full h-full flex items-center justify-between">
          <div className="text-[11px] text-[#A7B3C6]">데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#050816] border-b border-[#0b1120]">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-5 h-7 flex items-center justify-between">
        {/* 좌측: 글로벌 지표 */}
        <div className="flex items-center gap-0 text-[11px] text-[#A7B3C6] overflow-x-auto whitespace-nowrap scrollbar-hide">
          {/* USD/KRW */}
          <div className="flex items-center gap-1 pr-2">
            <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] flex-shrink-0" />
            <span className="font-medium text-white">${formatNumber(metrics.usdKrw, 0)}</span>
            <span className={`font-medium ${getChangeColor(metrics.usdKrwChange)}`}>
              {metrics.usdKrwChange > 0 ? "+" : ""}{formatNumber(metrics.usdKrwChange, 2)}%
            </span>
          </div>

          <span className="text-[#30364a] px-1">|</span>

          {/* USDT */}
          <div className="flex items-center gap-1 pr-2">
            <div className="h-3.5 w-3.5 rounded-full bg-[#26a17b] flex-shrink-0 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">T</span>
            </div>
            <span className="font-medium text-white">₩{formatNumber(metrics.tetherKrw, 0)}</span>
            <span className={`font-medium ${getChangeColor(metrics.tetherChange)}`}>
              {metrics.tetherChange > 0 ? "+" : ""}{formatNumber(metrics.tetherChange, 2)}%
            </span>
          </div>

          <span className="text-[#30364a] px-1">|</span>

          {/* BTC 점유율 */}
          <div className="flex items-center gap-1 pr-2">
            <span className="text-[#A7B3C6]">BTC:</span>
            <span className="font-medium text-white">{formatNumber(metrics.btcDominance, 1)}%</span>
          </div>

          <span className="hidden md:inline text-[#30364a] px-1">|</span>

          {/* 시가총액 */}
          <div className="hidden md:flex items-center gap-1 pr-2">
            <span className="text-[#A7B3C6]">시가총액:</span>
            <span className="font-medium text-white">₩{formatNumber(metrics.marketCapKrw / 1e12, 1)}조</span>
            <span className={`font-medium ${getChangeColor(metrics.marketCapChange)}`}>
              {metrics.marketCapChange > 0 ? "+" : ""}{formatNumber(metrics.marketCapChange, 2)}%
            </span>
          </div>

          <span className="hidden md:inline text-[#30364a] px-1">|</span>

          {/* 24시간 거래량 */}
          <div className="hidden md:flex items-center gap-1 pr-2">
            <span className="text-[#A7B3C6]">거래량:</span>
            <span className="font-medium text-white">₩{formatNumber(metrics.volume24hKrw / 1e12, 1)}조</span>
            <span className={`font-medium ${getChangeColor(metrics.volume24hChange)}`}>
              {metrics.volume24hChange > 0 ? "+" : ""}{formatNumber(metrics.volume24hChange, 2)}%
            </span>
          </div>
        </div>

        {/* 우측: 동시접속자 */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto pl-4">
          <div className="h-4 w-4 rounded-full bg-[#111827] flex items-center justify-center">
            <span className="text-[9px] text-[#A7B3C6]">👥</span>
          </div>
          <span className="text-[11px] text-[#A7B3C6]/80">동시접속자</span>
          <span className="text-[11px] text-white font-semibold">{metrics.concurrentUsers.toLocaleString()}명</span>
        </div>
      </div>
    </div>
  );
}
