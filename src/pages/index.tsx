import Head from "next/head";
import Layout from "@/components/Layout";
import HomeLayout from "@/components/layout/HomeLayout";
import TodayPremiumSection from "@/components/TodayPremiumSection";
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
          {/* 오늘의 AI 김프 요약 */}
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

          {/* PRO 카드 */}
          <div className="mt-4 w-full max-w-[960px] mx-auto rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40 dark:bg-slate-900/40 light:bg-slate-100/30 px-5 py-4">
            <div className="flex flex-col gap-2">
              {/* 타이틀 라인 */}
              <div className="flex items-center gap-2">
                <span className="text-sm">🔒</span>
                <span className="text-sm font-semibold dark:text-slate-100 light:text-slate-900">
                  PRO 전용 48시간 김프 예측
                </span>
              </div>

              {/* 설명 텍스트 */}
              <p className="text-xs dark:text-slate-400 light:text-slate-600 leading-relaxed">
                최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의 90% 이상을 사전에 포착했습니다.
                <span className="ml-1 text-xs dark:text-slate-500 light:text-slate-500">
                  (PRO 구독 시 전체 내용 확인 가능)
                </span>
              </p>

              {/* 마켓 선택 드롭다운 */}
              <div className="mt-3 w-full max-w-[220px]">
                {/* 차트 지표 선택 드롭다운 (ChartSectionEnhanced 동일 로직) */}
                <select
                  value={selectedIndicator}
                  onChange={(e) => setSelectedIndicator(e.target.value)}
                  className="w-full rounded-lg dark:bg-slate-700 light:bg-slate-200 dark:text-white light:text-slate-900 px-3 py-2 text-xs border dark:border-slate-600 light:border-slate-300 dark:focus:border-blue-500 light:focus:border-blue-400 focus:outline-none"
                >
                  <optgroup label="BTC / Premium">
                    <option value="BINANCE_BTC">BTC Binance</option>
                    <option value="UPBIT_BTC_KRW_PREMIUM">BTC 김치프리미엄 (Upbit)</option>
                    <option value="BITHUMB_BTC_KRW_PREMIUM">BTC 김치프리미엄 (Bithumb)</option>
                  </optgroup>
                  <optgroup label="Market Index">
                    <option value="TOTAL_MARKET_CAP">TOTAL Market Cap</option>
                    <option value="TOTAL2_INDEX">TOTAL2</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 차트 영역 */}
            <div className="mt-4 rounded-2xl dark:border dark:border-slate-700/60 light:border light:border-slate-300/40 dark:bg-slate-900/20 light:bg-slate-100/20 min-h-[260px]">
              {/* 향상된 차트 (드롭다운 포함) */}
              <ChartSectionEnhanced
                selectedIndicator={selectedIndicator}
                onIndicatorChange={setSelectedIndicator}
              />
            </div>

            {/* 프리미엄 테이블 */}
            <PremiumTable showHeader={false} showFilters={true} limit={0} refreshInterval={2000} />
          </div>
        </HomeLayout>
      </div>
    </Layout>
  );
}
