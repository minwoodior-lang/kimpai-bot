/**
 * PRO 전용 48시간 김프 예측 - 중앙 카드
 * 좌/우 카드와 동일한 색상
 */

interface ProPredictionCardProps {
  compact?: boolean;
}

export function ProPredictionCard({ compact = false }: ProPredictionCardProps) {
  return (
    <div className={`rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 ${compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'} h-full flex flex-col`}>
      {/* 타이틀 */}
      <div className={`${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-bold dark:text-slate-100 light:text-slate-900 ${compact ? 'mb-1.5' : 'mb-2'} flex items-center gap-2`}>
        <span>🔒</span>
        <span>{compact ? 'PRO 예측' : 'PRO 전용 48시간 김프 예측'}</span>
      </div>

      {/* 블러 처리된 상단 박스 - 텍스트 가려질 정도 블러 */}
      <div className={`w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl ${compact ? 'px-3 py-2 text-[11px]' : 'px-[14px] py-[12px] text-[13px]'} leading-[1.5] text-white/60 ${compact ? 'mb-1.5' : 'mb-2'} flex-1`}>
        <p className="opacity-20 blur-md">
          대시보드를 과산으로 움침니다.<br />
          내 자산의 리밸런싱 추천과 수익화 전략을 받을 수 있습니다.
        </p>
      </div>

      {/* 안내 텍스트 - 보임 */}
      <p className={`text-white/40 ${compact ? 'text-[10px] mb-1' : 'text-[11px] mb-2'}`}>
        * 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.
      </p>

      {/* 설명 텍스트 */}
      <p className={`${compact ? 'text-[9px] sm:text-[10px] mb-1.5' : 'text-[10px] sm:text-xs mb-2'} dark:text-slate-400 light:text-slate-600 leading-snug`}>
        최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
      </p>

      {/* PRO 버튼 */}
      <button
        className={`w-full bg-gradient-to-r from-[#8155FF] to-[#5D3DFF] dark:hover:from-[#7043FF] dark:hover:to-[#4C2FFF] light:hover:from-[#7043FF] light:hover:to-[#4C2FFF] transition-all ${compact ? 'h-8 rounded-lg' : 'h-10 rounded-lg'} font-semibold text-white ${compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'} flex items-center justify-center gap-1`}
      >
        <span>🔒</span>
        <span>{compact ? '전체 보기' : 'PRO 분석 전체 보기'}</span>
      </button>
    </div>
  );
}

export default ProPredictionCard;
