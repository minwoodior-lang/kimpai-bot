/**
 * 오늘의 AI 김프 요약 - 좌측 카드 (간단 버전)
 */

interface TodayPremiumSectionProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
  compact?: boolean;
}

export function TodayPremiumSection({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
  compact = false,
}: TodayPremiumSectionProps) {
  const gaugePercent = Math.min(Math.max((score ?? 0) * 10, 0), 100);

  return (
    <div className={`rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} h-full flex flex-col`}>
      {/* 제목 */}
      <h2 className={`${compact ? 'text-[11px] sm:text-sm' : 'text-sm sm:text-base'} font-bold dark:text-slate-100 light:text-slate-900 ${compact ? 'mb-1' : 'mb-2'} flex items-center gap-1.5`}>
        <span>📊</span>
        <span>{compact ? 'AI 요약' : '오늘의 AI 김프 요약'}</span>
      </h2>

      {/* 정보 그리드 - 모바일 최적화: 간격 3px 통일 */}
      <div className={`flex-1 ${compact ? 'space-y-[3px]' : 'space-y-2'} sm:space-y-2`}>
        <div className="flex justify-between items-baseline">
          <span className={`${compact ? 'text-[10px] sm:text-[10px]' : 'text-[11px] md:text-[13px]'} dark:text-white/60 light:text-slate-600`}>평균 김프</span>
          <span className={`${compact ? 'text-[11px] sm:text-xs' : 'text-sm md:text-[15px]'} font-semibold dark:text-slate-100 light:text-slate-900`}>{avgPremium}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className={`${compact ? 'text-[10px] sm:text-[10px]' : 'text-[11px] md:text-[14px]'} dark:text-white/60 light:text-slate-600`}>최소 김프</span>
          <span className={`${compact ? 'text-[11px] sm:text-xs' : 'text-sm md:text-[15px]'} font-semibold dark:text-slate-100 light:text-slate-900`}>{minPremium}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className={`${compact ? 'text-[10px] sm:text-[10px]' : 'text-[11px] md:text-[14px]'} dark:text-white/60 light:text-slate-600`}>최대 김프</span>
          <span className={`${compact ? 'text-[11px] sm:text-xs' : 'text-sm md:text-[15px]'} font-semibold dark:text-slate-100 light:text-slate-900`}>{maxPremium}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className={`${compact ? 'text-[10px] sm:text-[10px]' : 'text-[11px] md:text-[14px]'} dark:text-white/60 light:text-slate-600`}>환율</span>
          <span className={`${compact ? 'text-[11px] sm:text-xs' : 'text-sm md:text-[15px]'} font-semibold dark:text-slate-100 light:text-slate-900`}>{fxRate}</span>
        </div>
      </div>

      {/* KR Premium Score 라인 */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-slate-300">KR Premium Score</span>
        <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full bg-indigo-500"
            style={{ width: `${gaugePercent}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-violet-400">
          {score}/10
        </span>
      </div>
    </div>
  );
}

export default TodayPremiumSection;
