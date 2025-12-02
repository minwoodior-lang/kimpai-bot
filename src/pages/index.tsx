import Head from "next/head";
import Layout from "@/components/Layout";
import PremiumTicker from "@/components/PremiumTicker";
import AIInsightBox from "@/components/AIInsightBox";
import PremiumTable from "@/components/PremiumTable";
import AlertSummary from "@/components/AlertSummary";
import dynamic from "next/dynamic";

const ChartWithControls = dynamic(
  () => import("@/components/charts/ChartWithControls"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-slate-800/50 rounded-xl flex items-center justify-center">
        <div className="text-slate-400">차트 로딩 중...</div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>KimpAI - 실시간 김프 & AI 분석</title>
        <meta
          name="description"
          content="코인 김프 실시간 확인, AI 시장 분석, 자동 가격/김프 알림 서비스. 무료로 BTC·ETH·XRP·SOL 실시간 김치프리미엄 데이터를 확인하세요."
        />
      </Head>

      <PremiumTicker />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <ChartWithControls height={400} />
          </div>
          <div className="w-full lg:w-[320px] space-y-4">
            <AIInsightBox />
            <AlertSummary />
          </div>
        </div>

        <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
      </div>
    </Layout>
  );
}
