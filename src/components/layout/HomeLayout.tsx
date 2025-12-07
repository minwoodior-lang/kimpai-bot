// src/components/layout/HomeLayout.tsx
import React from "react";

interface HomeLayoutProps {
  children: React.ReactNode;
}

/**
 * 홈 전용 레이아웃 껍데기
 * - 폭/패딩은 Layout.tsx에서만 관리
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return <>{children}</>;
}
