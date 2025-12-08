// src/components/ChartSectionEnhanced.tsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";

const TradingViewChart = dynamic(() => import("./charts/TradingViewChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] bg-slate-900/50 animate-pulse rounded-xl" />
  ),
});

// 차트 선택 목록 그룹 (예시 — 기존과 동일하게 유지)
const INDICATOR_GROUPS: Record<string, string[]> = {
  "BTC / PREMIUM": [
    "Binance BTC USDT",
    "Upbit BTC KRW",
    "Bithumb BTC KRW",
    "Coinbase BTC USD",
    "BTC Longs",
    "BTC Shorts",
    "BTC Dominance",
  ],
  "MARKET INDEX": ["TOTAL Market Cap", "TOTAL2"],
};

export default function ChartSectionEnhanced({ selectedSymbol, onSelect }: any) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [indicator, setIndicator] = useState("Binance BTC USDT");

  // 차트 리사이즈 옵저버
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event("resize"));
    });
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // 드롭다운 바깥 클릭 감지
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target instanceof Node)) return;
      const dropdown = document.getElementById("chart-dropdown-wrapper");
      if (dropdown && !dropdown.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="mb-6 rounded-xl bg-slate-900/60 p-3 border border-slate-800/50">
      {/* 상단 - 개인화 설정 + 드롭다운 */}
      <div className="flex items-center justify-between mb-2">
        <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg border border-slate-600">
          개인화 설정
        </button>

        {/* 드롭다운 컨테이너 */}
        <div id="chart-dropdown-wrapper" className="relative">
          {/* 선택된 항목 버튼 */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((v) => !v)}
            className="flex items-center gap-1 bg-slate-700 rounded-lg px-3 h-10 border border-slate-600 hover:border-slate-500 text-white text-sm"
          >
            {indicator}
            <svg
              className={`w-4 h-4 text-slate-300 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* ▼ 드롭다운 메뉴 */}
          {isDropdownOpen && (
            <div
              className="
                absolute top-full right-0 mt-2
                w-72 max-w-[90vw]
                bg-slate-800 border border-slate-700
                rounded-lg shadow-2xl z-50
                overflow-y-auto max-h-[400px]
              "
            >
              {Object.entries(INDICATOR_GROUPS).map(([group, items]) => (
                <div key={group} className="border-b border-slate-700/50">
                  <p className="px-3 py-2 text-xs text-slate-400 uppercase">
                    {group}
                  </p>

                  {items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setIndicator(item);
                        setIsDropdownOpen(false);
                        if (onSelect) onSelect(item);
                      }}
                      className={`
                        w-full text-left px-3 py-2 text-sm
                        hover:bg-slate-700
                        ${indicator === item ? "bg-slate-700/60" : ""}
                      `}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ▼ 차트 영역 */}
      <div
        id="kimpai-main-chart"
        ref={containerRef}
        className="w-full h-[360px] rounded-lg bg-slate-900 overflow-hidden"
      >
        <TradingViewChart indicator={indicator} />
      </div>
    </section>
  );
}
