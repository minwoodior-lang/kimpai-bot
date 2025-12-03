import Head from "next/head";
import Layout from "@/components/Layout";
import HomeLayout from "@/components/layout/HomeLayout";
import dynamic from "next/dynamic";
import { useState } from "react";

const TopInfoBar = dynamic(
  () => import("@/components/top/TopInfoBar"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-900/90 border-b border-slate-700/50 py-3 px-4 h-24">
        <div className="max-w-7xl mx-auto text-slate-400">로딩 중...</div>
      </div>
    ),
  }
);

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

      {/* P-1 최상단 정보바 */}
      <TopInfoBar />

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HomeLayout>
          {/* 향상된 차트 (드롭다운 포함) */}
          <ChartSectionEnhanced
            selectedIndicator={selectedIndicator}
            onIndicatorChange={setSelectedIndicator}
          />
          {/* 프리미엄 테이블 */}
          <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
        </HomeLayout>
      </div>
    </Layout>
  );
}
