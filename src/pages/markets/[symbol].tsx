import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useMarkets } from "@/hooks/useMarkets";
import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES } from "@/contexts/ExchangeSelectionContext";
import ExchangeSelector from "@/components/ExchangeSelector";
import dynamic from "next/dynamic";

const TradingViewChart = dynamic(() => import("@/components/charts/TradingViewChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-800/50 rounded-xl flex items-center justify-center">
      <div className="text-slate-400">차트 로딩 중...</div>
    </div>
  ),
});

const PremiumHistoryChart = dynamic(() => import("@/components/charts/PremiumHistoryChart"), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-slate-800/50 rounded-lg flex items-center justify-center">
      <div className="text-slate-400 text-sm">로딩 중...</div>
    </div>
  ),
});

const COIN_INFO: Record<string, { name: string; icon: string }> = {
  BTC: { name: "Bitcoin", icon: "₿" },
  ETH: { name: "Ethereum", icon: "Ξ" },
  XRP: { name: "Ripple", icon: "✕" },
  SOL: { name: "Solana", icon: "◎" },
  ADA: { name: "Cardano", icon: "₳" },
  DOGE: { name: "Dogecoin", icon: "Ð" },
  AVAX: { name: "Avalanche", icon: "A" },
};

export default function SymbolDetail() {
  const router = useRouter();
  const { symbol, domestic, foreign } = router.query;
  const symbolStr = (symbol as string)?.toUpperCase() || "BTC";

  const { data, loading, fxRate } = useMarkets();
  const { 
    getTradingViewDomesticSymbol, 
    getTradingViewForeignSymbol, 
    getDomesticExchangeInfo, 
    getForeignExchangeInfo,
    domesticExchange,
    foreignExchange,
    setDomesticExchange,
    setForeignExchange,
  } = useExchangeSelection();

  useEffect(() => {
    if (domestic && typeof domestic === "string") {
      const validDomestic = DOMESTIC_EXCHANGES.find(e => e.value === domestic);
      if (validDomestic) {
        setDomesticExchange(domestic);
      }
    }
    if (foreign && typeof foreign === "string") {
      const validForeign = FOREIGN_EXCHANGES.find(e => e.value === foreign);
      if (validForeign) {
        setForeignExchange(foreign);
      }
    }
  }, [domestic, foreign, setDomesticExchange, setForeignExchange]);

  const coinData = data.find((d) => d.symbol.replace("/KRW", "") === symbolStr);
  const coinInfo = COIN_INFO[symbolStr] || { name: symbolStr, icon: "?" };
  
  const domesticInfo = getDomesticExchangeInfo();
  const foreignInfo = getForeignExchangeInfo();
  const domesticLabel = DOMESTIC_EXCHANGES.find(e => e.value === domesticExchange)?.label || domesticExchange;
  const foreignLabel = FOREIGN_EXCHANGES.find(e => e.value === foreignExchange)?.label || foreignExchange;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-4"></div>
            <div className="h-[400px] bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!coinData) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl text-white mb-4">코인을 찾을 수 없습니다</h1>
          <Link href="/markets" className="text-blue-400 hover:underline">
            마켓으로 돌아가기
          </Link>
        </div>
      </Layout>
    );
  }

  const binanceKrw = coinData.binancePrice;

  return (
    <Layout>
      <Head>
        <title>{symbolStr} 김프 분석 - KimpAI</title>
        <meta name="description" content={`${coinInfo.name} (${symbolStr}) 실시간 김치프리미엄 분석, ${domesticLabel}/${foreignLabel} 가격 비교`} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
          <Link href="/" className="hover:text-white">홈</Link>
          <span>/</span>
          <Link href="/markets" className="hover:text-white">마켓</Link>
          <span>/</span>
          <span className="text-white">{symbolStr}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
              {coinInfo.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{coinInfo.name}</h1>
              <p className="text-slate-400">{symbolStr}/KRW</p>
            </div>
          </div>
          <ExchangeSelector />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">{domesticLabel} 가격</div>
            <div className="text-xl font-bold text-white">₩{coinData.upbitPrice.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">{foreignLabel} (원화 환산)</div>
            <div className="text-xl font-bold text-white">₩{Math.round(binanceKrw).toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">김치프리미엄</div>
            <div className={`text-xl font-bold ${coinData.premium > 0 ? "text-green-400" : "text-red-400"}`}>
              {coinData.premium > 0 ? "+" : ""}{coinData.premium.toFixed(2)}%
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">24시간 변동</div>
            <div className={`text-xl font-bold ${coinData.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {coinData.change24h >= 0 ? "+" : ""}{coinData.change24h.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-white font-medium">{domesticLabel} {symbolStr}</h3>
              <span className="text-xs text-slate-400 bg-blue-500/20 px-2 py-1 rounded">국내</span>
            </div>
            <TradingViewChart tvSymbol={getTradingViewDomesticSymbol(symbolStr)} height={350} />
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-white font-medium">{foreignLabel} {symbolStr}</h3>
              <span className="text-xs text-slate-400 bg-purple-500/20 px-2 py-1 rounded">해외</span>
            </div>
            <TradingViewChart tvSymbol={getTradingViewForeignSymbol(symbolStr)} height={350} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <h3 className="text-white font-medium">스프레드 차트 (김프 추이)</h3>
                <span className="text-xs text-slate-400 bg-green-500/20 px-2 py-1 rounded">24시간</span>
              </div>
              <div className="p-4">
                <PremiumHistoryChart symbol={symbolStr} hours={24} height={200} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-medium mb-4">시장 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">24시간 거래량</span>
                  <span className="text-white">${(coinData.volume24h / 1000000000).toFixed(2)}B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">환율</span>
                  <span className="text-white">₩{fxRate.toLocaleString()}/USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">프리미엄 금액</span>
                  <span className={`${coinData.premium > 0 ? "text-green-400" : "text-red-400"}`}>
                    ₩{Math.round(coinData.upbitPrice - binanceKrw).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">비교 거래소</span>
                  <span className="text-slate-300 text-sm">{domesticInfo.exchange} ↔ {foreignInfo.exchange}</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2">거래소 변경</h4>
              <p className="text-slate-400 text-sm mb-3">
                상단의 거래소 선택을 변경하면 차트와 김프 계산이 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
