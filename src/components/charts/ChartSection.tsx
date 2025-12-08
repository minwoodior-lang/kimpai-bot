// src/components/ChartSection.tsx
import { useEffect, useRef, useState } from "react";

// 지원하는 마켓 심볼 매핑
const SYMBOL_MAP: Record<string, string> = {
  BINANCE_BTC: "BINANCE:BTCUSDT",
  BINANCE_ETH: "BINANCE:ETHUSDT",
  BINANCE_SOL: "BINANCE:SOLUSDT",
};

interface ChartSectionProps {
  selectedMarket?: string; // 예: "BINANCE_BTC"
}

/**
 * P-1 메인 차트 섹션 (단일 TradingView Advanced Chart)
 * - selectedMarket 변경 시 심볼 자동 교체
 * - 높이 360px (KIMPGA 스타일)
 */
export default function ChartSection({
  selectedMarket = "BINANCE_BTC",
}: ChartSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    // 기존 위젯 제거
    containerRef.current.innerHTML = "";

    const symbol = SYMBOL_MAP[selectedMarket] ?? "BINANCE:BTCUSDT";

    try {
      // TradingView 글로벌 스크립트 사용
      // @ts-ignore
      const TV = (window as any).TradingView;
      if (TV && TV.widget) {
        new TV.widget({
          // 🔹 컨테이너 크기에 자동 맞춤
          autosize: true,
          symbol,
          interval: "60",
          timezone: "Asia/Seoul",
          theme: "dark",
          style: "1",
          locale: "kr",
          toolbar_bg: "#020617",
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          container_id: "kimpai-main-chart",
        });
      }
    } catch (error) {
      console.error("[ChartSection] TradingView widget error:", error);
    }
  }, [selectedMarket, isLoaded]);

  // 마운트 시 isLoaded 플래그 설정 (클라이언트 사이드)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    // 🔹 모바일에서는 화면 전체 폭 사용(-mx-4), PC에서는 기존 그대로
    <section className="mb-6 -mx-4 sm:mx-0 bg-slate-900/60 border-y border-slate-800/50 sm:border sm:rounded-xl sm:p-3">
      <div
        id="kimpai-main-chart"
        ref={containerRef}
        className="w-full h-[360px] bg-slate-900 sm:rounded-lg"
      >
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
          차트 로딩 중...
        </div>
      </div>
    </section>
  );
}
