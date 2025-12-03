/**
 * PC/모바일 반응형 요약 섹션
 * - PC: 좌측 텍스트 flex-1 + 우측 Score/PRO/자물쇠 flex-[1.1]
 * - 모바일: 세로 스택 (기본 flex-col)
 */

interface TodayPremiumSectionProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
}

export function TodayPremiumSection({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
}: TodayPremiumSectionProps) {
  return (
    <section className="mt-3 mb-4 lg:mt-4 lg:mb-6">
      <div className="max-w-[1200px] mx-auto px-3 lg:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
          {/* 왼쪽: 요약 텍스트 */}
          <div className="flex-1 space-y-1 text-[11px] lg:text-[12px] leading-relaxed text-slate-200">
            <p className="font-semibold text-[12px] lg:text-[13px]">오늘의 AI 김프 요약</p>
            <p>• 평균 김프: {avgPremium}</p>
            <p>• 최대 김프: {maxPremium}</p>
            <p>• 최소 김프: {minPremium}</p>
            <p>• 환율: {fxRate}</p>
          </div>

          {/* 오른쪽: Score + 버튼 + 자물쇠 카드 */}
          <div className="flex-1 lg:flex-[1.1] flex flex-col gap-3">
            {/* 상단: Score + 버튼 나란히 */}
            <div className="flex gap-3">
              <div className="flex flex-col justify-between rounded-xl bg-indigo-600/20 px-3 lg:px-4 py-2 lg:py-3 min-w-[120px] lg:min-w-[140px]">
                <span className="text-[10px] lg:text-[11px] text-slate-300">KR Premium Score</span>
                <span className="text-lg lg:text-xl font-semibold text-indigo-300">
                  {score}/10
                </span>
              </div>

              <button className="flex-1 rounded-xl bg-indigo-500 px-3 lg:px-4 py-2 lg:py-3 text-[11px] lg:text-[13px] font-semibold text-white hover:bg-indigo-600 transition-colors flex items-center justify-center">
                PRO 분석 전체 보기
              </button>
            </div>

            {/* 하단: 자물쇠 카드 */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 px-3 lg:px-4 py-2 lg:py-3">
              <p className="mb-1 text-[10px] lg:text-[12px] font-semibold text-slate-200 flex items-center gap-1">
                <span>🔒</span>
                <span>PRO 전용 48시간 김프 예측</span>
              </p>
              <p className="mb-2 text-[9px] lg:text-[11px] text-slate-500 line-clamp-2 blur-[1px]">
                (PRO 전용 예측 문구가 여기에 들어갑니다. 비로그인 사용자는
                블러 처리 상태로 노출됩니다.)
              </p>
              <p className="text-[9px] leading-snug text-slate-500">
                최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을
                사전에 포착했습니다. (PRO 구독 시 전체 내용 확인 가능)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TodayPremiumSection;
