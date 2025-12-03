import Head from "next/head";
import Layout from "@/components/Layout";
import PremiumTicker from "@/components/PremiumTicker";
import HomeLayout from "@/components/layout/HomeLayout";
import dynamic from "next/dynamic";
import { useState } from "react";

const ChartSection = dynamic(
  () => import("@/components/charts/ChartSection"),
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

interface MarketOption {
  id: string;
  name: string;
  logo: string;
}

const MARKET_OPTIONS: MarketOption[] = [
  { id: "BINANCE_BTC", name: "🌍 BTC Binance", logo: "/logo-binance.png" },
  { id: "BINANCE_ETH", name: "🌍 ETH Binance", logo: "/logo-binance.png" },
];

export default function Home() {
  const [selectedMarket, setSelectedMarket] = useState("BINANCE_BTC");

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-4">
        {/* 마켓 선택 드롭다운 */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            {MARKET_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <HomeLayout>
        <ChartSection selectedMarket={selectedMarket} />
        <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
      </HomeLayout>
    </Layout>
  );
}
