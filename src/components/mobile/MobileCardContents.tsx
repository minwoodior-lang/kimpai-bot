/**
 * 모바일 탭용 콘텐츠 컴포넌트들
 * 카드 배경/테두리/패딩은 부모에서 처리
 */

interface AiSummaryMobileContentProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
}

export function AiSummaryMobileContent({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
}: AiSummaryMobileContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 제목 */}
      <h2 className="text-[14px] font-semibold dark:text-slate-100 light:text-slate-900 mb-2 flex items-center gap-2">
        <span>📊</span>
        <span>AI 요약</span>
      </h2>

      {/* 정보 그리드 */}
      <div className="space-y-0.5 flex-1">
        <div className="flex justify-between">
          <span className="text-[11px] dark:text-slate-300 light:text-slate-500">평균 김프</span>
          <span className="text-[13px] font-semibold dark:text-slate-50 light:text-slate-900">{avgPremium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] dark:text-slate-300 light:text-slate-500">최소 김프</span>
          <span className="text-[13px] font-semibold dark:text-slate-50 light:text-slate-900">{minPremium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] dark:text-slate-300 light:text-slate-500">최대 김프</span>
          <span className="text-[13px] font-semibold dark:text-slate-50 light:text-slate-900">{maxPremium}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] dark:text-slate-300 light:text-slate-500">환율</span>
          <span className="text-[13px] font-semibold dark:text-slate-50 light:text-slate-900">{fxRate}</span>
        </div>
      </div>

      {/* Score 카드 */}
      <div className="mt-1 py-1 rounded-lg dark:bg-indigo-900/60 light:bg-indigo-100/60 px-2 flex items-center justify-center">
        <div className="text-center w-full">
          <div className="text-[11px] dark:text-slate-300 light:text-indigo-700 mb-1">KR Premium Score</div>
          <div className="text-[16px] font-semibold dark:text-emerald-400 light:text-emerald-600">{score}/10</div>
        </div>
      </div>
    </div>
  );
}

export function ProForecastMobileContent() {
  return (
    <div className="flex flex-col h-full">
      {/* 제목 */}
      <div className="text-xs font-bold dark:text-slate-100 light:text-slate-900 mb-1 flex items-center gap-2">
        <span>🔒</span>
        <span>PRO 예측</span>
      </div>

      {/* 블러 박스 */}
      <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 text-[10px] leading-[1.4] text-white/60 mb-1 flex-1">
        <p className="opacity-20 blur-md text-[10px]">
          대시보드를 과산으로 움침니다.<br />
          내 자산의 리밸런싱 추천과 수익화 전략을 받을 수 있습니다.
        </p>
      </div>

      {/* 안내 텍스트 */}
      <p className="text-white/40 text-[9px] mb-0.5">
        * 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.
      </p>

      {/* 설명 텍스트 */}
      <p className="text-[8px] dark:text-slate-400 light:text-slate-600 mb-1 leading-tight">
        최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
      </p>

      {/* PRO 버튼 */}
      <button className="w-full bg-gradient-to-r from-[#8155FF] to-[#5D3DFF] dark:hover:from-[#7043FF] dark:hover:to-[#4C2FFF] h-7 rounded-lg font-semibold text-white text-[9px] flex items-center justify-center gap-1 transition-all">
        <span>🔒</span>
        <span>전체 보기</span>
      </button>
    </div>
  );
}

export function MyAlertsMobileContent() {
  const isLoggedIn = false; // TODO: Connect to auth

  return (
    <div className="flex flex-col h-full">
      {/* 제목 */}
      <h3 className="text-[14px] font-semibold dark:text-slate-100 light:text-slate-900 mb-2 flex items-center gap-2">
        <span>🔔</span>
        <span>내 알림</span>
      </h3>

      {/* 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center">
        {isLoggedIn ? (
          <div className="space-y-1 w-full">
            <div className="text-[11px] dark:text-slate-300 light:text-slate-700">
              <div className="mb-1">
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 3% 이상 상승 시 알림</span>
              </div>
              <div>
                <span className="text-emerald-400">✓</span>
                <span className="ml-1">김프 급락 구간 경보 예측</span>
              </div>
            </div>
            <button className="w-full mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              + 알림 설정 수정
            </button>
          </div>
        ) : (
          <div className="text-center w-full">
            <p className="text-[13px] dark:text-slate-300 light:text-slate-600 mb-3 text-center">
              로그인하고 알림 설정하기
            </p>
            <button className="w-full rounded-lg dark:bg-indigo-600 light:bg-indigo-600 dark:hover:bg-indigo-700 light:hover:bg-indigo-700 transition-colors px-5 py-1.5 text-[13px] font-semibold text-white">
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
