import React from "react";
import AIInsightBox from "@/components/AIInsightBox";
import AlertSummary from "@/components/AlertSummary";

interface HomeLayoutProps {
  children: React.ReactNode;
}

/**
 * P-1 홈 레이아웃 (KIMPGA.com 스타일)
 * - PC(lg+): 메인 75% + 사이드바 25% (AIBox + AlertSummary)
 * - 모바일: 메인 100% (AIBox 완전 숨김)
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row gap-6 px-4 py-6 overflow-x-hidden">
        {/* 메인 영역: 차트 + 프리미엄 테이블 (약 75%) */}
        <section className="flex-1 min-w-0">
          {children}
        </section>

        {/* 사이드바: AI Insight + Alert Summary (약 25% - PC only, completely hidden on mobile) */}
        <aside className="hidden lg:flex lg:w-[320px] shrink-0 flex-col space-y-4">
          <AIInsightBox />
          <AlertSummary />
        </aside>
      </main>
    </div>
  );
}
