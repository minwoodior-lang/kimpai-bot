import Head from "next/head";
import Layout from "@/components/Layout";
import HomeLayout from "@/components/layout/HomeLayout";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";

const ChartSectionEnhanced = dynamic(
  () => import("@/components/charts/ChartSectionEnhanced"),
  {
    ssr: false,
    loading: () => (
      <div className="mb-6 rounded-xl bg-slate-900/60 p-3 h-[360px] flex items-center justify-center">
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

function TodayPremiumSummaryBar() {
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
    <section className="w-full border-b border-slate-800/60 bg-slate-950/40">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-[12px] leading-relaxed text-slate-200 space-y-1">
          <p className="font-semibold text-[13px]">오늘의 AI 김프 요약</p>
          <p>• 평균: <span className={safeAvgPremium >= 0 ? "text-green-400" : "text-red-400"} style={{fontWeight: 500}}>{formatPremium(safeAvgPremium)}</span> | 최대: <span className="text-green-400" style={{fontWeight: 500}}>{maxPremium ? formatPremium(maxPremium.premium) : "-"}</span> | 최소: <span className={minPremium && (minPremium.premium || 0) < 0 ? "text-red-400" : "text-blue-400"} style={{fontWeight: 500}}>{minPremium ? formatPremium(minPremium.premium) : "-"}</span> | 환율: <span className="text-white" style={{fontWeight: 500}}>₩{(fxRate || 0).toLocaleString()}/USDT</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600/20 px-3 py-2 text-[12px]">
            <div className="text-xs text-slate-300">KR Premium Score</div>
            <div className={`text-lg font-semibold ${riskScore >= 7 ? "text-red-400" : riskScore >= 4 ? "text-yellow-400" : "text-green-400"}`}>{riskScore}/10</div>
          </div>
          <button className="rounded-lg bg-indigo-500 px-3 py-2 text-[12px] font-semibold text-white hover:bg-indigo-600 transition-colors">
            PRO 분석 보기
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [selectedIndicator, setSelectedIndicator] = useState("BINANCE_BTC");

  return (
    <Layout>
      <Head>
        <title>KimpAI - 실시간 김프 & AI 분석</title>
        <meta
          name="description"
          content="코인 김프 실시간 확인, AI 시장 분석, 자동 가격/김프 알림 서비스. 무료로 BTC·ETH·XRP·SOL 실시간 김치프리미엄 데이터를 확인하세요."
        />
      </Head>

      {/* 오늘의 AI 김프 요약 배너 */}
      <TodayPremiumSummaryBar />

      {/* 메인 콘텐츠 */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
        <HomeLayout>
          <div className="space-y-4">
            {/* 향상된 차트 (드롭다운 포함) */}
            <ChartSectionEnhanced
              selectedIndicator={selectedIndicator}
              onIndicatorChange={setSelectedIndicator}
            />
            {/* 프리미엄 테이블 */}
            <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
          </div>
        </HomeLayout>
      </div>
    </Layout>
  );
}
