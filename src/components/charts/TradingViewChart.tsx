import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  tvSymbol: string;
  height?: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tvSymbol,
  height = 360,
}) => {
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

  return (
    <div className="w-full" style={{ height }}>
      <div
        ref={containerRef}
        className="tradingview-widget-container h-full w-full"
      />
    </div>
  );
};

export default TradingViewChart;
