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
      <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-5">
        <div className="flex flex-col gap-3 lg:gap-4 lg:flex-row lg:items-start">
          {/* 왼쪽: 요약 텍스트 */}
          <div className="flex-1 space-y-0.5 text-[11px] lg:text-[12px] leading-snug dark:text-slate-200 light:text-slate-700">
            <p className="font-semibold text-[12px] lg:text-[13px] dark:text-slate-100 light:text-slate-900">오늘의 AI 김프 요약</p>
            <p>• 평균 김프: {avgPremium}</p>
            <p>• 최대 김프: {maxPremium}</p>
            <p>• 최소 김프: {minPremium}</p>
            <p>• 환율: {fxRate}</p>
          </div>

          {/* 오른쪽: PRO 배너 + Score + 버튼 + 설명 */}
          <div className="flex-1 flex flex-col gap-2">
            {/* 상단: PRO 배너 + Score + 버튼 나란히 */}
            <div className="flex gap-2">
              {/* PRO 배너 */}
              <div className="flex-1 flex items-center justify-between rounded-lg dark:bg-slate-900/60 light:bg-slate-100 px-3 py-2.5 text-xs dark:text-slate-300 light:text-slate-700">
                <span className="font-semibold whitespace-nowrap">🔒 PRO 전용 48시간 김프 예측</span>
                <span className="text-[11px] dark:text-slate-500 light:text-slate-500 line-clamp-1 ml-2 opacity-60">
                  데이터 미리보기...
                </span>
              </div>

              {/* Score 카드 */}
              <div className="flex-1 flex flex-col justify-center rounded-lg dark:bg-indigo-900/60 light:bg-indigo-100 px-3 py-2.5">
                <span className="text-[10px] lg:text-[11px] dark:text-slate-300 light:text-indigo-700">KR Premium Score</span>
                <span className="text-lg lg:text-xl font-semibold dark:text-emerald-400 light:text-emerald-600">
                  {score}/10
                </span>
              </div>

              {/* PRO 버튼 */}
              <button className="flex-1 rounded-lg dark:bg-indigo-500 light:bg-indigo-600 px-3 py-2.5 text-[11px] lg:text-[12px] font-semibold dark:text-white light:text-white hover:dark:bg-indigo-600 hover:light:bg-indigo-700 transition-colors flex items-center justify-center whitespace-nowrap">
                PRO 분석 전체 보기
              </button>
            </div>

            {/* 하단: 설명 문장 */}
            <p className="text-[10px] lg:text-[11px] dark:text-slate-400 light:text-slate-600">
              최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다. (PRO 구독 시 전체 내용 확인 가능)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TodayPremiumSection;
