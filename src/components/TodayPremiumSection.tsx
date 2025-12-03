/**
 * 재구성된 오늘의 AI 김프 요약 섹션
 * - 상단: 요약 + PRO 텍스트 + Score + 버튼
 * - 하단: 설명 문구
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
    <section className="w-full max-w-[1200px] mx-auto mt-6 space-y-2">
      {/* 상단 한 줄: 요약 + PRO 텍스트 + Score + 버튼 */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* 1. 왼쪽: 요약 bullet 영역 */}
        <div className="flex-1 text-xs sm:text-sm dark:text-slate-200 light:text-slate-700 space-y-0.5">
          <div className="font-semibold dark:text-slate-100 light:text-slate-900">오늘의 AI 김프 요약</div>
          <div>• 평균 김프: <span className="text-emerald-400">{avgPremium}</span></div>
          <div>• 최대 김프: {maxPremium}</div>
          <div>• 최소 김프: {minPremium}</div>
          <div>• 환율: {fxRate}</div>
        </div>

        {/* 2. 가운데: PRO 전용 제목 한 줄 (md 이상에서만) */}
        <div className="hidden md:flex flex-[0.9] items-center justify-center text-xs dark:text-slate-300 light:text-slate-600">
          <span className="truncate font-medium">
            🔒 PRO 전용 48시간 김프 예측
          </span>
        </div>

        {/* 3. 오른쪽: Score 카드 + 버튼 */}
        <div className="flex flex-[0.9] flex-col sm:flex-row items-stretch gap-3">
          {/* KR Premium Score 카드 */}
          <div className="flex-1 rounded-xl dark:bg-indigo-900/60 light:bg-indigo-100 px-4 py-3 text-xs dark:text-slate-100 light:text-slate-900 flex flex-col justify-between">
            <div className="text-[11px] dark:text-slate-300 light:text-indigo-700 mb-1">KR Premium Score</div>
            <div className="text-lg font-semibold dark:text-emerald-400 light:text-emerald-600">{score}/10</div>
          </div>

          {/* PRO 분석 버튼 카드 */}
          <button
            className="flex-1 rounded-xl dark:bg-indigo-500 light:bg-indigo-600 dark:hover:bg-indigo-600 light:hover:bg-indigo-700 transition-colors px-4 py-3 text-xs sm:text-sm font-semibold text-white flex items-center justify-center"
          >
            PRO 분석 전체 보기
          </button>
        </div>
      </div>

      {/* 모바일에서만 보이는 PRO 제목 */}
      <div className="md:hidden text-[11px] text-center dark:text-slate-300 light:text-slate-600 font-medium">
        🔒 PRO 전용 48시간 김프 예측
      </div>

      {/* 4. 하단 설명 텍스트 (전체 폭 사용) */}
      <p className="text-[11px] sm:text-xs dark:text-slate-400 light:text-slate-600 leading-relaxed">
        최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
        <span className="hidden sm:inline"> </span>
        <span className="block sm:inline">(PRO 구독 시 전체 내용 확인 가능)</span>
      </p>
    </section>
  );
}

export default TodayPremiumSection;
