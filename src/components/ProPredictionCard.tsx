/**
 * PRO 전용 48시간 김프 예측 - 중앙 카드
 * 안쪽 예측 문구는 희미하게 보이지만 읽기 어렵게 블러 처리
 */

import Link from "next/link";

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

      {/* 블러 처리된 상단 박스 */}
      <div className="flex-1 flex flex-col">
        <div
          className={`relative w-full rounded-xl border border-white/10
          bg-gradient-to-b from-slate-800/90 to-slate-900/95
          ${compact ? "px-3 py-2 min-h-[70px]" : "px-[14px] py-[12px] min-h-[80px]"}
          overflow-hidden`}
        >
          {/* 실제 예측 텍스트 - 희미하게 보이도록 blur + 살짝 어둡게 */}
          <div className="pointer-events-none select-none text-[11px] sm:text-xs leading-relaxed text-slate-100/85 blur-[1.4px]">
            <p>
              • 향후 48시간 내, 김프 2% 이상 급변 구간이 3회 이상 발생할 가능성이 높습니다.
            </p>
            <p className="mt-1.5">
              • 최근 패턴 기준, 새벽 시간대(02~05시)에 변동성이 집중되는 경향이 관측됩니다.
            </p>
            <p className="mt-1.5">
              • 과거 유사 구간에서 평균 최대 김프 스파이크는 +4.3% 수준이었습니다.
            </p>
          </div>

          {/* 아주 옅은 오버레이로 모자이크 느낌 보강 */}
          <div className="pointer-events-none absolute inset-0 bg-slate-900/18" />
        </div>

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

        {/* PRO 버튼 */}
        <Link href="/pro" className="block mt-auto">
          <button
            className={`w-full bg-gradient-to-r from-[#8155FF] to-[#5D3DFF]
            dark:hover:from-[#7043FF] dark:hover:to-[#4C2FFF]
            light:hover:from-[#7043FF] light:hover:to-[#4C2FFF]
            transition-all ${compact ? "h-8 rounded-lg" : "h-10 rounded-lg"}
            font-semibold text-white ${
              compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"
            } flex items-center justify-center gap-1`}
          >
            <span>🔒</span>
            <span>{compact ? "전체 보기" : "PRO 분석 전체 보기"}</span>
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ProPredictionCard;
