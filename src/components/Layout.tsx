import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { TopMarketInfoBar } from "@/components/top/TopMarketInfoBar";

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
      {/* Market Info Bar */}
      <TopMarketInfoBar />

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

            <div className="hidden md:flex items-center gap-3">
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
                <div className="mt-4 flex gap-2 pt-4 border-t border-slate-700/50">
                  <button className="flex-1 rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                    로그인
                  </button>
                  <button className="flex-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors">
                    회원가입
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="border-t border-slate-800 mt-10">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-5 py-8">
          <div className="space-y-3 text-slate-400 text-[12px]">
            <p className="leading-relaxed">
              데이터 출처: 업비트, 빗썸, 코인원, 바이낸스 등 주요 국내·글로벌 거래소의 공개 API를 사용합니다.
            </p>
            <p className="leading-relaxed">
              AI 분석: 과거 김프 패턴과 거래량, 시장 심리를 기반으로 한 예측 모델을 활용합니다.
            </p>
            <p className="text-slate-500 text-[11px] mt-4">
              © 2024 KimpAI. 모든 권리 보유.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
