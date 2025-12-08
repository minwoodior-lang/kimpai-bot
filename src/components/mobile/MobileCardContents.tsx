/**
 * 모바일 탭용 콘텐츠 컴포넌트들
 * 카드 배경/테두리/패딩은 부모에서 처리
 */

import { AiSummaryContentBase } from "@/components/ai-summary/AiSummaryContentBase";
import { ProForecastContentBase } from "@/components/ai-summary/ProForecastContentBase";

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

      {/* 공통 콘텐츠 베이스 - mobile 레이아웃 */}
      <AiSummaryContentBase
        avgPremium={avgPremium}
        maxPremium={maxPremium}
        minPremium={minPremium}
        fxRate={fxRate}
        score={score}
        layout="mobile"
      />
    </div>
  );
}

export function ProForecastMobileContent() {
  return (
    <div className="flex flex-col h-full">
      {/* 제목 */}
      <div className="text-[13px] font-bold dark:text-slate-100 light:text-slate-900 mb-1.5 flex items-center gap-2">
        <span>🔒</span>
        <span>PRO 전용 48시간 김프 예측</span>
      </div>

      {/* 공통 콘텐츠 - 블러 박스 */}
      <div className="flex-1 mb-2">
        <ProForecastContentBase />
      </div>

      {/* 안내 텍스트 */}
      <p className="text-white/40 text-[10px] mb-1">
        * 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.
      </p>

      {/* 설명 텍스트 */}
      <p className="text-[10px] dark:text-slate-400 light:text-slate-600 mb-1.5 leading-snug">
        최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
      </p>
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
            <p className="text-[13px] md:text-sm dark:text-slate-400 light:text-slate-600 mb-2.5 leading-relaxed">
              로그인하고 알림 설정하기
            </p>
            <button
              type="button"
              className="mt-2 text-[13px] md:text-sm text-indigo-300 underline underline-offset-4 hover:text-indigo-200 transition cursor-pointer font-semibold"
            >
              로그인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
