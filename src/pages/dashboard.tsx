import Head from "next/head";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setSession(data.session);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  const email = session?.user?.email;

  return (
    <Layout>
      <Head>
        <title>Dashboard - KimpAI</title>
        <meta name="description" content="Your KimpAI Pro dashboard" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Welcome back, {email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">Average Premium</div>
            <div className="text-2xl font-bold text-green-400">+3.8%</div>
            <div className="text-slate-500 text-sm mt-1">+0.5% from yesterday</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">BTC Premium</div>
            <div className="text-2xl font-bold text-green-400">+4.2%</div>
            <div className="text-slate-500 text-sm mt-1">₩98.5M / $67.5K</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">Active Alerts</div>
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-slate-500 text-sm mt-1">2 triggered today</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">USDT/KRW Rate</div>
            <div className="text-2xl font-bold text-white">₩1,325.50</div>
            <div className="text-slate-500 text-sm mt-1">-0.3% today</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Premium History</h2>
              <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center border border-dashed border-slate-600 rounded-lg">
              <span className="text-slate-500">Chart placeholder - Premium trend graph</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/alerts"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔔</span>
                </div>
                <div>
                  <div className="text-white font-medium">Create Alert</div>
                  <div className="text-slate-500 text-sm">Set up price notifications</div>
                </div>
              </Link>
              <Link
                href="/analysis"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <div className="text-white font-medium">AI Analysis</div>
                  <div className="text-slate-500 text-sm">View market predictions</div>
                </div>
              </Link>
              <Link
                href="/markets"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <div className="text-white font-medium">Live Markets</div>
                  <div className="text-slate-500 text-sm">View all trading pairs</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white">BTC Premium exceeded 4%</span>
              </div>
              <span className="text-slate-500 text-sm">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">ETH price dropped below ₩4.8M</span>
              </div>
              <span className="text-slate-500 text-sm">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
