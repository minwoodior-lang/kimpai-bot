/**
 * 내 알림 - 우측 카드
 */

interface MyAlertsCardProps {
  compact?: boolean;
}

export function MyAlertsCard({ compact = false }: MyAlertsCardProps) {
  const isLoggedIn = false; // TODO: Connect to auth

  return (
    <div className={`rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 ${compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'} h-full flex flex-col ${compact ? 'min-h-auto' : 'min-h-[200px]'}`}>
      {/* 제목 */}
      <h3 className={`${compact ? 'text-xs sm:text-sm' : 'text-[15px] md:text-base'} font-bold dark:text-slate-100 light:text-slate-900 ${compact ? 'mb-1.5' : 'mb-2'} flex items-center gap-2`}>
        <span>🔔</span>
        <span>{compact ? '내 알림' : '내 알림'}</span>
      </h3>

      {/* 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center">
        {isLoggedIn ? (
          <div className={`${compact ? 'space-y-1' : 'space-y-2'} w-full`}>
            <div className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs md:text-sm'} dark:text-slate-300 light:text-slate-700`}>
              <div className={compact ? 'mb-1' : 'mb-2'}>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 3% 이상 상승 시 알림</span>
              </div>
              <div>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 급락 구간 경보 예측</span>
              </div>
            </div>
            <button className={`w-full ${compact ? 'mt-1' : 'mt-4'} ${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs md:text-sm'} text-indigo-400 hover:text-indigo-300 transition-colors`}>
              + 알림 설정 수정
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className={`${compact ? 'text-[9px] sm:text-[10px] mb-2' : 'text-xs md:text-sm mb-3'} dark:text-slate-400 light:text-slate-600 leading-relaxed text-white/60`}>
              로그인하고 알림 설정하기
            </p>
            <button className={`w-full rounded-lg dark:bg-indigo-600 light:bg-indigo-600 dark:hover:bg-indigo-700 light:hover:bg-indigo-700 transition-colors ${compact ? 'px-2.5 py-1' : 'px-4 md:px-5 py-2 md:py-2.5'} ${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs md:text-sm'} font-semibold text-white inline-flex items-center justify-center`}>
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAlertsCard;
