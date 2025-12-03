import { useEffect, useState } from "react";

interface GlobalMetricsResponse {
  fx: {
    usdKrw: number;
    change24h: number;
  };
  usdt: {
    krw: number;
    change24h: number;
  };
  global: {
    btcDominance: number;
    marketCapKrw: number;
    marketCapChange24h: number;
    volume24hKrw: number;
    volume24hChange24h: number;
  };
  concurrentUsers: number;
}

const getChangeColor = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return "text-[#A7B3C6]";
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

const formatCurrency = (value: number): string => {
  const trillions = value / 1e12;
  if (trillions >= 1) {
    return `₩${formatNumber(trillions, 0)}조`;
  }
  const billions = value / 1e9;
  if (billions >= 1) {
    return `₩${formatNumber(billions, 0)}억`;
  }
  return `₩${formatNumber(value, 0)}`;
};

export default function TopInfoBar() {
  const [metrics, setMetrics] = useState<GlobalMetricsResponse | null>(null);
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
        console.error("[TopInfoBar] Fetch error:", err);
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
          <div className="text-[11px] text-[#A7B3C6]">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#050816] border-b border-[#0b1120]">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-5 h-7 flex items-center justify-between gap-4">
        {/* 좌측: 글로벌 지표 */}
        <div className="flex items-center gap-3 text-[11px] text-[#A7B3C6] overflow-x-auto whitespace-nowrap scrollbar-hide flex-1">
          
          {/* 환율 (USD/KRW) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-[#4A90E2] to-[#357ABD] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-white font-bold">$</span>
            </div>
            <span className="font-medium text-white">₩{formatNumber(metrics.fx.usdKrw, 0)}</span>
            <span className="text-[#A7B3C6]">/ $1</span>
            <span className={`font-medium ${getChangeColor(metrics.fx.change24h)}`}>
              {metrics.fx.change24h > 0 ? "+" : ""}{formatNumber(metrics.fx.change24h, 2)}%
            </span>
          </div>

          <span className="text-[#30364a] px-0.5">|</span>

          {/* 테더 (USDT/KRW) */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-[#26A17B] flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-white font-bold">₮</span>
            </div>
            <span className="font-medium text-white">₩{formatNumber(metrics.usdt.krw, 0)}</span>
            <span className="text-[#A7B3C6]">/ USDT</span>
            <span className={`font-medium ${getChangeColor(metrics.usdt.change24h)}`}>
              {metrics.usdt.change24h > 0 ? "+" : ""}{formatNumber(metrics.usdt.change24h, 2)}%
            </span>
          </div>

          <span className="text-[#30364a] px-0.5">|</span>

          {/* BTC 점유율 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[#A7B3C6]">BTC 점유율:</span>
            <span className="font-medium text-white">{formatNumber(metrics.global.btcDominance, 1)}%</span>
          </div>

          {/* 시가총액 (md 이상에서만 표시) */}
          <span className="hidden md:inline text-[#30364a] px-0.5">|</span>
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <span className="text-[#A7B3C6]">시가총액:</span>
            <span className="font-medium text-white">{formatCurrency(metrics.global.marketCapKrw)}</span>
            <span className={`font-medium ${getChangeColor(metrics.global.marketCapChange24h)}`}>
              {metrics.global.marketCapChange24h > 0 ? "+" : ""}{formatNumber(metrics.global.marketCapChange24h, 2)}%
            </span>
          </div>

          {/* 24시간 거래량 (md 이상에서만 표시) */}
          <span className="hidden md:inline text-[#30364a] px-0.5">|</span>
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <span className="text-[#A7B3C6]">24시간 거래량:</span>
            <span className="font-medium text-white">{formatCurrency(metrics.global.volume24hKrw)}</span>
            <span className={`font-medium ${getChangeColor(metrics.global.volume24hChange24h)}`}>
              {metrics.global.volume24hChange24h > 0 ? "+" : ""}{formatNumber(metrics.global.volume24hChange24h, 2)}%
            </span>
          </div>
        </div>

        {/* 우측: 동시접속자 */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
          <span className="text-[#A7B3C6]">현재 접속:</span>
          <span className="font-medium text-white">{metrics.concurrentUsers.toLocaleString()}명</span>
        </div>
      </div>
    </div>
  );
}
