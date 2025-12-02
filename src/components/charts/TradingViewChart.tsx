import { useEffect, useRef, memo, useCallback, useState } from "react";

// TradingView 심볼 오버라이드 (특수 마켓용)
const TV_SYMBOL_OVERRIDES: Record<string, string> = {
  // 필요 시 하나씩 추가. 예: H: "OKX:HUSDT"
};

const getTvSymbol = (symbol: string, exchange: "UPBIT" | "BINANCE" = "BINANCE"): string => {
  const base = symbol.split("/")[0].toUpperCase();
  if (TV_SYMBOL_OVERRIDES[base]) {
    return TV_SYMBOL_OVERRIDES[base];
  }
  if (exchange === "UPBIT") {
    return `UPBIT:${base}KRW`;
  }
  return `BINANCE:${base}USDT`;
};

interface TradingViewChartProps {
  symbol?: string;
  exchange?: "UPBIT" | "BINANCE";
  tvSymbol?: string;
  interval?: string;
  height?: number;
  theme?: "dark" | "light";
}

function TradingViewChart({
  symbol = "BTC",
  exchange = "BINANCE",
  tvSymbol,
  interval = "60",
  height = 400,
  theme = "dark",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getFullSymbol = useCallback(() => {
    if (tvSymbol) {
      return tvSymbol;
    }
    return getTvSymbol(symbol, exchange);
  }, [exchange, symbol, tvSymbol]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);

    try {
      container.innerHTML = "";

      // TradingView 위젯 설정
      const config = {
        autosize: true,
        symbol: getFullSymbol(),
        interval: interval,
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
        hide_volume: false,
        support_host: "https://www.tradingview.com",
      };

      // 1. 설정을 script 요소로 정확히 생성
      const script = document.createElement("script");
      script.type = "text/tradingview-widget";
      const configStr = JSON.stringify(config);
      if (!configStr || configStr === '{}') {
        console.warn('[TradingViewChart] Invalid config, skipping widget');
        setIsLoading(false);
        return;
      }
      script.textContent = configStr;
      
      container.appendChild(script);

      // 2. 로더 스크립트 생성 및 로드
      const loaderScript = document.createElement("script");
      loaderScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      loaderScript.async = true;
      loaderScript.onload = () => setIsLoading(false);
      loaderScript.onerror = () => {
        console.warn('[TradingViewChart] Widget loader failed');
        setIsLoading(false);
      };

      container.appendChild(loaderScript);
    } catch (err) {
      console.error('[TradingViewChart] Error:', err);
      setIsLoading(false);
    }

    return () => {
      if (container) {
        try {
          container.innerHTML = "";
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [getFullSymbol, interval, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px`, width: "100%" }}>
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
