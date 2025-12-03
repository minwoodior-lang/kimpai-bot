/**
 * 오늘의 AI 김프 요약 - 통합 카드 (최종 레이아웃)
 * 좌측: 정보 그리드 / 우측: PRO 예측 설명 (미러 효과)
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
  // 현재시간 (오전/오후 HH:MM)
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = now.getHours() < 12 ? "오전" : "오후";
    const displayHours = String(now.getHours() % 12 || 12).padStart(2, "0");
    return `${ampm} ${displayHours}:${minutes}`;
  };

  return (
    <section className="w-full max-w-[1200px] mx-auto mt-6">
      {/* 통합 카드 컨테이너 */}
      <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-4 sm:p-5">
        {/* 헤더: 제목 + 현재시간 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900 flex items-center gap-2">
            <span>📊</span>
            <span>오늘의 AI 김프 요약</span>
          </h2>
          <div className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600 font-medium">
            {getCurrentTime()} 기준
          </div>
        </div>

        {/* 메인 콘텐츠: 좌측 정보 + 우측 설명 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-4">
          {/* 좌측: 정보 그리드 */}
          <div className="md:col-span-1 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">평균 김프</span>
              <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{avgPremium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최소 김프</span>
              <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{minPremium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최대 김프</span>
              <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{maxPremium}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">환율</span>
              <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{fxRate}</span>
            </div>
          </div>

          {/* 우측: PRO 예측 설명 (미러 효과) */}
          <div className="md:col-span-2 border-l dark:border-slate-700/40 light:border-slate-300/30 pl-4 flex flex-col">
            {/* PRO 예측 설명 (미러/반투명 처리) */}
            <div className="flex-1">
              <div className="text-[11px] sm:text-xs font-semibold dark:text-slate-100 light:text-slate-900 mb-2">
                🔒 PRO 전용 48시간 김프 예측
              </div>
              {/* 미러 효과 텍스트 - 반투명하고 흐릿하게 */}
              <div className="p-2.5 rounded-lg dark:bg-slate-800/30 light:bg-slate-200/20 mb-2 backdrop-blur-sm">
                <p className="text-[8px] sm:text-[9px] dark:text-slate-500 light:text-slate-500 leading-relaxed opacity-70 font-medium">
                  최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
                  <span className="block dark:text-slate-600 light:text-slate-600 text-[7px] sm:text-[8px] mt-1">
                    (PRO 구독 시 전체 내용 확인 가능)
                  </span>
                </p>
              </div>
            </div>

            {/* 내 알림 */}
            <div className="text-[9px] sm:text-[10px] dark:text-slate-500 light:text-slate-500 mt-1">
              내 알림
            </div>
          </div>
        </div>

        {/* 하단: Score 카드 + PRO 버튼 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch pt-3 border-t dark:border-slate-700/40 light:border-slate-300/30">
          {/* Score 카드 */}
          <div className="flex-1 rounded-lg dark:bg-indigo-900/60 light:bg-indigo-100/60 px-3 py-2 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] sm:text-xs dark:text-slate-300 light:text-indigo-700 mb-1">KR Premium Score</div>
              <div className="text-lg sm:text-xl font-bold dark:text-emerald-400 light:text-emerald-600">{score}/10</div>
            </div>
          </div>

          {/* PRO 버튼 */}
          <button className="flex-1 rounded-lg dark:bg-indigo-600 light:bg-indigo-600 dark:hover:bg-indigo-700 light:hover:bg-indigo-700 transition-colors px-3 py-2 text-[10px] sm:text-xs font-semibold text-white flex items-center justify-center gap-1.5 whitespace-nowrap">
            <span>🔒</span>
            <span>PRO 분석 전체 보기</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default TodayPremiumSection;
