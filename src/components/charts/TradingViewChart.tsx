import { useEffect, useRef, memo, useState } from "react";

interface TradingViewChartProps {
  symbol?: string;
  exchange?: "UPBIT" | "BINANCE";
  height?: number;
  theme?: "dark" | "light";
}

declare global {
  interface Window {
    TradingView?: any;
  }
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

      // 설정 객체
      const config: any = {
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
      };

      // script 태그 생성 및 설정 저장
      const script = document.createElement("script");
      script.type = "text/tradingview-widget";
      
      try {
        script.textContent = JSON.stringify(config);
        script.async = true;
      } catch (e) {
        console.warn("[TradingViewChart] JSON stringify failed, using fallback");
        script.textContent = JSON.stringify({ autosize: true, symbol: tvSymbol });
        script.async = true;
      }

      container.appendChild(script);

      // TradingView 로더 스크립트 추가 (약간 지연)
      setTimeout(() => {
        const loaderScript = document.createElement("script");
        loaderScript.src =
          "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        loaderScript.async = true;
        loaderScript.onload = () => {
          setTimeout(() => setIsLoading(false), 800);
        };
        loaderScript.onerror = () => {
          console.warn("[TradingViewChart] Widget loader failed");
          setIsLoading(false);
        };

        container.appendChild(loaderScript);
      }, 100);
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
          <div className="text-slate-400 text-sm">차트 로드 중...</div>
        </div>
      )}
    </div>
  );
}

export default memo(TradingViewChart);
