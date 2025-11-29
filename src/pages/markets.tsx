import Head from "next/head";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";

interface PremiumData {
  symbol: string;
  koreanPrice: number;
  globalPrice: number;
  premium: number;
  volume24h: number;
  change24h: number;
}

const mockPremiumData: PremiumData[] = [
  { symbol: "BTC", koreanPrice: 98500000, globalPrice: 67500, premium: 4.2, volume24h: 1250000000, change24h: 2.1 },
  { symbol: "ETH", koreanPrice: 4850000, globalPrice: 3320, premium: 3.8, volume24h: 680000000, change24h: 1.5 },
  { symbol: "XRP", koreanPrice: 850, globalPrice: 0.58, premium: 5.1, volume24h: 420000000, change24h: -0.8 },
  { symbol: "SOL", koreanPrice: 285000, globalPrice: 195, premium: 3.2, volume24h: 320000000, change24h: 3.2 },
  { symbol: "ADA", koreanPrice: 720, globalPrice: 0.49, premium: 4.5, volume24h: 180000000, change24h: 0.5 },
];

export default function Markets() {
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  return (
    <Layout>
      <Head>
        <title>Markets - KimpAI</title>
        <meta name="description" content="Real-time Kimchi Premium data across Korean and global exchanges" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crypto Markets</h1>
          <p className="text-slate-400">Real-time Kimchi Premium data across Korean and global exchanges</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-slate-400 font-medium px-6 py-4">Asset</th>
                  <th className="text-right text-slate-400 font-medium px-6 py-4">Korean Price (KRW)</th>
                  <th className="text-right text-slate-400 font-medium px-6 py-4">Global Price (USD)</th>
                  <th className="text-right text-slate-400 font-medium px-6 py-4">Premium</th>
                  <th className="text-right text-slate-400 font-medium px-6 py-4">24h Volume</th>
                  <th className="text-right text-slate-400 font-medium px-6 py-4">24h Change</th>
                </tr>
              </thead>
              <tbody>
                {mockPremiumData.map((item) => (
                  <tr key={item.symbol} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{item.symbol}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      ₩{item.koreanPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      ${item.globalPrice.toLocaleString()}
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

        <div className="mt-6 text-center text-slate-500 text-sm">
          Data refreshes every 30 seconds {lastUpdated && `• Last updated: ${lastUpdated}`}
        </div>
      </div>
    </Layout>
  );
}
