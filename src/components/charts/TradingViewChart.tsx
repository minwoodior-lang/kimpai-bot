import { useEffect, useRef, memo, useCallback } from "react";

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

    try {
      container.innerHTML = "";

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
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
      });

      container.appendChild(script);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[TradingViewChart] Failed to load widget:', err);
      }
    }

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [getFullSymbol, interval, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height: `${height}px`, width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default memo(TradingViewChart);
