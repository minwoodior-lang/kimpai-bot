// src/components/ai-summary/AiSummaryContentBase.tsx

import React, { ReactNode } from "react";

/**
 * AI 요약 카드 - 공통 콘텐츠 베이스
 * PC/모바일에서 동일한 데이터와 텍스트를 사용
 * layout prop으로만 스타일을 분기
 */

interface AiSummaryContentBaseProps {
  avgPremium: ReactNode;
  maxPremium: ReactNode;
  minPremium: ReactNode;
  fxRate: ReactNode;
  score: number;
  marketSummary?: string;
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
  marketSummary,
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

  // 줄 간격: 모바일은 좀 더 촘촘하게
  const spaceClass =
    layout === "mobile" ? "space-y-1" : "space-y-2 sm:space-y-2";

  // Score 블록 위 여백: 모바일은 살짝 줄임
  const scoreMarginTop = layout === "mobile" ? "mt-2" : "mt-3";

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* 시장 요약 - 모바일에만 표시 */}
      {marketSummary && layout === "mobile" && (
        <div className="mb-1">
          <p className="text-[12px] text-slate-300 leading-tight">
            {marketSummary}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            ※ 변동성·추세·역프는 김프(국내-해외 가격 차이) 기준으로 실시간
            산출됩니다.
          </p>
        </div>
      )}

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
      <div
        className={`${scoreMarginTop} flex items-center justify-between w-full`}
      >
        {/* 게이지 영역 */}
        <div className="flex flex-col flex-1 pr-3">
          <span className="text-[12px] dark:text-slate-400 light:text-slate-500">
            KR Premium Score
          </span>

          <div
            className={`mt-1.5 ${
              layout === "mobile" ? "h-2" : "h-2.5"
            } w-full rounded-full bg-slate-700/80 overflow-hidden`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 transition-all duration-300"
              style={{ width: `${widthPercent}%` }}
            />
          </div>
        </div>

        {/* 점수 숫자 */}
        <span
          className={`${
            layout === "mobile" ? "text-base" : "text-lg"
          } font-semibold text-right flex-shrink-0 ${scoreTextClass}`}
          style={{ minWidth: "42px" }} // 숫자 길이에 따라 튀는거 방지
        >
          {score}/10
        </span>
      </div>
    </div>
  );
}

export default AiSummaryContentBase;
