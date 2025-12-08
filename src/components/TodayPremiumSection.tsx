/**
 * 오늘의 AI 김프 요약 - 좌측 카드
 * AiSummaryContentBase와 통합하여 PC/모바일 동기화
 */

import { AiSummaryContentBase } from "@/components/ai-summary/AiSummaryContentBase";

interface TodayPremiumSectionProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
  marketSummary?: string;
  compact?: boolean;
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

      {/* 공통 콘텐츠 베이스 - desktop 레이아웃 */}
      <AiSummaryContentBase
        avgPremium={avgPremium}
        maxPremium={maxPremium}
        minPremium={minPremium}
        fxRate={fxRate}
        score={score}
        layout="desktop"
        marketSummary={marketSummary}
      />
    </div>
  );
}

export default TodayPremiumSection;
