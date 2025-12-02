import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES } from "@/contexts/ExchangeSelectionContext";
import ExchangeSelector from "@/components/market/ExchangeSelector";
import CoinIcon from "@/components/common/CoinIcon";

function formatVolumeKRW(value: number | null): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "-";
  
  if (value >= 1e12) {
    const jo = Math.floor(value / 1e12);
    const eok = Math.floor((value % 1e12) / 1e8);
    if (eok > 0) {
      return `${jo}조 ${eok}억`;
    }
    return `${jo}조`;
  }
  if (value >= 1e8) {
    return `${Math.floor(value / 1e8)}억`;
  }
  if (value >= 1e4) {
    return `${Math.floor(value / 1e4)}만`;
  }
  return Math.round(value).toLocaleString();
}

function formatVolumeUsdt(value: number | null): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) return "-";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return "-";
  if (value >= 1000) return Math.round(value).toLocaleString();
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(4);
}

export default function Markets() {
  const router = useRouter();
  const { domesticExchange, foreignExchange } = useExchangeSelection();
  const { data, loading, error, fxRate, averagePremium, refetch, totalCoins, listedCoins } = useMarkets({
    domestic: domesticExchange,
    foreign: foreignExchange,
  });
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const domesticLabel = DOMESTIC_EXCHANGES.find(e => e.value === domesticExchange)?.label || "업비트 KRW";
  const foreignEx = FOREIGN_EXCHANGES.find(e => e.value === foreignExchange);
  const foreignLabel = foreignEx?.shortName || "해외";

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

  const filteredData = data.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const symbol = item.symbol.replace('/KRW', '').toLowerCase();
    const name = (item.koreanName || item.name || '').toLowerCase();
    return symbol.includes(query) || name.includes(query);
  });

  return (
    <Layout>
      <Head>
        <title>Markets - KimpAI</title>
        <meta name="description" content="실시간 김치프리미엄 데이터 - 한국/해외 거래소 비교" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">암호화폐 시장</h1>
            <p className="text-slate-400">실시간 김치프리미엄 데이터 - 한국/해외 거래소 비교</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${averagePremium >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {averagePremium >= 0 ? '+' : ''}{averagePremium.toFixed(1)}%
            </div>
            <div className="text-slate-400 text-sm">평균 김프</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">₩{fxRate.toLocaleString()}</div>
            <div className="text-slate-400 text-sm">USDT/KRW 환율</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {listedCoins}<span className="text-lg text-slate-400">/{totalCoins}</span>
            </div>
            <div className="text-slate-400 text-sm">종목 수</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">30초</div>
            <div className="text-slate-400 text-sm">갱신 주기</div>
          </div>
        </div>

        {/* Filter bar: Exchange selector + coin count + search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 bg-slate-800/30 border border-slate-700/50 rounded-xl p-3">
          <ExchangeSelector />
          
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-slate-400 text-[10px] md:text-xs whitespace-nowrap">
              암호화폐 총 <span className="text-white font-medium">{totalCoins}</span>개
            </span>
            <div className="relative flex-1 md:flex-none">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BTC, 비트코인, ㅂㅌ"
                className="w-full md:w-[200px] bg-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
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
                    <th className="text-right text-slate-400 font-medium px-6 py-4">거래액(일)</th>
                    <th className="text-right text-slate-400 font-medium px-6 py-4">24h 변동</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr
                      key={item.symbol}
                      className={`border-b border-slate-700/30 hover:bg-slate-700/40 transition-colors cursor-pointer ${!item.isListed ? 'opacity-60' : ''}`}
                      onClick={() => item.isListed && handleRowClick(item.symbol)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CoinIcon symbol={item.symbol.replace('/KRW', '')} size="lg" />
                          <div>
                            <span className="text-white font-medium">
                              {item.koreanName || item.name || item.symbol.replace('/KRW', '')}
                            </span>
                            <span className="text-slate-500 text-sm ml-2">
                              {item.koreanName && item.symbol ? `${item.koreanName} / ${item.symbol.replace('/KRW', '')}` : item.symbol.replace('/KRW', '')}
                            </span>
                          </div>
                          {!item.isListed && (
                            <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">미상장</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        ₩{item.upbitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {item.binancePrice !== null ? `₩${formatPrice(item.binancePrice)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.premium !== null ? (
                          <span className={`font-medium ${item.premium > 0 ? "text-green-400" : "text-red-400"}`}>
                            {item.premium > 0 ? "+" : ""}{item.premium.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">
                        <div className="flex flex-col items-end">
                          <span>₩{formatVolumeKRW(item.volume24hKrw)} <span className="text-xs text-slate-500">(국내)</span></span>
                          {item.isListed && item.volume24hForeignKrw !== null ? (
                            <>
                              <span>₩{formatVolumeKRW(item.volume24hForeignKrw)} <span className="text-xs text-slate-500">(해외)</span></span>
                              <span className="text-xs text-slate-500">{formatVolumeUsdt(item.volume24hUsdt)} USDT</span>
                            </>
                          ) : (
                            <span className="text-slate-500 text-xs">해외: -</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.change24h !== null ? (
                          <span className={item.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                            {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
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
