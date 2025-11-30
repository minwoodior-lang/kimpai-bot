import Head from "next/head";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import AIInsightBox from "@/components/AIInsightBox";
import MarketTable from "@/components/MarketTable";
import AlertCTA from "@/components/AlertCTA";

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <HeroSection />

        <div className="mt-10">
          <AIInsightBox />
        </div>

        <div className="mt-12">
          <MarketTable limit={12} />
        </div>

        <div className="mt-16">
          <AlertCTA />
        </div>
      </div>
    </Layout>
  );
}
