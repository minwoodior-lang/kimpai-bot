import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TopMarketInfoBar } from "@/components/top/TopMarketInfoBar";
import TopInfoBar from "@/components/top/TopInfoBar";

interface LayoutProps {
  children: React.ReactNode;
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-600 transition-colors"
      aria-label="맨 위로"
    >
      ↑
    </button>
  );
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // 세션 ID 초기화 및 하트비트
  useEffect(() => {
    let sessionId = localStorage.getItem("kimpai_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("kimpai_session_id", sessionId);
    }

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        // Silent
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: "/", label: "홈" },
    { href: "/markets", label: "시장 지표" },
    { href: "/analysis", label: "AI 분석" },
    { href: "/alerts", label: "알림" },
    { href: "/news", label: "뉴스" },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 dark:bg-slate-900 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900">
      <TopInfoBar />
      <header className="sm:sticky sm:top-0 z-50 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 backdrop-blur border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-5">
          <TopMarketInfoBar />

          <nav className="border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex justify-between items-center h-14">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm dark:text-white light:text-white">K</span>
                </div>
                <span className="text-xl font-bold dark:text-white light:text-slate-900">KimpAI</span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors ${
                      isActive(link.href)
                        ? "dark:text-white light:text-slate-900 font-medium"
                        : "dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 transition-colors text-sm"
                  title={`${theme === "light" ? "다크" : "라이트"} 모드`}
                >
                  {theme === "light" ? "🌙" : "☀️"}
                </button>
                <Link
                  href="/login"
                  className="dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 transition-colors text-sm"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:text-white light:text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                >
                  회원가입
                </Link>
              </div>

              <button
                className="md:hidden dark:text-white light:text-slate-900 p-2"
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
              <div className="md:hidden py-4 border-t dark:border-slate-700/50 light:border-slate-200">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`transition-colors ${
                        isActive(link.href)
                          ? "dark:text-white light:text-slate-900 font-medium"
                          : "dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 transition-colors text-sm py-2"
                  >
                    {theme === "light" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
                  </button>
                  <div className="mt-4 flex gap-2 pt-4 border-t dark:border-slate-700/50 light:border-slate-200">
                    <button className="flex-1 rounded-lg border dark:border-slate-600 light:border-slate-300 py-2 text-sm dark:text-slate-300 light:text-slate-700 dark:hover:text-white light:hover:text-slate-900 transition-colors">
                      로그인
                    </button>
                    <button className="flex-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 py-2 text-sm font-semibold dark:text-white light:text-white transition-colors">
                      회원가입
                    </button>
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="border-t dark:border-slate-800 light:border-slate-200 mt-10">
        <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-5 py-8">
          <div className="space-y-3 dark:text-slate-400 light:text-slate-600 text-[12px]">
            <p className="leading-relaxed">
              데이터 출처: 업비트, 빗썸, 코인원, 바이낸스 등 주요 국내·글로벌 거래소의 공개 API를 사용합니다.
            </p>
            <p className="leading-relaxed">
              AI 분석: 과거 김프 패턴과 거래량, 시장 심리를 기반으로 한 예측 모델을 활용합니다.
            </p>
            <p className="dark:text-slate-500 light:text-slate-500 text-[11px] mt-4">
              © 2024 KimpAI. 모든 권리 보유.
            </p>
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
