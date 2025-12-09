/**
 * 모바일 탭용 콘텐츠 컴포넌트들
 * 카드 배경/테두리/패딩은 부모에서 처리
 */

import { AiSummaryContentBase } from "@/components/ai-summary/AiSummaryContentBase";

interface AiSummaryMobileContentProps {
  avgPremium: React.ReactNode;
  maxPremium: React.ReactNode;
  minPremium: React.ReactNode;
  fxRate: React.ReactNode;
  score: number;
  marketSummary?: string;
}

export function AiSummaryMobileContent({
  avgPremium,
  maxPremium,
  minPremium,
  fxRate,
  score,
  marketSummary,
}: AiSummaryMobileContentProps) {
  return (
    <div className="flex flex-col h-full min-h-[210px]">
      {/* 제목 */}
      <h2 className="text-[14px] font-semibold dark:text-slate-100 light:text-slate-900 mb-2 flex items-center gap-2">
        <span>📊</span>
        <span>오늘의 AI 김프 요약</span>
      </h2>

      {/* 공통 콘텐츠 베이스 - mobile 레이아웃 */}
      <div className="mt-1">
        <AiSummaryContentBase
          avgPremium={avgPremium}
          maxPremium={maxPremium}
          minPremium={minPremium}
          fxRate={fxRate}
          score={score}
          layout="mobile"
          marketSummary={marketSummary}
        />
      </div>
    </div>
  );
}

export function ProForecastMobileContent() {
  return (
    <div className="flex flex-col h-full min-h-[210px]">
      {/* 제목 */}
      <div className="text-[14px] font-bold dark:text-slate-100 light:text-slate-900 mb-2 flex items-center gap-2">
        <span>🔒</span>
        <span>PRO 전용 48시간 김프 예측</span>
      </div>

      {/* 블러 박스 */}
      <div className="relative w-full rounded-xl border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 px-3 py-3 min-h-[80px] overflow-hidden flex-1 mb-3">
        {/* 실제 예측 텍스트 - 희미하게 보이도록 blur + 살짝 어둡게 */}
        <div className="pointer-events-none select-none text-[11px] leading-relaxed text-slate-100/85 blur-[1.4px]">
          <p>
            • 향후 48시간 내, 김프 2% 이상 급변 구간이 3회 이상 발생할 가능성이 높습니다.
          </p>
          <p className="mt-1.5">
            • 최근 패턴 기준, 새벽 시간대(02~05시)에 변동성이 집중되는 경향이 관측됩니다.
          </p>
          <p className="mt-1.5">
            • 과거 유사 구간에서 평균 최대 김프 스파이크는 +4.3% 수준이었습니다.
          </p>
        </div>

        {/* 아주 옅은 오버레이로 모자이크 느낌 보강 */}
        <div className="pointer-events-none absolute inset-0 bg-slate-900/18" />
      </div>

      {/* 안내 텍스트 */}
      <p className="text-white/40 text-[10px] mb-1.5">
        * 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.
      </p>

      {/* 설명 텍스트 */}
      <p className="text-[11px] dark:text-slate-400 light:text-slate-600 mb-2 leading-snug">
        최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
      </p>

      {/* PRO 버튼 */}
      <button className="mt-auto w-full bg-gradient-to-r from-[#8155FF] to-[#5D3DFF] dark:hover:from-[#7043FF] dark:hover:to-[#4C2FFF] h-9 rounded-lg font-semibold text-white text-[11px] flex items-center justify-center gap-1 transition-all">
        <span>🔒</span>
        <span>전체 보기</span>
      </button>
    </div>
  );
}

export function MyAlertsMobileContent() {
  const TELEGRAM_FREE_SIGNAL_URL = "https://t.me/kimp_ai";

  return (
    <div className="space-y-3">
      {/* 타이틀 */}
      <div className="text-sm font-semibold text-slate-100">
        📡 실시간 시그널 채널
      </div>

      {/* 본문 */}
      <p className="text-xs text-slate-300 leading-relaxed">
        Binance 고래 매매 · 거래량 폭발 · BTC/ETH 김프 급변만 실시간 발송.
      </p>

      {/* 버튼 */}
      <a
        href={TELEGRAM_FREE_SIGNAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-semibold text-white py-2"
      >
        {/* 텔레그램 로고 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-4 h-4"
        >
          <path d="M9.04 15.34 8.9 18.5c.32 0 .46-.14.63-.31l1.5-1.43 3.11 2.28c.57.32.98.15 1.13-.53l2.05-9.62c.19-.81-.31-1.13-.86-.93L3.9 10.27c-.8.31-.79.76-.14.96l3.9 1.22 9.05-5.7c.43-.28.82-.13.5.15l-7.27 6.67Z" />
        </svg>
        텔레그램 채널 열기
      </a>
    </div>
  );
}
