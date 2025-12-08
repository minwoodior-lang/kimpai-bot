/**
 * PRO 예측 - 공통 콘텐츠
 * PC/모바일에서 동일한 텍스트 및 블러 처리 사용
 */

export function ProForecastContentBase() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900/70 border border-slate-700/70 px-3 py-2.5 md:px-4 md:py-3">
      {/* 블러 오버레이 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900/90 backdrop-blur-[2px]" />

      <div className="relative space-y-1.5 text-[11px] md:text-xs text-slate-200 leading-relaxed">
        <p>
          향후 48시간 내, 김프 2% 이상 급변 구간이 3회 이상 발생할 가능성이
          높습니다.
        </p>
        <p>
          최근 패턴 기준, 새벽 시간대(02~05시)에 변동성이 집중되는 경향이
          관측됩니다.
        </p>
        <p>
          과거 유사 구간에서 평균 최대 김프 스파이크는 +4.3% 수준이었습니다.
        </p>
      </div>

      <div className="relative mt-2 md:mt-3 flex justify-center">
        <button className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:from-violet-600 hover:to-fuchsia-600 transition">
          PRO 분석 전체 보기
        </button>
      </div>
    </div>
  );
}
