import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "홈" },
    { href: "/markets", label: "시장 지표" },
    { href: "/analysis", label: "AI 분석" },
    { href: "/alerts", label: "알림" },
    { href: "/news", label: "뉴스" },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* TopInfoBar - COMPLETELY SEPARATE */}
      <div className="border-b border-slate-700/50 bg-slate-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-1 text-xs text-slate-400">
            <div className="flex justify-between items-center">
              <span>🇰🇷 Korean Market Data - Real-time Kimchi Premium Tracking</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-white">KimpAI</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActive(link.href)
                      ? "text-white font-medium"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <span className="text-slate-400 text-sm">USDT/KRW ₩1,350</span>
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors text-sm"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
              >
                회원가입
              </Link>
            </div>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-700/50">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors ${
                      isActive(link.href)
                        ? "text-white font-medium"
                        : "text-slate-300 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-700/50">
                  <Link
                    href="/login"
                    className="text-slate-300 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="border-t border-slate-700/50 bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Data Sources</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                KimpAI aggregates real-time data from major Korean exchanges (Upbit, Bithumb, Korbit) 
                and global exchanges (Binance, Coinbase, Kraken). We also integrate live USD/KRW 
                foreign exchange rates to calculate accurate Kimchi Premium percentages across 
                multiple trading pairs.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">AI Analysis Methodology</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our AI models analyze historical premium patterns, trading volumes, market sentiment, 
                and cross-exchange arbitrage opportunities. Using machine learning algorithms trained 
                on years of market data, we provide predictive insights and actionable trading signals 
                for the Korean crypto market.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-white">KimpAI</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 KimpAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
