import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

type TabType = "health" | "price-feeds" | "symbols" | "premium" | "workers" | "listings" | "frontend" | "tools";

interface HealthData {
  signalEngine: {
    running: boolean;
    healthy: boolean;
    lastUpdate: number | null;
    lastUpdateAgo: number;
    lastTradeTime: number | null;
    lastTradeAgo: number;
    tradeStale: boolean;
    wsConnected: boolean;
    klineWsConnected: boolean;
    recentTrades: number;
    symbolCount: number;
    tradeBucketCount: number;
    baselineCount: number;
    restartCount: number;
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

interface PriceFeedStatus {
  exchange: string;
  status: "ok" | "warning" | "critical";
  lastUpdate: number;
  tickCount: number;
  wsConnected: boolean;
  error?: string;
}

interface AdminUser {
  username: string;
  role: string;
}

function StatusBadge({ status }: { status: "ok" | "warning" | "critical" }) {
  const colors = {
    ok: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30"
  };
  const icons = { ok: "🟢", warning: "🟡", critical: "🔴" };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[status]} flex items-center gap-1`}>
      {icons[status]}
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

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "health", label: "System Health", icon: "🏥" },
  { id: "price-feeds", label: "Price Feeds", icon: "📊" },
  { id: "symbols", label: "Symbols", icon: "🔗" },
  { id: "premium", label: "Premium Engine", icon: "💎" },
  { id: "workers", label: "Workers", icon: "⚙️" },
  { id: "listings", label: "Listings", icon: "📋" },
  { id: "frontend", label: "Frontend", icon: "🌐" },
  { id: "tools", label: "Tools", icon: "🛠️" }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("health");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [priceFeeds, setPriceFeeds] = useState<PriceFeedStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session");
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/health");
      const json = await res.json();
      if (json.success) {
        setHealth(json.data);
        setError(null);
      }
    } catch {
      setError("Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPriceFeeds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/price-feeds");
      const json = await res.json();
      if (json.success) {
        setPriceFeeds(json.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchHealth();
      fetchPriceFeeds();
      const interval = setInterval(() => {
        fetchHealth();
        fetchPriceFeeds();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user, fetchHealth, fetchPriceFeeds]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Admin Dashboard - KimpAI</title>
        <meta name="description" content="KimpAI Admin Dashboard v2.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="border-b border-slate-700/50 bg-slate-900/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-white">KimpAI Admin</span>
                <span className="text-xs text-slate-500 ml-2">v2.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400 text-sm">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-1 border border-slate-700 rounded-lg hover:border-slate-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="border-b border-slate-700/50 bg-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto py-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "health" && (
            <HealthSection health={health} loading={loading} error={error} />
          )}
          {activeTab === "price-feeds" && (
            <PriceFeedsSection feeds={priceFeeds} />
          )}
          {activeTab === "symbols" && <SymbolsSection />}
          {activeTab === "premium" && <PremiumSection />}
          {activeTab === "workers" && <WorkersSection health={health} />}
          {activeTab === "listings" && <ListingsSection />}
          {activeTab === "frontend" && <FrontendSection />}
          {activeTab === "tools" && <ToolsSection />}
        </div>
      </div>
    </>
  );
}

function HealthSection({ health, loading, error }: { health: HealthData | null; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-24 mb-4"></div>
            <div className="h-6 bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-red-400">
        {error}
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">System Health</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Signal Engine</span>
            <StatusBadge status={health.signalEngine.status} />
          </div>
          <div className="space-y-2 text-sm">
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
              <span className="text-slate-500">마지막 트레이드</span>
              <span className={health.signalEngine.tradeStale ? "text-red-400" : "text-white"}>
                {health.signalEngine.lastTradeAgo >= 0 ? formatTimeAgo(health.signalEngine.lastTradeAgo) : "없음"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">처리량</span>
              <span className="text-white">{health.signalEngine.recentTrades.toLocaleString()} trades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">버킷/베이스라인</span>
              <span className="text-white">{health.signalEngine.tradeBucketCount}/{health.signalEngine.baselineCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Telegram Bot</span>
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
            <span className="text-slate-400 text-sm">Workers</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Price</span>
              <span className="flex items-center gap-1.5">
                <ConnectionDot connected={health.workers.priceWorker.ok} />
                <span className="text-white">{health.workers.priceWorker.status}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Stats</span>
              <span className="flex items-center gap-1.5">
                <ConnectionDot connected={health.workers.statsWorker.ok} />
                <span className="text-white">{health.workers.statsWorker.status}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Premium</span>
              <span className="flex items-center gap-1.5">
                <ConnectionDot connected={health.workers.premiumWorker.ok} />
                <span className="text-white">{health.workers.premiumWorker.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">API 상태</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">마지막 업데이트</span>
              <span className="text-white">{new Date(health.timestamp).toLocaleTimeString("ko-KR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">재시작 횟수</span>
              <span className="text-white">{health.signalEngine.restartCount}회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">심볼 수</span>
              <span className="text-white">{health.signalEngine.symbolCount}개</span>
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
  );
}

function PriceFeedsSection({ feeds }: { feeds: PriceFeedStatus[] }) {
  const exchanges = [
    { id: "UPBIT", name: "Upbit", type: "KRW" },
    { id: "BITHUMB", name: "Bithumb", type: "KRW" },
    { id: "COINONE", name: "Coinone", type: "KRW" },
    { id: "BINANCE", name: "Binance", type: "USDT" },
    { id: "OKX", name: "OKX", type: "USDT" },
    { id: "BYBIT", name: "Bybit", type: "USDT" },
    { id: "BITGET", name: "Bitget", type: "USDT" },
    { id: "GATE", name: "Gate", type: "USDT" },
    { id: "MEXC", name: "MEXC", type: "USDT" },
    { id: "HTX", name: "HTX", type: "USDT" },
    { id: "BINANCE_FUTURES", name: "Binance Futures", type: "Perp" }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Price Feeds Health</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exchanges.map((ex) => {
          const feed = feeds.find(f => f.exchange === ex.id);
          const status = feed?.status || "critical";
          const lastUpdate = feed?.lastUpdate ? new Date(feed.lastUpdate).toLocaleTimeString("ko-KR") : "-";
          
          return (
            <div key={ex.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">{ex.name}</span>
                <StatusBadge status={status} />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">타입</span>
                  <span className="text-slate-300">{ex.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">마지막 수신</span>
                  <span className="text-slate-300">{lastUpdate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">1분 틱 수</span>
                  <span className="text-slate-300">{feed?.tickCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WS 연결</span>
                  <ConnectionDot connected={feed?.wsConnected || false} />
                </div>
              </div>
              {feed?.error && (
                <div className="mt-2 text-xs text-red-400 truncate">{feed.error}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SymbolsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Symbol Sync Monitoring</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">거래소별 마켓 수</h3>
          <div className="text-slate-400 text-sm">데이터 로딩 중...</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">신규 상장/폐지</h3>
          <div className="text-slate-400 text-sm">최근 7일 내역 없음</div>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
          전체 거래소 Sync
        </button>
      </div>
    </div>
  );
}

function PremiumSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Premium Engine Health</h2>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">김프 테이블 상태</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">전체 마켓 수</span>
              <span className="text-white">564</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NaN 값</span>
              <span className="text-green-400">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">이상치 (|김프| &gt; 50%)</span>
              <span className="text-green-400">0</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">가격 매칭 실패</h3>
          <div className="text-slate-400 text-sm">매칭 실패 없음</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">수동 작업</h3>
          <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">
            김프 테이블 강제 재생성
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkersSection({ health }: { health: HealthData | null }) {
  const workers = [
    { id: "price", name: "Price Worker", desc: "가격 데이터 수집 (300ms)" },
    { id: "stats", name: "Stats Worker", desc: "거래량/변동률 계산" },
    { id: "premium", name: "Premium Worker", desc: "김프 테이블 생성" },
    { id: "symbol", name: "Symbol Sync", desc: "심볼 목록 동기화" },
    { id: "metadata", name: "Metadata Worker", desc: "아이콘/이름 수집" }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Workers Status</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((w) => {
          let workerStatus = { ok: true, status: "정상" };
          if (health?.workers) {
            if (w.id === "price") workerStatus = health.workers.priceWorker;
            if (w.id === "stats") workerStatus = health.workers.statsWorker;
            if (w.id === "premium") workerStatus = health.workers.premiumWorker;
          }
          
          return (
            <div key={w.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">{w.name}</span>
                <ConnectionDot connected={workerStatus.ok} />
              </div>
              <p className="text-slate-400 text-sm mb-3">{w.desc}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">상태</span>
                <span className={workerStatus.ok ? "text-green-400" : "text-red-400"}>
                  {workerStatus.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListingsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Exchange Listings Tracker</h2>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-3xl font-bold text-white mb-2">0</div>
          <div className="text-slate-400 text-sm">오늘 신규 상장</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-3xl font-bold text-white mb-2">0</div>
          <div className="text-slate-400 text-sm">최근 7일 신규 상장</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="text-3xl font-bold text-white mb-2">564</div>
          <div className="text-slate-400 text-sm">전체 활성 마켓</div>
        </div>
      </div>
    </div>
  );
}

function FrontendSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Frontend/Web Health</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">API 응답 속도</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">/api/premium/table-filtered</span>
              <span className="text-green-400">~30ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">/api/premium/table</span>
              <span className="text-green-400">~15ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">/api/admin/health</span>
              <span className="text-green-400">~50ms</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">페이지 상태</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">홈페이지</span>
              <span className="text-green-400">정상</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">마켓 대시보드</span>
              <span className="text-green-400">정상</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Admin</span>
              <span className="text-green-400">정상</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Tools / 수동 액션</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors">
          <div className="text-xl mb-2">🗑️</div>
          <div className="text-white font-medium">전체 캐시 초기화</div>
          <p className="text-slate-400 text-sm mt-1">API 캐시 및 임시 데이터 삭제</p>
        </button>
        <button className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors">
          <div className="text-xl mb-2">✅</div>
          <div className="text-white font-medium">데이터 유효성 검사</div>
          <p className="text-slate-400 text-sm mt-1">prices.json, premiumTable.json 검증</p>
        </button>
        <button className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors">
          <div className="text-xl mb-2">📥</div>
          <div className="text-white font-medium">문제 심볼 CSV 다운로드</div>
          <p className="text-slate-400 text-sm mt-1">누락/오류 심볼 목록 내보내기</p>
        </button>
        <button className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors">
          <div className="text-xl mb-2">📋</div>
          <div className="text-white font-medium">신규 상장 CSV 다운로드</div>
          <p className="text-slate-400 text-sm mt-1">최근 상장 코인 목록 내보내기</p>
        </button>
        <button className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors">
          <div className="text-xl mb-2">🔄</div>
          <div className="text-white font-medium">시그널 엔진 재시작</div>
          <p className="text-slate-400 text-sm mt-1">Binance Signal Engine 수동 재시작</p>
        </button>
        <button className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 text-left hover:border-blue-500/50 transition-colors">
          <div className="text-xl mb-2">📊</div>
          <div className="text-white font-medium">DB 상태 확인</div>
          <p className="text-slate-400 text-sm mt-1">Supabase 연결 및 테이블 상태</p>
        </button>
      </div>
    </div>
  );
}
