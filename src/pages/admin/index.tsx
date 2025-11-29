import Head from "next/head";
import Link from "next/link";

export default function AdminIndex() {
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
            <p className="text-slate-400">Manage users, content, and system settings</p>
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
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">New user registered</span>
                  <span className="text-slate-500 text-sm">5 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Pro subscription activated</span>
                  <span className="text-slate-500 text-sm">15 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">API rate limit warning</span>
                  <span className="text-slate-500 text-sm">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">System backup completed</span>
                  <span className="text-slate-500 text-sm">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
