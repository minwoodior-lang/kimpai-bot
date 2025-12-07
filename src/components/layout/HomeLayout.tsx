// src/components/layout/HomeLayout.tsx
import React from "react";

interface HomeLayoutProps {
  children: React.ReactNode;
}

/**
 * P-1 홈 레이아웃 (KIMPGA.com 스타일)
 * - Layout.tsx의 배경색을 그대로 사용
 * - 가운데 정렬 + 여백만 관리
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <main className="w-full text-slate-50 overflow-x-hidden">
      {/* 전체 컨텐츠를 가운데 정렬 */}
      <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-4 md:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
