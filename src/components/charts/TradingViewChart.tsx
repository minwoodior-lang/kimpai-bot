// src/components/charts/TradingViewChart.tsx
import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  tvSymbol: string;
  height?: number | string;
  domesticExchange?: string;
  foreignExchange?: string;
  defaultTimeframe?:
    | "1m"
    | "3m"
    | "5m"
    | "15m"
    | "30m"
    | "1h"
    | "2h"
    | "3h"
    | "4h"
    | "1d"
    | "1w";
}

// 시간간격을 TradingView interval로 변환
const timeframeToInterval = (tf?: string): string => {
  const mapping: Record<string, string> = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "3h": "180",
    "4h": "240",
    "1d": "1D",
    "1w": "1W",
  };
  return mapping[tf || "1h"] || "60";
};

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tvSymbol,
  height = 360,
  domesticExchange,
  foreignExchange,
  defaultTimeframe = "1h",
}) => {
  // 모바일 여부
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  // 모바일이면 높이 조금 줄이기(선택사항)
  const chartHeight =
    isMobile && typeof height === "number"
      ? Math.min(height, 240)
      : height;

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 이전 위젯 제거
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const config = {
      autosize: true,
      symbol: tvSymbol || "BINANCE:BTCUSDT",
      interval: timeframeToInterval(defaultTimeframe),
      timezone: "Asia/Seoul",
      theme: "dark",
      style: "1",
      locale: "kr",
      enable_publishing: false,

      // 🔹 PC에서는 그대로, 모바일에서는 상단 툴바(심볼 드롭다운 포함) 숨김
      hide_top_toolbar: isMobile ? true : false,

      hide_legend: false,
      save_image: false,
      hide_volume: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };

    script.innerHTML = JSON.stringify(config);
    containerRef.current.appendChild(script);
  }, [tvSymbol, defaultTimeframe, isMobile]);

  const getExchangeName = (exchange?: string) => {
    if (!exchange) return "";
    const [exName] = exchange.split("_");
    return exName;
  };

  return (
    <div className="w-full flex flex-col" style={{ height: chartHeight }}>
      {(domesticExchange || foreignExchange) && (
        <div className="px-2 sm:px-4 py-1 sm:py-2 border-b border-white/10 bg-slate-900/30">
          <p className="text-[9px] sm:text-[11px] md:text-[13px] text-slate-400 font-medium flex items-center gap-1 sm:gap-2">
            <span>KR 기준 거래소: {getExchangeName(domesticExchange)}</span>
            <span className="text-slate-500">/</span>
            <span>해외 거래소 기준: {getExchangeName(foreignExchange)}</span>
          </p>
        </div>
      )}

      {/* overflow-hidden 제거해서 위젯은 자유롭게, 대신 툴바는 모바일에서 숨김 */}
      <div className="flex-1 w-full">
        <div
          ref={containerRef}
          className="tradingview-widget-container h-full w-full"
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
