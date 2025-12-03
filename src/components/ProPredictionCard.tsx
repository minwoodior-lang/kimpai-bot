/**
 * PRO 전용 48시간 김프 예측 - 중앙 카드
 * AI 분석 페이지와 동일한 스타일
 */

export function ProPredictionCard() {
  return (
    <div className="rounded-2xl border dark:border-red-500/40 light:border-red-400/40 dark:bg-slate-900/50 light:bg-slate-100/40 p-4 sm:p-5 h-full flex flex-col backdrop-blur-sm">
      {/* 제목 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔒</span>
        <h3 className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900">PRO 전용 48시간 김프 예측</h3>
      </div>

      {/* 미러 처리된 텍스트 영역 */}
      <div className="flex-1 mb-4 p-3 rounded-lg dark:bg-slate-800/20 light:bg-slate-200/15 backdrop-blur-sm">
        <p className="text-[8px] sm:text-[9px] dark:text-slate-700 light:text-slate-700 leading-relaxed opacity-30 blur-xs font-medium">
          최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
          <span className="block mt-2">
            내 자산의 리밸런싱 추천과 수익화 전략을 받을 수 있습니다.
          </span>
        </p>
      </div>

      {/* PRO 버튼 */}
      <button className="w-full rounded-lg dark:bg-indigo-600 light:bg-indigo-600 dark:hover:bg-indigo-700 light:hover:bg-indigo-700 transition-colors px-3 py-2.5 text-[11px] sm:text-xs font-semibold text-white flex items-center justify-center gap-1.5">
        <span>🔒</span>
        <span>PRO 분석 전체 보기</span>
      </button>
    </div>
  );
}

export default ProPredictionCard;
