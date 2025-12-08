/**
 * AI 요약 카드 - 공통 콘텐츠 베이스
 * PC/모바일에서 동일한 데이터와 텍스트를 사용
 * layout prop으로만 스타일을 분기
 */

interface AiSummaryContentBaseProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
  layout?: "desktop" | "mobile";
}

/** 점수에 따른 숫자 색상만 변경 */
function getScoreTextClass(score: number) {
  if (score <= 2) return "text-emerald-300";
  if (score <= 4) return "text-lime-300";
  if (score <= 6) return "text-amber-300";
  if (score <= 8) return "text-orange-300";
  return "text-red-400";
}

export function AiSummaryContentBase({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
  layout = "desktop",
}: AiSummaryContentBaseProps) {
  const scoreTextClass = getScoreTextClass(score);
  const widthPercent = Math.max(0, Math.min(100, (score / 10) * 100));

  // Layout 기반 스타일 분기
  const labelClass =
    layout === "mobile"
      ? "text-[12px] dark:text-white/60 light:text-slate-600"
      : "text-[11px] md:text-[13px] dark:text-white/60 light:text-slate-600";

  const valueClass =
    layout === "mobile"
      ? "text-[13px] font-semibold dark:text-slate-50 light:text-slate-900"
      : "text-sm md:text-[15px] font-semibold dark:text-slate-50 light:text-slate-900";

  const spaceClass =
    layout === "mobile" ? "space-y-1.5" : "space-y-2 sm:space-y-2";

  const scoreBarHeight =
    layout === "mobile" ? "h-2 w-24" : "h-2.5 w-full";

  const scoreLabelClass =
    layout === "mobile"
      ? "text-[11px] dark:text-slate-400 light:text-slate-500"
      : "text-[11px] dark:text-slate-400 light:text-slate-500";

  const scoreNumberClass =
    layout === "mobile" ? "text-base" : "text-lg";

  const scoreMarginTop = layout === "mobile" ? "mt-3" : "mt-3";

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* 정보 그리드 */}
      <div className={spaceClass}>
        <div className="flex justify-between items-baseline">
          <span className={labelClass}>평균 김프</span>
          <span className={valueClass}>{avgPremium}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className={labelClass}>최소 김프</span>
          <span className={valueClass}>{minPremium}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className={labelClass}>최대 김프</span>
          <span className={valueClass}>{maxPremium}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className={labelClass}>환율</span>
          <span className={valueClass}>{fxRate}</span>
        </div>
      </div>

      {/* Score 카드 - 게이지바 */}
      <div className={`${scoreMarginTop} flex items-center justify-between`}>
        <div className="flex flex-col flex-1">
          <span className={scoreLabelClass}>KR Premium Score</span>

          <div className={`mt-1.5 ${scoreBarHeight} rounded-full bg-slate-700/80 overflow-hidden`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 transition-all duration-300"
              style={{ width: `${widthPercent}%` }}
            />
          </div>
        </div>

        <span
          className={`${scoreNumberClass} font-semibold ml-3 ${scoreTextClass}`}
        >
          {score}/10
        </span>
      </div>
    </div>
  );
}
