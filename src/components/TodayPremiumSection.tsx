/**
 * 오늘의 AI 김프 요약 - 좌측 카드 (간단 버전)
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
    <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-4 sm:p-5 pt-4 h-full flex flex-col">
      {/* 제목 */}
      <h2 className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900 mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>오늘의 AI 김프 요약</span>
      </h2>

      {/* 정보 그리드 */}
      <div className="space-y-3 flex-1">
        <div className="flex justify-between">
          <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">평균 김프</span>
          <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{avgPremium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최소 김프</span>
          <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{minPremium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최대 김프</span>
          <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{maxPremium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">환율</span>
          <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{fxRate}</span>
        </div>
      </div>

      {/* Score 카드 */}
      <div className="mt-4 rounded-lg dark:bg-indigo-900/60 light:bg-indigo-100/60 px-3 py-2 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px] sm:text-xs dark:text-slate-300 light:text-indigo-700 mb-1">KR Premium Score</div>
          <div className="text-lg sm:text-xl font-bold dark:text-emerald-400 light:text-emerald-600">{score}/10</div>
        </div>
      </div>
    </div>
  );
}

export default TodayPremiumSection;
