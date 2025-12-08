// src/components/MyAlertsCard.tsx

import React from "react";

export default function MyAlertsCard() {
  const isLoggedIn = false; // TODO: 실제 로그인 상태 연동

  return (
    <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-4 h-full flex flex-col">
      {/* 제목 */}
      <h2 className="text-sm md:text-base font-bold dark:text-slate-100 light:text-slate-900 mb-3 flex items-center gap-2">
        <span>🔔</span>
        <span>내 알림</span>
      </h2>

      {/* 내용 */}
      <div className="flex-1 flex items-center justify-center">
        {isLoggedIn ? (
          <div className="w-full space-y-1.5">
            <p className="text-[13px] dark:text-slate-100 light:text-slate-800">
              설정된 조건에 맞는 김프 급변 구간을 실시간으로 알려드립니다.
            </p>
            <div className="text-[12px] dark:text-slate-300 light:text-slate-700">
              <div className="mb-1">
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 3% 이상 상승 시 알림</span>
              </div>
              <div>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 급락 구간 경보 예측</span>
              </div>
            </div>
            <button className="mt-2 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">
              + 알림 설정 수정
            </button>
          </div>
        ) : (
          <div className="text-center w-full">
            <p className="text-[13px] md:text-[14px] dark:text-slate-100 light:text-slate-800 mb-1.5 leading-relaxed">
              김프 급변 구간을 푸시 알림으로 받아보세요.
            </p>
            <p className="text-[12px] dark:text-slate-400 light:text-slate-600 mb-3 leading-snug">
              로그인 후 관심 코인과 김프 조건을 설정하면, 지정한 구간에 도달할
              때마다 바로 알려드립니다.
            </p>
            <button className="underline underline-offset-4 text-indigo-300 hover:text-indigo-200 transition cursor-pointer font-semibold text-[13px]">
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
