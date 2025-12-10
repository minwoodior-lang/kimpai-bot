import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SummaryCards from "@/components/market/SummaryCards";
import LongShortChart from "@/components/market/LongShortChart";
import PremiumHeatmap from "@/components/market/PremiumHeatmap";
import ExchangePremiumTable from "@/components/market/ExchangePremiumTable";
import VolatilityIndex from "@/components/market/VolatilityIndex";
import MajorCoins from "@/components/market/MajorCoins";
import TrendingList from "@/components/market/TrendingList";

export default function MarketDashboard() {
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdate(
        now.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <main className="max-w-screen-2xl mx-auto px-4 py-4 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">
            📊 시장 지표 대시보드
          </h1>
          <span className="text-xs text-slate-400">
            마지막 업데이트: {lastUpdate}
          </span>
        </div>

        <SummaryCards />

        <LongShortChart />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PremiumHeatmap />
          <ExchangePremiumTable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <VolatilityIndex />
          <div className="lg:col-span-2">
            <MajorCoins />
          </div>
        </div>

        <TrendingList />
      </main>
    </Layout>
  );
}
