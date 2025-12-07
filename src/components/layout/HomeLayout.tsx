import React from "react";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <main className="w-full text-slate-50 overflow-x-hidden">
      {/* Header와 동일한 컨테이너 규격 적용: max-w-[1280px] + px-6 */}
      <div className="mx-auto w-full max-w-[1280px] px-6">
        {children}
      </div>
    </main>
  );
}
