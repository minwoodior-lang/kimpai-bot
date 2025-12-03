import React from "react";
import AIInsightBox from "@/components/AIInsightBox";
import AlertSummary from "@/components/AlertSummary";

interface HomeLayoutProps {
  children: React.ReactNode;
}

/**
 * P-1 홈 레이아웃 (KIMPGA.com 스타일)
 * - PC: 메인 영역 75% + 사이드바 25%
 * - 모바일: 위아래 스택 (flex-col)
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row gap-6 px-4 py-6">
        {/* 메인 영역: 차트 + 프리미엄 테이블 (약 75%) */}
        <section className="flex-1 min-w-0">
          {children}
        </section>

        {/* 사이드바: AI Insight + Alert Summary (약 25%) */}
        <aside className="w-full lg:w-[320px] shrink-0 space-y-4">
          <AIInsightBox />
          <AlertSummary />
        </aside>
      </main>
    </div>
  );
}
