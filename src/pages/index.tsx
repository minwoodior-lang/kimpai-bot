import Head from "next/head";
import Layout from "@/components/Layout";
import HomeLayout from "@/components/layout/HomeLayout";
import TodayPremiumSection from "@/components/TodayPremiumSection";
import ProPredictionCard from "@/components/ProPredictionCard";
import MyAlertsCard from "@/components/MyAlertsCard";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";

const ChartSectionEnhanced = dynamic(
  () => import("@/components/charts/ChartSectionEnhanced"),
  {
    ssr: false,
    loading: () => (
      <div className="mb-6 rounded-xl bg-slate-900/80 p-3 h-[360px] flex items-center justify-center">
        <div className="text-slate-400">차트 로딩 중...</div>
      </div>
    ),
  }
);

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

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] = useState("BINANCE_BTC");
  const { data, averagePremium, fxRate } = useMarkets();

  const listedData = data.filter(item => item.premium !== null);
  const maxPremium = listedData.length > 0 
    ? listedData.reduce((max, item) => 
        (item.premium || 0) > (max.premium || 0) ? item : max, listedData[0])
    : null;
  const minPremium = listedData.length > 0
    ? listedData.reduce((min, item) => 
        (item.premium || 0) < (min.premium || 0) ? item : min, listedData[0])
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

      {/* 메인 콘텐츠 */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-5 py-6">
        <HomeLayout>
          {/* 상단 3컬럼 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
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

          {/* 차트 섹션 */}
          <div className="mt-4 w-full rounded-2xl dark:border dark:border-slate-700/60 light:border light:border-slate-300/40 dark:bg-slate-900/20 light:bg-slate-100/20 min-h-[260px] overflow-hidden">
            <ChartSectionEnhanced
              selectedIndicator={selectedIndicator}
              onIndicatorChange={setSelectedIndicator}
            />
          </div>

          <div className="space-y-4">

            {/* 프리미엄 테이블 */}
            <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
          </div>
        </HomeLayout>
      </div>
    </Layout>
  );
}
