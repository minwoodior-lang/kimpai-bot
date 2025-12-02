import Head from "next/head";
import Layout from "@/components/layout/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Analysis() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>AI Analysis - KimpAI</title>
        <meta name="description" content="AI-powered market analysis and insights" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Analysis</h1>
          <p className="text-slate-400">AI-powered market insights and predictions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h2 className="text-xl font-semibold text-white">Daily Market Summary</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-slate-300 leading-relaxed">
                  The Kimchi Premium is currently at <span className="text-green-400 font-medium">+3.8%</span> average 
                  across major trading pairs. BTC premium has decreased by 0.5% in the last 24 hours, 
                  indicating reduced buying pressure in Korean markets.
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Last updated: Today at 09:00 AM KST
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h2 className="text-xl font-semibold text-white">AI Prediction</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-slate-300 leading-relaxed">
                  Based on historical patterns and current market conditions, our AI predicts the 
                  premium will <span className="text-yellow-400 font-medium">stabilize</span> over 
                  the next 48 hours with potential upward movement if global markets remain bullish.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Confidence: 72%</span>
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[72%] h-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <h2 className="text-xl font-semibold text-white">Trading Signals</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-white">BTC/KRW</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">HOLD</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-white">ETH/KRW</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">BUY</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-white">XRP/KRW</span>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">SELL</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-xl font-semibold text-white">Arbitrage Opportunities</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">BTC: Upbit → Binance</span>
                  <span className="text-green-400 font-medium">+2.1%</span>
                </div>
                <p className="text-slate-500 text-sm">Estimated profit after fees</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">ETH: Bithumb → Coinbase</span>
                  <span className="text-green-400 font-medium">+1.8%</span>
                </div>
                <p className="text-slate-500 text-sm">Estimated profit after fees</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
