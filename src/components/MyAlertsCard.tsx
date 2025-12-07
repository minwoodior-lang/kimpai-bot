/**
 * 내 알림 - 우측 카드 (텍스트 버튼 로그인 버전)
 */

interface MyAlertsCardProps {
  compact?: boolean;
}

export function MyAlertsCard({ compact = false }: MyAlertsCardProps) {
  const isLoggedIn = false; // TODO: Auth 와 연동 예정

  return (
    <div
      className={`
        rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40
        dark:bg-slate-900/40 light:bg-slate-100/30
        ${compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4"}
        h-full flex flex-col
        ${compact ? "min-h-auto" : "min-h-[200px]"}
      `}
    >
      {/* 제목 */}
      <h3
        className={`
          ${compact ? "text-xs sm:text-sm" : "text-[15px] md:text-base"}
          font-bold dark:text-slate-100 light:text-slate-900
          ${compact ? "mb-1.5" : "mb-2"}
          flex items-center gap-2
        `}
      >
        <span>🔔</span>
        <span>내 알림</span>
      </h3>

      {/* 본문 */}
      <div className="flex-1 flex items-center justify-center">
        {isLoggedIn ? (
          // 로그인 후 알림 목록 (확장용)
          <div className={`${compact ? "space-y-1" : "space-y-2"} w-full`}>
            <div
              className={`
                ${compact ? "text-[9px] sm:text-[10px]" : "text-xs md:text-sm"}
                dark:text-slate-300 light:text-slate-700
              `}
            >
              <div className={compact ? "mb-1" : "mb-2"}>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 3% 이상 상승 시 알림</span>
              </div>
              <div>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 급락 구간 경보 예측</span>
              </div>
            </div>

            {/* 알림 수정 버튼 */}
            <button
              className={`
                w-full text-indigo-400 hover:text-indigo-300 transition-colors
                ${compact ? "mt-1 text-[9px] sm:text-[10px]" : "mt-4 text-xs md:text-sm"}
              `}
            >
              + 알림 설정 수정
            </button>
          </div>
        ) : (
          // 비로그인 상태 — 텍스트 버튼 스타일
          <div className="text-center flex flex-col items-center">
            <p
              className={`
                dark:text-slate-400 light:text-slate-600 leading-relaxed
                ${compact ? "text-[9px] sm:text-[10px] mb-1.5" : "text-xs md:text-sm mb-2.5"}
              `}
            >
              로그인하고 알림 설정하기
            </p>

            {/* 텍스트 버튼 스타일 '로그인' */}
            <button
              className={`
                underline underline-offset-4
                text-indigo-300 hover:text-indigo-200
                transition cursor-pointer font-semibold
                ${compact ? "text-[9px] sm:text-[10px]" : "text-xs md:text-sm"}
              `}
            >
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAlertsCard;
