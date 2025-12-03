/**
 * 오늘의 AI 김프 요약 - 카드형 컴포넌트
 * 이미지의 빨간 박스 스타일로 구성
 */

interface TodayPremiumSectionProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
}

export function TodayPremiumSection({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
}: TodayPremiumSectionProps) {
  return (
    <section className="w-full max-w-[1200px] mx-auto mt-6">
      {/* 카드 컨테이너 */}
      <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-4 sm:p-5">
        {/* 제목 */}
        <h2 className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900 mb-3 flex items-center gap-2">
          <span>📊</span>
          <span>오늘의 AI 김프 요약</span>
        </h2>

        {/* 정보 그리드 (반응형) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">평균 김프</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{avgPremium}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최대 김프</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{maxPremium}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최소 김프</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{minPremium}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">환율</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{fxRate}</span>
          </div>
        </div>

        {/* 설명 텍스트 */}
        <p className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600 mb-3 leading-relaxed">
          대시보드를 과산으로 움침니다.
        </p>

        {/* Score + 버튼 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
          {/* Score 카드 */}
          <div className="flex-1 rounded-lg dark:bg-indigo-900/60 light:bg-indigo-100/60 px-3 py-2 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] sm:text-xs dark:text-slate-300 light:text-indigo-700 mb-1">KR Premium Score</div>
              <div className="text-lg sm:text-xl font-bold dark:text-emerald-400 light:text-emerald-600">{score}/10</div>
            </div>
          </div>

          {/* PRO 버튼 */}
          <button className="flex-1 rounded-lg dark:bg-indigo-600 light:bg-indigo-600 dark:hover:bg-indigo-700 light:hover:bg-indigo-700 transition-colors px-3 py-2 text-[11px] sm:text-xs font-semibold text-white flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>🔒</span>
            <span>PRO 전용 48시간 김프 예측</span>
          </button>
        </div>

        {/* 하단 알림 텍스트 */}
        <p className="text-[9px] sm:text-[10px] dark:text-slate-500 light:text-slate-600 mt-2">
          내 알림
        </p>
      </div>
    </section>
  );
}

export default TodayPremiumSection;
