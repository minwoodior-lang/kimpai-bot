/**
 * 오늘의 AI 김프 요약 - 통합 카드
 * 모든 정보, 드롭다운, 버튼을 한 카드에 통합
 */

interface TodayPremiumSectionProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
  selectedIndicator: string;
  onIndicatorChange: (indicator: string) => void;
}

export function TodayPremiumSection({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
  selectedIndicator,
  onIndicatorChange,
}: TodayPremiumSectionProps) {
  return (
    <section className="w-full max-w-[1200px] mx-auto mt-6">
      {/* 통합 카드 컨테이너 */}
      <div className="rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 p-4 sm:p-5">
        {/* 제목 */}
        <h2 className="text-sm sm:text-base font-bold dark:text-slate-100 light:text-slate-900 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>오늘의 AI 김프 요약</span>
        </h2>

        {/* 상단: 정보 그리드 + Score 버튼 (반응형) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">평균 김프</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{avgPremium}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최대 김프</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{maxPremium}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">최소 김프</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{minPremium}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs dark:text-slate-400 light:text-slate-600">환율</span>
            <span className="text-xs sm:text-sm font-semibold dark:text-slate-100 light:text-slate-900">{fxRate}</span>
          </div>
        </div>

        {/* 중간: Score + PRO 버튼 (가로 배치) */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 items-stretch">
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
            <span>PRO 전용 48시간</span>
          </button>
        </div>

        {/* 하단: 설명 + 드롭다운 */}
        <div className="border-t dark:border-slate-700/40 light:border-slate-300/30 pt-3">
          <p className="text-[9px] sm:text-[10px] dark:text-slate-400 light:text-slate-600 mb-2 leading-relaxed">
            최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
            <span className="ml-1 dark:text-slate-500 light:text-slate-500">(PRO 구독 시 전체 내용 확인 가능)</span>
          </p>

          {/* 차트 지표 선택 드롭다운 */}
          <select
            value={selectedIndicator}
            onChange={(e) => onIndicatorChange(e.target.value)}
            className="w-full rounded-lg dark:bg-slate-700 light:bg-slate-200 dark:text-white light:text-slate-900 px-3 py-2 text-[10px] sm:text-xs border dark:border-slate-600 light:border-slate-300 dark:focus:border-blue-500 light:focus:border-blue-400 focus:outline-none"
          >
            <optgroup label="BTC / Premium">
              <option value="BINANCE_BTC">BTC Binance</option>
              <option value="UPBIT_BTC_KRW_PREMIUM">BTC 김치프리미엄 (Upbit)</option>
              <option value="BITHUMB_BTC_KRW_PREMIUM">BTC 김치프리미엄 (Bithumb)</option>
            </optgroup>
            <optgroup label="Market Index">
              <option value="TOTAL_MARKET_CAP">TOTAL Market Cap</option>
              <option value="TOTAL2_INDEX">TOTAL2</option>
            </optgroup>
          </select>
        </div>
      </div>
    </section>
  );
}

export default TodayPremiumSection;
