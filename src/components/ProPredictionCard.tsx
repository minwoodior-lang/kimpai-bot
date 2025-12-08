/**
 * PRO 전용 48시간 김프 예측 - 중앙 카드
 * ProForecastContentBase 사용하여 PC/모바일 공통 콘텐츠 표시
 */

import { ProForecastContentBase } from "./ai-summary/ProForecastContentBase";

interface ProPredictionCardProps {
  compact?: boolean;
}

export function ProPredictionCard({ compact = false }: ProPredictionCardProps) {
  return (
    <div
      className={`rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40
      dark:bg-slate-900/40 light:bg-slate-100/30
      ${compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4"}
      h-full flex flex-col`}
    >
      {/* 타이틀 */}
      <div
        className={`${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}
        font-bold dark:text-slate-100 light:text-slate-900
        ${compact ? "mb-1.5" : "mb-2"} flex items-center gap-2`}
      >
        <span>🔒</span>
        <span>{compact ? "PRO 예측" : "PRO 전용 48시간 김프 예측"}</span>
      </div>

      {/* 공통 콘텐츠 - 블러 처리된 상단 박스 */}
      <div className="flex-1 flex flex-col">
        <ProForecastContentBase />

        {/* 안내 텍스트 - 또렷하게 보이는 영역 */}
        <p
          className={`text-white/40 ${
            compact ? "text-[10px] mt-2 mb-1" : "text-[11px] mt-3 mb-2"
          }`}
        >
          * 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.
        </p>

        {/* 설명 텍스트 */}
        <p
          className={`dark:text-slate-400 light:text-slate-600 leading-snug ${
            compact ? "text-[9px] sm:text-[10px] mb-1.5" : "text-[10px] sm:text-xs mb-2"
          }`}
        >
          최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
        </p>
      </div>
    </div>
  );
}

export default ProPredictionCard;
