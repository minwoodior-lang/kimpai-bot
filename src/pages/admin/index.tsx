import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";

interface HealthData {
  signalEngine: {
    running: boolean;
    lastUpdate: number | null;
    lastUpdateAgo: number;
    wsConnected: boolean;
    klineWsConnected: boolean;
    recentTrades: number;
    symbolCount: number;
    status: "ok" | "warning" | "critical";
    statusMessage: string;
  };
  bot: {
    uptime: number;
    uptimeFormatted: string;
    lastMessageSent: number | null;
    lastMessageAgo: number | null;
    status: "ok" | "warning" | "critical";
    statusMessage: string;
  };
  workers: {
    priceWorker: { ok: boolean; lastRun: number | null; status: string };
    statsWorker: { ok: boolean; lastRun: number | null; status: string };
    premiumWorker: { ok: boolean; lastRun: number | null; status: string };
  };
  errors: Array<{ time: number; message: string }>;
  timestamp: string;
}

function StatusBadge({ status }: { status: "ok" | "warning" | "critical" }) {
  const colors = {
    ok: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30"
  };
  const labels = {
    ok: "정상",
    warning: "주의",
    critical: "위험"
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}></span>
  );
}

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}초 전`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  return `${Math.floor(seconds / 3600)}시간 전`;
}

export default function AdminIndex() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/admin/health");
        const json = await res.json();
        if (json.success) {
          setHealth(json.data);
          setError(null);
        } else {
          setError("Health check failed");
        }
      } catch (err) {
        setError("Failed to fetch health data");
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>Admin - KimpAI</title>
        <meta name="description" content="KimpAI Admin Dashboard" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="border-b border-slate-700/50 bg-slate-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-white">KimpAI Admin</span>
              </div>
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                Back to Site
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">System Health Monitoring & Management</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🏥</span> System Health
            </h2>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-24 mb-4"></div>
                    <div className="h-6 bg-slate-700 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-red-400">
                {error}
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-sm">시그널 엔진</span>
                      <StatusBadge status={health.signalEngine.status} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">상태</span>
                        <span className="text-white">{health.signalEngine.running ? "실행 중" : "중지됨"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">AggTrade WS</span>
                        <span className="flex items-center gap-1.5">
                          <ConnectionDot connected={health.signalEngine.wsConnected} />
                          <span className="text-white">{health.signalEngine.wsConnected ? "연결됨" : "끊김"}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kline WS</span>
                        <span className="flex items-center gap-1.5">
                          <ConnectionDot connected={health.signalEngine.klineWsConnected} />
                          <span className="text-white">{health.signalEngine.klineWsConnected ? "연결됨" : "끊김"}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">마지막 업데이트</span>
                        <span className="text-white">{formatTimeAgo(health.signalEngine.lastUpdateAgo)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">감시 심볼</span>
                        <span className="text-white">{health.signalEngine.symbolCount}개</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-sm">텔레그램 봇</span>
                      <StatusBadge status={health.bot.status} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">가동 시간</span>
                        <span className="text-white">{health.bot.uptimeFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">마지막 메시지</span>
                        <span className="text-white">
                          {health.bot.lastMessageAgo ? formatTimeAgo(health.bot.lastMessageAgo) : "없음"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">상태</span>
                        <span className="text-white">{health.bot.statusMessage}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-sm">워커 상태</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Price Worker</span>
                        <span className="flex items-center gap-1.5">
                          <ConnectionDot connected={health.workers.priceWorker.ok} />
                          <span className="text-white">{health.workers.priceWorker.status}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Stats Worker</span>
                        <span className="flex items-center gap-1.5">
                          <ConnectionDot connected={health.workers.statsWorker.ok} />
                          <span className="text-white">{health.workers.statsWorker.status}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Premium Worker</span>
                        <span className="flex items-center gap-1.5">
                          <ConnectionDot connected={health.workers.premiumWorker.ok} />
                          <span className="text-white">{health.workers.premiumWorker.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {health.errors.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-3">최근 에러 로그</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {health.errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm p-2 bg-red-500/10 rounded-lg">
                          <span className="text-slate-500 text-xs whitespace-nowrap">
                            {new Date(err.time).toLocaleTimeString("ko-KR")}
                          </span>
                          <span className="text-red-400">{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="text-slate-400 text-sm mb-2">Total Users</div>
              <div className="text-2xl font-bold text-white">1,234</div>
              <div className="text-green-400 text-sm mt-1">+12% this week</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="text-slate-400 text-sm mb-2">Pro Subscribers</div>
              <div className="text-2xl font-bold text-white">256</div>
              <div className="text-green-400 text-sm mt-1">+5% this week</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="text-slate-400 text-sm mb-2">Active Alerts</div>
              <div className="text-2xl font-bold text-white">892</div>
              <div className="text-slate-500 text-sm mt-1">Across all users</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="text-slate-400 text-sm mb-2">API Requests</div>
              <div className="text-2xl font-bold text-white">45.2K</div>
              <div className="text-slate-500 text-sm mt-1">Last 24 hours</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                  <span className="text-xl">👥</span>
                  <span className="text-white">Manage Users</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                  <span className="text-xl">📊</span>
                  <span className="text-white">View Analytics</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                  <span className="text-xl">⚙️</span>
                  <span className="text-white">System Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                  <span className="text-xl">🔔</span>
                  <span className="text-white">Notification Settings</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Bot Commands</h2>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <code className="text-blue-400">/signal_status</code>
                  <span className="text-slate-400 ml-2">- 엔진 상태 확인</span>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <code className="text-blue-400">/signal_test</code>
                  <span className="text-slate-400 ml-2">- 테스트 시그널 발송</span>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <code className="text-blue-400">/signal_restart</code>
                  <span className="text-slate-400 ml-2">- 엔진 재시작</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
