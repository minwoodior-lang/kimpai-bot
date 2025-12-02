import { useEffect, useRef, memo, useState } from "react";

interface TradingViewChartProps {
  symbol?: string;
  exchange?: "UPBIT" | "BINANCE";
  height?: number;
  theme?: "dark" | "light";
}

function TradingViewChart({
  symbol = "BTC",
  exchange = "BINANCE",
  height = 400,
  theme = "dark",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);

    try {
      container.innerHTML = "";

      // TradingView 심볼 결정
      const tvSymbol =
        exchange === "UPBIT" ? `UPBIT:${symbol}KRW` : `BINANCE:${symbol}USDT`;

      // 1. 위젯 컨테이너 div 생성
      const widgetDiv = document.createElement("div");
      widgetDiv.className = "tradingview-widget-container__widget";
      container.appendChild(widgetDiv);

      // 2. 설정을 script 태그로 생성 (TradingView 공식 방식)
      const script = document.createElement("script");
      script.type = "text/tradingview-widget";
      
      // TradingView 설정을 JSON 문자열로 직접 작성 (stringify 사용 금지)
      script.textContent = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,
        interval: "60",
        timezone: "Asia/Seoul",
        theme: theme,
        style: "1",
        locale: "kr",
        enable_publishing: false,
        allow_symbol_change: false,
        calendar: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
      }, null, 2);
      
      container.appendChild(script);

      // 3. TradingView 로더 스크립트 추가
      const loaderScript = document.createElement("script");
      loaderScript.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      loaderScript.async = true;
      loaderScript.onload = () => {
        setIsLoading(false);
      };
      loaderScript.onerror = () => {
        console.warn("[TradingViewChart] Widget loader failed");
        setIsLoading(false);
      };

      container.appendChild(loaderScript);
    } catch (err) {
      console.error("[TradingViewChart] Error:", err);
      setIsLoading(false);
    }

    return () => {
      try {
        if (container) {
          container.innerHTML = "";
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [exchange, symbol, theme]);

  return (
    <div
      className="tradingview-widget-container"
      style={{ height: `${height}px`, width: "100%" }}
    >
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
        className="bg-slate-800/50 rounded"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/30 rounded">
          <div className="text-slate-400 text-sm">Loading chart...</div>
        </div>
      )}
    </div>
  );
}

export default memo(TradingViewChart);
