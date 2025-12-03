import React from "react";

interface HomeLayoutProps {
  children: React.ReactNode;
}

/**
 * P-1 홈 레이아웃 (KIMPGA.com 스타일)
 * - 전체 폭 사용 (사이드바 제거)
 * - 메인 콘텐츠만 렌더링
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-[1440px] px-4 lg:px-6 py-6 overflow-x-hidden">
        {/* 메인 영역: 전체 폭 차트 + 프리미엄 테이블 */}
        {children}
      </main>
    </div>
  );
}
