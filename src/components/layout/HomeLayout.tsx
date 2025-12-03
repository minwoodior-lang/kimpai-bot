import React from "react";
import AIInsightBox from "@/components/AIInsightBox";
import AlertSummary from "@/components/AlertSummary";

interface HomeLayoutProps {
  children: React.ReactNode;
}

/**
 * P-1 홈 레이아웃 (KIMPGA.com 스타일)
 * - PC: 메인 영역 75% + 사이드바 25%
 * - 모바일: AIBox 위에 표시 + 차트/테이블 (no horizontal scroll)
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row gap-6 px-4 py-6">
        {/* 메인 영역: 차트 + 프리미엄 테이블 (약 75%) */}
        <section className="flex-1 min-w-0 flex flex-col">
          {/* Mobile: AI InsightBox appears ABOVE the table/chart */}
          <div className="lg:hidden mb-6 w-full">
            <AIInsightBox />
          </div>
          {children}
        </section>

        {/* 사이드바: AI Insight + Alert Summary (약 25% - PC only) */}
        <aside className="hidden lg:flex lg:w-[320px] shrink-0 flex-col space-y-4">
          <AIInsightBox />
          <AlertSummary />
        </aside>
      </main>
    </div>
  );
}
