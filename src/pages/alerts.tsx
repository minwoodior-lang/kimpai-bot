import Head from "next/head";
import Layout from "@/components/Layout";
import { useState } from "react";

interface Alert {
  id: string;
  type: "premium" | "price" | "volume";
  asset: string;
  condition: string;
  value: number;
  active: boolean;
  createdAt: string;
}

const mockAlerts: Alert[] = [
  { id: "1", type: "premium", asset: "BTC", condition: "above", value: 5, active: true, createdAt: "2024-01-15" },
  { id: "2", type: "price", asset: "ETH", condition: "below", value: 4500000, active: true, createdAt: "2024-01-14" },
  { id: "3", type: "premium", asset: "XRP", condition: "above", value: 6, active: false, createdAt: "2024-01-10" },
];

export default function Alerts() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <Layout>
      <Head>
        <title>Alerts - KimpAI</title>
        <meta name="description" content="Set up custom alerts for premium changes and price movements" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Price Alerts</h1>
            <p className="text-slate-400">Get notified when market conditions match your criteria</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <span>+</span> Create Alert
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Your Alerts</h2>
          </div>
          
          <div className="divide-y divide-slate-700/30">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${alert.active ? "bg-green-400" : "bg-slate-500"}`}></div>
                    <div>
                      <div className="text-white font-medium">
                        {alert.asset} {alert.type === "premium" ? "Premium" : "Price"} {alert.condition} {alert.type === "premium" ? `${alert.value}%` : `₩${alert.value.toLocaleString()}`}
                      </div>
                      <div className="text-slate-500 text-sm">
                        Created {alert.createdAt}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alert.active 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-slate-600/50 text-slate-400"
                    }`}>
                      {alert.active ? "Active" : "Paused"}
                    </span>
                    <button className="text-slate-400 hover:text-white transition-colors p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Alert</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Asset</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option>BTC</option>
                    <option>ETH</option>
                    <option>XRP</option>
                    <option>SOL</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Alert Type</label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                    <option>Premium Threshold</option>
                    <option>Price Target</option>
                    <option>Volume Spike</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Condition</label>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                      <option>Above</option>
                      <option>Below</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Value"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all mt-6">
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
