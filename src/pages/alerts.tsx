import Head from "next/head";
import Layout from "@/components/Layout";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

type AlertRow = {
  id: string;
  symbol: string;
  condition_type: "above" | "below";
  threshold: number;
  is_active: boolean;
  created_at: string;
};

export default function Alerts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    symbol: "BTC/KRW",
    conditionType: "above" as "above" | "below",
    threshold: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(async (uid: string) => {
    setLoadingAlerts(true);
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching alerts:", error);
    } else {
      setAlerts(data || []);
    }
    setLoadingAlerts(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        const uid = data.session.user.id;
        setUserId(uid);
        setLoading(false);
        fetchAlerts(uid);
      }
    });
  }, [router, fetchAlerts]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setFormError("");
    setSubmitting(true);

    const threshold = Number(form.threshold);
    if (isNaN(threshold) || threshold <= 0) {
      setFormError("Please enter a valid threshold value.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("alerts").insert({
      user_id: userId,
      symbol: form.symbol,
      condition_type: form.conditionType,
      threshold: threshold,
      is_active: true,
    });

    if (error) {
      console.error("Error creating alert:", error);
      setFormError("Failed to create alert. Please try again.");
    } else {
      setForm({ symbol: "BTC/KRW", conditionType: "above", threshold: "" });
      setShowCreateModal(false);
      fetchAlerts(userId);
    }
    setSubmitting(false);
  };

  const handleToggle = async (alert: AlertRow) => {
    if (!userId) return;

    const { error } = await supabase
      .from("alerts")
      .update({ is_active: !alert.is_active })
      .eq("id", alert.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error toggling alert:", error);
    } else {
      fetchAlerts(userId);
    }
  };

  const handleDelete = async (alert: AlertRow) => {
    if (!userId) return;

    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", alert.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting alert:", error);
    } else {
      fetchAlerts(userId);
    }
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

          {loadingAlerts ? (
            <div className="p-8 text-center text-slate-400">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No alerts yet. Create your first alert to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${alert.is_active ? "bg-green-400" : "bg-slate-500"}`}></div>
                      <div>
                        <div className="text-white font-medium">
                          {alert.symbol} {alert.condition_type === "above" ? "above" : "below"} {alert.threshold}%
                        </div>
                        <div className="text-slate-500 text-sm">
                          Created {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        alert.is_active 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-slate-600/50 text-slate-400"
                      }`}>
                        {alert.is_active ? "Active" : "Paused"}
                      </span>
                      <button
                        onClick={() => handleToggle(alert)}
                        className="text-slate-400 hover:text-blue-400 transition-colors px-3 py-1 text-sm border border-slate-600 rounded-lg hover:border-blue-500"
                      >
                        {alert.is_active ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => handleDelete(alert)}
                        className="text-slate-400 hover:text-red-400 transition-colors px-3 py-1 text-sm border border-slate-600 rounded-lg hover:border-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

              {formError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Symbol</label>
                  <select
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BTC/KRW">BTC/KRW</option>
                    <option value="ETH/KRW">ETH/KRW</option>
                    <option value="XRP/KRW">XRP/KRW</option>
                    <option value="SOL/KRW">SOL/KRW</option>
                    <option value="ADA/KRW">ADA/KRW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Condition</label>
                  <select
                    value={form.conditionType}
                    onChange={(e) => setForm({ ...form, conditionType: e.target.value as "above" | "below" })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="above">Premium Above</option>
                    <option value="below">Premium Below</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Threshold (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                    placeholder="e.g., 5"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Alert"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
