import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  tvSymbol: string;
  height?: number | string;
  domesticExchange?: string;
  foreignExchange?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tvSymbol,
  height = 360,
  domesticExchange,
  foreignExchange,
}) => {
  // 모바일 환경에서 높이 축소
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const chartHeight = isMobile && typeof height === 'number' ? Math.min(height, 240) : height;
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

    // TradingView에서 그대로 요구하는 JSON 설정을 문자열로 넣어줍니다.
    const config = {
      autosize: true,
      symbol: tvSymbol || "BINANCE:BTCUSDT",
      interval: "60",
      timezone: "Asia/Seoul",
      theme: "dark",
      style: "1",
      locale: "kr",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };

    script.innerHTML = JSON.stringify(config);

    containerRef.current.appendChild(script);
  }, [tvSymbol]);

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
      <div className="flex-1 w-full overflow-hidden">
        <div
          ref={containerRef}
          className="tradingview-widget-container h-full w-full"
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
