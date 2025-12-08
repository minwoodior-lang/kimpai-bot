// src/pages/index.tsx
import Head from "next/head";
import Layout from "@/components/Layout";
import HomeLayout from "@/components/layout/HomeLayout";
import TodayPremiumSection from "@/components/TodayPremiumSection";
import ProPredictionCard from "@/components/ProPredictionCard";
import MyAlertsCard from "@/components/MyAlertsCard";
import ChatFloatingButton from "@/components/chat/ChatFloatingButton";
import ChatPanel from "@/components/chat/ChatPanel";
import ChatUI from "@/components/ChatUI";
import {
  AiSummaryMobileContent,
  ProForecastMobileContent,
  MyAlertsMobileContent,
} from "@/components/mobile/MobileCardContents";
import UserPrefsPanel from "@/components/settings/UserPrefsPanel";
import IndicatorSelector, { SYMBOL_MAP } from "@/components/IndicatorSelector";
import { useUserPrefs } from "@/hooks/useUserPrefs";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";

const PremiumTable = dynamic(() => import("@/components/PremiumTable"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-800/50 flex items-center justify-center">
      <div className="text-slate-400">테이블 로딩 중...</div>
    </div>
  ),
});

const TradingViewChartDynamic = dynamic(
  () => import("@/components/charts/TradingViewChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] bg-slate-900/50 animate-pulse flex items-center justify-center">
        <div className="text-slate-400">차트 로딩 중...</div>
      </div>
    ),
  }
);

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] =
    useState("BINANCE_BTCUSDT");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileCardTab, setMobileCardTab] = useState<"ai" | "pro" | "alerts">(
    "ai"
  );
  const [isPrefsPanelOpen, setIsPrefsPanelOpen] = useState(false);

  // 사용자 설정 훅
  const { prefs, setPrefs, isLoaded, toggleFavorite } = useUserPrefs();

  const { data, averagePremium, fxRate } = useMarkets();

  const listedData = data.filter((item) => item.premium !== null);

  // 필터링 적용 (리스트 필터)
  let filteredData = [...listedData];
  if (isLoaded && prefs.filterMode === "foreign") {
    // 해외 거래소에 상장된 코인만 (binancePrice가 있는 경우)
    filteredData = filteredData.filter(
      (item) => item.binancePrice !== null && item.binancePrice > 0
    );
  } else if (isLoaded && prefs.filterMode === "favorites") {
    // 즐겨찾기한 코인만
    const favoritesSet = new Set(prefs.favorites || []);
    filteredData = filteredData.filter((item) => {
      const normalizedSymbol = item.symbol
        .replace("/KRW", "")
        .replace("/USDT", "")
        .replace("/BTC", "")
        .toUpperCase();
      return favoritesSet.has(normalizedSymbol);
    });
  }

  const maxPremium =
    filteredData.length > 0
      ? filteredData.reduce(
          (max, item) =>
            (item.premium || 0) > (max.premium || 0) ? item : max,
          filteredData[0]
        )
      : null;

  const minPremium =
    filteredData.length > 0
      ? filteredData.reduce(
          (min, item) =>
            (item.premium || 0) < (min.premium || 0) ? item : min,
          filteredData[0]
        )
      : null;

  const formatPremium = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  /** 오늘 시장 요약 한 줄 계산 */
  const volatilityLabel = (() => {
    if (!maxPremium || !minPremium) return "-";
    const diff = (maxPremium.premium || 0) - (minPremium.premium || 0);
    if (diff < 2) return "낮음";
    if (diff < 5) return "보통";
    return "높음";
  })();

  const trendLabel = (() => {
    const avg = averagePremium || 0;
    if (avg >= 1) return "상승";
    if (avg <= -1) return "하락";
    return "횡보";
  })();

  const inverseCount = filteredData.filter(
    (item) => (item.premium || 0) < 0
  ).length;
  const inverseLabel = inverseCount === 0 ? "없음" : `${inverseCount}종목`;

  const marketSummary = `오늘 변동성 ${volatilityLabel} · 추세 ${trendLabel} · 역프 ${inverseLabel}`;

  const calculateRiskScore = () => {
    const absAvg = Math.abs(averagePremium || 0);
    if (absAvg >= 8) return 10;
    if (absAvg >= 6) return 8;
    if (absAvg >= 4) return 8;
    if (absAvg >= 2) return 6;
    return 4;
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
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
        {({
          showNicknameEdit,
          onToggleNicknameEdit,
        }: {
          showNicknameEdit: boolean;
          onToggleNicknameEdit: () => void;
        }) => (
          <ChatUI
            showNicknameEdit={showNicknameEdit}
            onToggleNicknameEdit={onToggleNicknameEdit}
          />
        )}
      </ChatPanel>

      {/* 메인 콘텐츠 */}
      <HomeLayout>
        {/* ⚠ 폭/패딩은 Layout에서 이미 1280px + px-6로 관리하므로 여기선 수직 여백만 */}
        <div className="w-full py-3 sm:py-6">
          {/* PC: 상단 3컬럼 레이아웃 */}
          <div className="hidden md:grid grid-cols-3 gap-4 mb-8 items-stretch">
            {/* 좌측: 오늘의 AI 김프 요약 */}
            <TodayPremiumSection
              avgPremium={
                <span
                  className={
                    safeAvgPremium >= 0
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {formatPremium(safeAvgPremium)}
                </span>
              }
              maxPremium={
                maxPremium ? (
                  <span className="text-green-400 font-bold">
                    {formatPremium(maxPremium.premium)} (
                    {maxPremium.symbol.replace("/KRW", "")})
                  </span>
                ) : (
                  "-"
                )
              }
              minPremium={
                minPremium ? (
                  <span
                    className={
                      minPremium.premium && minPremium.premium < 0
                        ? "text-red-400 font-bold"
                        : "text-slate-300 font-bold"
                    }
                  >
                    {formatPremium(minPremium.premium)} (
                    {minPremium.symbol.replace("/KRW", "")})
                  </span>
                ) : (
                  "-"
                )
              }
              fxRate={
                <span className="text-white font-bold">
                  ₩{(fxRate || 0).toLocaleString()}/USDT
                </span>
              }
              score={riskScore}
              marketSummary={marketSummary}
            />

            {/* 중앙: PRO 예측 카드 */}
            <ProPredictionCard />

            {/* 우측: 내 알림 카드 */}
            <MyAlertsCard />
          </div>

          {/* 모바일: 탭 구조 */}
          <div className="md:hidden mt-2 md:mt-4 mb-4">
            {/* 탭 버튼 - PRO 배지 강화 */}
            <div className="flex gap-1.5 mb-3">
              <button
                onClick={() => setMobileCardTab("ai")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-[11px] transition-colors ${
                  mobileCardTab === "ai"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                📊 AI 요약
              </button>
              <button
                onClick={() => setMobileCardTab("pro")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-[11px] transition-all ${
                  mobileCardTab === "pro"
                    ? "bg-indigo-600 text-white border-2 border-yellow-500/60"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border-2 border-yellow-500/30"
                }`}
              >
                🔒 PRO 예측
              </button>
              <button
                onClick={() => setMobileCardTab("alerts")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-[11px] transition-colors ${
                  mobileCardTab === "alerts"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🔔 내 알림
              </button>
            </div>

            {/* 공통 카드 껍데기 - 고정 높이 */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 h-[180px] flex flex-col">
              {mobileCardTab === "ai" && (
                <AiSummaryMobileContent
                  avgPremium={
                    <span
                      className={
                        safeAvgPremium >= 0
                          ? "text-green-400 font-bold"
                          : "text-red-400 font-bold"
                      }
                    >
                      {formatPremium(safeAvgPremium)}
                    </span>
                  }
                  maxPremium={
                    maxPremium ? (
                      <span className="text-green-400 font-bold">
                        {formatPremium(maxPremium.premium)} (
                        {maxPremium.symbol.replace("/KRW", "")})
                      </span>
                    ) : (
                      "-"
                    )
                  }
                  minPremium={
                    minPremium ? (
                      <span
                        className={
                          minPremium.premium && minPremium.premium < 0
                            ? "text-red-400 font-bold"
                            : "text-slate-300 font-bold"
                        }
                      >
                        {formatPremium(minPremium.premium)} (
                        {minPremium.symbol.replace("/KRW", "")})
                      </span>
                    ) : (
                      "-"
                    )
                  }
                  fxRate={
                    <span className="text-white font-bold">
                      ₩{(fxRate || 0).toLocaleString()}/USDT
                    </span>
                  }
                  score={riskScore}
                  marketSummary={marketSummary}
                />
              )}
              {mobileCardTab === "pro" && <ProForecastMobileContent />}
              {mobileCardTab === "alerts" && <MyAlertsMobileContent />}
            </div>
          </div>

          {/* 프리미엄 차트 섹션 */}
          <section className="mt-3 md:mt-6 mb-4 md:mb-6">
            {/* 상단 타이틀 + 버튼 영역 */}
            <div className="mb-2 sm:mb-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
              <h2 className="text-xs sm:text-sm text-slate-200">
                프리미엄 차트
              </h2>

              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={() => setIsPrefsPanelOpen(true)}
                  className="inline-flex items-center justify-center h-9 rounded-md bg-slate-800 px-3 text-[11px] sm:text-sm text-slate-100 hover:bg-slate-700 transition"
                >
                  <span className="mr-1">⚙</span>
                  <span>개인화 설정</span>
                </button>

                <IndicatorSelector
                  selectedIndicator={selectedIndicator}
                  onIndicatorChange={setSelectedIndicator}
                />
              </div>
            </div>

            {/* 차트만 hideChart 적용 */}
            {!prefs.hideChart && (
              <div className="w-full h-[200px] sm:h-[240px] md:h-[320px] overflow-hidden border border-white/5 bg-[#050819]">
                <TradingViewChartDynamic
                  tvSymbol={SYMBOL_MAP[selectedIndicator] || "BINANCE:BTCUSDT"}
                  height="100%"
                  defaultTimeframe={prefs.defaultTimeframe}
                />
              </div>
            )}
          </section>

          {/* 프리미엄 테이블 섹션 */}
          <section className="mt-4 mb-10 md:mt-6 -mx-2 md:mx-0">
            <PremiumTable
              showHeader={false}
              showFilters={true}
              limit={0}
              refreshInterval={1000}
              prefs={prefs}
              toggleFavorite={toggleFavorite}
            />
          </section>
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
