import Head from "next/head";
import Layout from "@/components/Layout";
import PremiumTicker from "@/components/PremiumTicker";
import AIInsightBox from "@/components/AIInsightBox";
import MarketTable from "@/components/MarketTable";
import AlertCTA from "@/components/AlertCTA";
import AlertSummary from "@/components/AlertSummary";
import dynamic from "next/dynamic";

const ChartWithControls = dynamic(() => import("@/components/charts/ChartWithControls"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] bg-slate-800/50 rounded-xl flex items-center justify-center">
      <div className="text-slate-400">차트 로딩 중...</div>
    </div>
  ),
});

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            실시간 김프 확인 + <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI</span> 분석 플랫폼
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            업비트·바이낸스 가격을 비교해 <strong className="text-white">김치프리미엄</strong>을 즉시 확인하고, AI 분석으로 시장 흐름을 예측하세요.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ChartWithControls height={400} />
          </div>
          <div className="space-y-4">
            <AIInsightBox />
            <AlertSummary />
          </div>
        </div>

        <div className="mb-8">
          <MarketTable limit={12} showControls={true} />
        </div>

        <div className="mb-12">
          <AlertCTA />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Data Sources</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li>• <strong className="text-white">Upbit</strong> - 한국 최대 거래소 실시간 API</li>
              <li>• <strong className="text-white">CoinGecko</strong> - 글로벌 가격 데이터</li>
              <li>• <strong className="text-white">Exchange Rate API</strong> - USD/KRW 환율</li>
              <li>• <strong className="text-white">TradingView</strong> - 고급 차트 위젯</li>
            </ul>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI Methodology</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li>• 실시간 김프 모니터링 (5초 간격 업데이트)</li>
              <li>• 24시간 김프 히스토리 분석</li>
              <li>• 시장 트렌드 자동 감지</li>
              <li>• 사용자 맞춤 알림 시스템</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
