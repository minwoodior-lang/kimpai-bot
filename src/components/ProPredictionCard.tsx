/**
 * PRO 전용 48시간 김프 예측 - 중앙 카드
 * 좌/우 카드와 동일한 색상
 */

export function ProPredictionCard() {
  return (
    <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-4 sm:p-5 h-full flex flex-col">
      {/* 타이틀 */}
      <div className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900 mb-4 flex items-center gap-2">
        <span>🔒</span>
        <span>PRO 전용 48시간 김프 예측</span>
      </div>

      {/* 블러 처리된 설명 텍스트 박스 - 전체 설명 포함 */}
      <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-[18px] py-[14px] space-y-2 text-[13px] leading-[1.45] text-white/60 flex-1 mb-1">
        <p className="opacity-10 blur-sm">
          최근 30일 기준, 이 예측은 김프 2% 이상 급변<br />
          구간의 90% 이상을 사전에 포착했습니다.
        </p>
        <p className="text-white/40 text-[12px] opacity-10 blur-sm">
          * 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.
        </p>
      </div>

      {/* PRO 버튼 */}
      <button
        className="w-full bg-gradient-to-r from-[#8155FF] to-[#5D3DFF] dark:hover:from-[#7043FF] dark:hover:to-[#4C2FFF] light:hover:from-[#7043FF] light:hover:to-[#4C2FFF] transition-all h-10 rounded-lg font-semibold text-white text-xs sm:text-sm flex items-center justify-center gap-1.5 mt-4"
      >
        <span>🔒</span>
        <span>PRO 분석 전체 보기</span>
      </button>
    </div>
  );
}

export default ProPredictionCard;
