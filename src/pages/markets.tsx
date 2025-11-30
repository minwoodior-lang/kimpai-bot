import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES } from "@/contexts/ExchangeSelectionContext";
import ExchangeSelector from "@/components/ExchangeSelector";

export default function Markets() {
  const router = useRouter();
  const { domesticExchange, foreignExchange } = useExchangeSelection();
  const { data, loading, error, fxRate, averagePremium, refetch } = useMarkets({
    domestic: domesticExchange,
    foreign: foreignExchange,
  });
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const domesticLabel = DOMESTIC_EXCHANGES.find(e => e.value === domesticExchange)?.label || "업비트 KRW";
  const foreignLabel = FOREIGN_EXCHANGES.find(e => e.value === foreignExchange)?.label || "Binance USDT";

  const handleRowClick = (symbol: string) => {
    const cleanSymbol = symbol.replace("/KRW", "").toLowerCase();
    router.push(`/markets/${cleanSymbol}`);
  };

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    refetch();
  }, [domesticExchange, foreignExchange, refetch]);

  return (
    <Layout>
      <Head>
        <title>Markets - KimpAI</title>
        <meta name="description" content="실시간 김치프리미엄 데이터 - 한국/해외 거래소 비교" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">암호화폐 시장</h1>
            <p className="text-slate-400">실시간 김치프리미엄 데이터 - 한국/해외 거래소 비교</p>
          </div>
          <ExchangeSelector />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">+{averagePremium.toFixed(1)}%</div>
            <div className="text-slate-400 text-sm">평균 김프</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">₩{fxRate.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">USD/KRW 환율</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{data.length}</div>
            <div className="text-slate-400 text-sm">종목 수</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">30초</div>
            <div className="text-slate-400 text-sm">갱신 주기</div>
          </div>
        </div>

        {loading && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-300">
            데이터를 불러오는 중입니다…
          </div>
        )}

        {error && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-red-400">
            데이터를 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-slate-400 font-medium px-6 py-4">종목</th>
                    <th className="text-right text-slate-400 font-medium px-6 py-4">{domesticLabel}</th>
                    <th className="text-right text-slate-400 font-medium px-6 py-4">{foreignLabel} (원화)</th>
                    <th className="text-right text-slate-400 font-medium px-6 py-4">김프</th>
                    <th className="text-right text-slate-400 font-medium px-6 py-4">24h 거래량</th>
                    <th className="text-right text-slate-400 font-medium px-6 py-4">24h 변동</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr
                      key={item.symbol}
                      className="border-b border-slate-700/30 hover:bg-slate-700/40 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(item.symbol)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-white font-medium">{item.symbol}</span>
                          <span className="text-slate-500 text-sm ml-2">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        ₩{item.upbitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        ₩{Math.round(item.binancePrice).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-medium ${item.premium > 0 ? "text-green-400" : "text-red-400"}`}>
                          {item.premium > 0 ? "+" : ""}{item.premium.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">
                        ${(item.volume24h / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={item.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                          {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-slate-500 text-sm">
          30초마다 자동 갱신 {lastUpdated && `• 마지막 업데이트: ${lastUpdated}`}
        </div>
      </div>
    </Layout>
  );
}
