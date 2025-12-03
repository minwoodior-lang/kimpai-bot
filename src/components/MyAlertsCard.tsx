/**
 * 내 알림 - 우측 카드
 */

export function MyAlertsCard() {
  const isLoggedIn = false; // TODO: Connect to auth

  return (
    <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-3 sm:p-4 h-full flex flex-col min-h-[200px]">
      {/* 제목 */}
      <h3 className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900 mb-2 flex items-center gap-2">
        <span>🔔</span>
        <span>내 알림</span>
      </h3>

      {/* 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center">
        {isLoggedIn ? (
          <div className="space-y-2 w-full">
            <div className="text-[10px] sm:text-xs dark:text-slate-300 light:text-slate-700">
              <div className="mb-2">
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 3% 이상 상승 시 알림</span>
              </div>
              <div>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 급락 구간 경보 예측</span>
              </div>
            </div>
            <button className="w-full mt-3 text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              + 알림 설정 수정
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600 mb-3">
              로그인하고 알림 설정하기
            </p>
            <button className="w-full rounded-lg dark:bg-indigo-600 light:bg-indigo-600 dark:hover:bg-indigo-700 light:hover:bg-indigo-700 transition-colors px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-white">
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAlertsCard;
