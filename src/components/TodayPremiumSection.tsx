/**
 * 오늘의 AI 김프 요약 - 좌측 카드
 */

interface TodayPremiumSectionProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
  marketSummary?: string;
  compact?: boolean;
}

/** 점수에 따른 숫자 색상만 변경 */
function getScoreTextClass(score: number) {
  if (score <= 2) return "text-emerald-300";
  if (score <= 4) return "text-lime-300";
  if (score <= 6) return "text-amber-300";
  if (score <= 8) return "text-orange-300";
  return "text-red-400";
}

export function TodayPremiumSection({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
  marketSummary,
  compact = false,
}: TodayPremiumSectionProps) {
  const scoreTextClass = getScoreTextClass(score);
  const widthPercent = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <div
      className={`rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 ${
        compact ? "p-2 sm:p-3" : "p-3 sm:p-4"
      } h-full flex flex-col`}
    >
      {/* 제목 */}
      <h2
        className={`${
          compact ? "text-[11px] sm:text-sm" : "text-sm sm:text-base"
        } font-bold dark:text-slate-100 light:text-slate-900 ${
          compact ? "mb-1" : "mb-2"
        } flex items-center gap-1.5`}
      >
        <span>📊</span>
        <span>{compact ? "AI 요약" : "오늘의 AI 김프 요약"}</span>
      </h2>

      {/* 오늘 시장 요약 + 설명 */}
      {marketSummary && (
        <div className={`${compact ? "mb-2" : "mb-3"}`}>
          <p
            className={`${
              compact ? "text-[10px]" : "text-[11px]"
            } text-slate-300`}
          >
            {marketSummary}
          </p>

          <p
            className={`${
              compact ? "text-[9px]" : "text-[10px]"
            } text-slate-500 mt-1`}
          >
            ※ 변동성·추세·역프는 김프(국내-해외 가격 차이) 기준으로 실시간 산출됩니다.
          </p>
        </div>
      )}

      {/* 정보 그리드 */}
      <div
        className={`flex-1 ${
          compact ? "space-y-[3px]" : "space-y-2"
        } sm:space-y-2`}
      >
        <div className="flex justify-between items-baseline">
          <span
            className={`${
              compact ? "text-[10px]" : "text-[11px] md:text-[13px]"
            } dark:text-white/60 light:text-slate-600`}
          >
            평균 김프
          </span>
          <span
            className={`${
              compact ? "text-[11px]" : "text-sm md:text-[15px]"
            } font-semibold`}
          >
            {avgPremium}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span
            className={`${
              compact ? "text-[10px]" : "text-[11px] md:text-[14px]"
            } dark:text-white/60 light:text-slate-600`}
          >
            최소 김프
          </span>
          <span
            className={`${
              compact ? "text-[11px]" : "text-sm md:text-[15px]"
            } font-semibold`}
          >
            {minPremium}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span
            className={`${
              compact ? "text-[10px]" : "text-[11px] md:text-[14px]"
            } dark:text-white/60 light:text-slate-600`}
          >
            최대 김프
          </span>
          <span
            className={`${
              compact ? "text-[11px]" : "text-sm md:text-[15px]"
            } font-semibold`}
          >
            {maxPremium}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span
            className={`${
              compact ? "text-[10px]" : "text-[11px] md:text-[14px]"
            } dark:text-white/60 light:text-slate-600`}
          >
            환율
          </span>
          <span
            className={`${
              compact ? "text-[11px]" : "text-sm md:text-[15px]"
            } font-semibold`}
          >
            {fxRate}
          </span>
        </div>
      </div>

      {/* Score 카드 - 게이지바 */}
      <div className={`${compact ? "mt-2" : "mt-3"} flex items-center justify-between`}>
        <div className="flex flex-col flex-1">
          <span
            className={`${
              compact ? "text-[10px]" : "text-[11px]"
            } text-slate-400`}
          >
            KR Premium Score
          </span>

          <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-700/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 transition-all duration-300"
              style={{ width: `${widthPercent}%` }}
            />
          </div>
        </div>

        <span
          className={`${
            compact ? "text-base" : "text-lg"
          } font-semibold ml-3 ${scoreTextClass}`}
        >
          {score}/10
        </span>
      </div>
    </div>
  );
}

export default TodayPremiumSection;
