import Head from "next/head";
import Layout from "@/components/Layout";
import HomeLayout from "@/components/layout/HomeLayout";
import TodayPremiumSection from "@/components/TodayPremiumSection";
import ProPredictionCard from "@/components/ProPredictionCard";
import MyAlertsCard from "@/components/MyAlertsCard";
import ChatFloatingButton from "@/components/chat/ChatFloatingButton";
import ChatPanel from "@/components/chat/ChatPanel";
import ChatUI from "@/components/ChatUI";
import { AiSummaryMobileContent, ProForecastMobileContent, MyAlertsMobileContent } from "@/components/mobile/MobileCardContents";
import UserPrefsPanel from "@/components/settings/UserPrefsPanel";
import IndicatorSelector from "@/components/IndicatorSelector";
import { useUserPrefs } from "@/hooks/useUserPrefs";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";

const PremiumTable = dynamic(
  () => import("@/components/PremiumTable"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-slate-800/50 rounded-xl flex items-center justify-center">
        <div className="text-slate-400">테이블 로딩 중...</div>
      </div>
    ),
  }
);

const TradingViewChartDynamic = dynamic(() => import("@/components/charts/TradingViewChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] bg-slate-900/50 animate-pulse rounded-xl flex items-center justify-center">
      <div className="text-slate-400">차트 로딩 중...</div>
    </div>
  ),
});

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] = useState("BINANCE_USDT");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileCardTab, setMobileCardTab] = useState<"ai" | "pro" | "alerts">("ai");
  const [isPrefsPanelOpen, setIsPrefsPanelOpen] = useState(false);
  const { prefs, setPrefs, isLoaded } = useUserPrefs();
  const { data, averagePremium, fxRate } = useMarkets();

  const listedData = data.filter(item => item.premium !== null);
  
  // 필터링 적용 (리스트 필터)
  let filteredData = [...listedData];
  if (isLoaded && prefs.filterMode === "foreign") {
    // 해외 거래소에 상장된 코인만 (binancePrice가 있는 경우)
    filteredData = filteredData.filter(item => item.binancePrice !== null && item.binancePrice > 0);
  } else if (isLoaded && prefs.filterMode === "favorites") {
    // 즐겨찾기한 코인만
    const favoritesSet = new Set(prefs.favorites || []);
    filteredData = filteredData.filter(item => {
      const normalizedSymbol = item.symbol.replace("/KRW", "").replace("/USDT", "").replace("/BTC", "").toUpperCase();
      return favoritesSet.has(normalizedSymbol);
    });
  }
  
  const maxPremium = filteredData.length > 0 
    ? filteredData.reduce((max, item) => 
        (item.premium || 0) > (max.premium || 0) ? item : max, filteredData[0])
    : null;
  const minPremium = filteredData.length > 0
    ? filteredData.reduce((min, item) => 
        (item.premium || 0) < (min.premium || 0) ? item : min, filteredData[0])
    : null;

  const formatPremium = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const calculateRiskScore = () => {
    const absAvg = Math.abs(averagePremium || 0);
    if (absAvg >= 8) return 10;
    if (absAvg >= 6) return 8;
    if (absAvg >= 4) return 6;
    if (absAvg >= 2) return 4;
    return 2;
  };

  const riskScore = calculateRiskScore();
  const safeAvgPremium = averagePremium || 0;

  return (
    <Layout>
      <Head>
        <title>KimpAI - 실시간 김프 & AI 분석</title>
        <meta
          name="description"
          content="코인 김프 실시간 확인, AI 시장 분석, 자동 가격/김프 알림 서비스. 무료로 BTC·ETH·XRP·SOL 실시간 김치프리미엄 데이터를 확인하세요."
        />
      </Head>

      {/* 채팅 버튼과 패널 */}
      <ChatFloatingButton 
        isOpen={isChatOpen} 
        onClick={() => setIsChatOpen(true)} 
      />
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
      >
        {({ showNicknameEdit, onToggleNicknameEdit }: { showNicknameEdit: boolean; onToggleNicknameEdit: () => void }) => (
          <ChatUI showNicknameEdit={showNicknameEdit} onToggleNicknameEdit={onToggleNicknameEdit} />
        )}
      </ChatPanel>

      {/* 메인 콘텐츠 */}
      <HomeLayout>
        <div className="w-full mx-auto max-w-[1200px] px-4 lg:px-5 py-6">
          {/* PC: 상단 3컬럼 레이아웃 */}
          <div className="hidden md:grid grid-cols-3 gap-4 mb-5">
            {/* 좌측: 오늘의 AI 김프 요약 */}
            <TodayPremiumSection
              avgPremium={
                <span className={safeAvgPremium >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {formatPremium(safeAvgPremium)}
                </span>
              }
              maxPremium={
                maxPremium ? (
                  <span className="text-green-400 font-bold">
                    {formatPremium(maxPremium.premium)} ({maxPremium.symbol.replace("/KRW", "")})
                  </span>
                ) : (
                  "-"
                )
              }
              minPremium={
                minPremium ? (
                  <span className={minPremium.premium && minPremium.premium < 0 ? "text-red-400 font-bold" : "text-slate-300 font-bold"}>
                    {formatPremium(minPremium.premium)} ({minPremium.symbol.replace("/KRW", "")})
                  </span>
                ) : (
                  "-"
                )
              }
              fxRate={<span className="text-white font-bold">₩{(fxRate || 0).toLocaleString()}/USDT</span>}
              score={riskScore}
            />

            {/* 중앙: PRO 예측 카드 */}
            <ProPredictionCard />

            {/* 우측: 내 알림 카드 */}
            <MyAlertsCard />
          </div>

          {/* 모바일: 탭 구조 */}
          <div className="md:hidden mb-5">
            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setMobileCardTab("ai")}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-colors ${
                  mobileCardTab === "ai"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                📊 AI 요약
              </button>
              <button
                onClick={() => setMobileCardTab("pro")}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-colors ${
                  mobileCardTab === "pro"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🔒 PRO 예측
              </button>
              <button
                onClick={() => setMobileCardTab("alerts")}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-colors ${
                  mobileCardTab === "alerts"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🔔 내 알림
              </button>
            </div>

            {/* 공통 카드 껍데기 - 고정 높이 */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-2 h-[180px] flex flex-col">
              {mobileCardTab === "ai" && (
                <AiSummaryMobileContent
                  avgPremium={
                    <span className={safeAvgPremium >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {formatPremium(safeAvgPremium)}
                    </span>
                  }
                  maxPremium={
                    maxPremium ? (
                      <span className="text-green-400 font-bold">
                        {formatPremium(maxPremium.premium)} ({maxPremium.symbol.replace("/KRW", "")})
                      </span>
                    ) : (
                      "-"
                    )
                  }
                  minPremium={
                    minPremium ? (
                      <span className={minPremium.premium && minPremium.premium < 0 ? "text-red-400 font-bold" : "text-slate-300 font-bold"}>
                        {formatPremium(minPremium.premium)} ({minPremium.symbol.replace("/KRW", "")})
                      </span>
                    ) : (
                      "-"
                    )
                  }
                  fxRate={<span className="text-white font-bold">₩{(fxRate || 0).toLocaleString()}/USDT</span>}
                  score={riskScore}
                />
              )}
              {mobileCardTab === "pro" && <ProForecastMobileContent />}
              {mobileCardTab === "alerts" && <MyAlertsMobileContent />}
            </div>
          </div>

          {/* 차트 헤더: 프리미엄 차트 라벨 + 개인화 설정 + 지표 선택 */}
          <div className="mt-3 mb-3 flex flex-wrap items-center justify-between gap-3">
            {/* 왼쪽: 라벨 */}
            <h3 className="text-sm font-medium text-slate-200">
              프리미엄 차트
            </h3>

            {/* 오른쪽: 버튼 그룹 */}
            <div className="flex items-center gap-2">
              {/* 개인화 설정 버튼 */}
              <button
                onClick={() => setIsPrefsPanelOpen(true)}
                className="inline-flex items-center rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 transition"
              >
                <span className="mr-1.5">⚙</span>
                <span>개인화 설정</span>
              </button>

              {/* 지표 선택 드롭다운 */}
              <IndicatorSelector
                selectedIndicator={selectedIndicator}
                onIndicatorChange={setSelectedIndicator}
              />
            </div>
          </div>

          {/* 프리미엄 차트 (Binance BTC 고정) */}
          <div className="mb-4 h-[360px] rounded-lg overflow-hidden border border-slate-700 bg-slate-900/40">
            <TradingViewChartDynamic tvSymbol="BINANCE:BTCUSDT" height={360} />
          </div>

          <div className="mt-2 space-y-3">
            {/* 프리미엄 테이블 */}
            <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
          </div>
        </div>
      </HomeLayout>

      {/* 개인화 설정 패널 */}
      {isPrefsPanelOpen && (
        <UserPrefsPanel
          prefs={prefs}
          onPrefsChange={setPrefs}
          onClose={() => setIsPrefsPanelOpen(false)}
        />
      )}
    </Layout>
  );
}
