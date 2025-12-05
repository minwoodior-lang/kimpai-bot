import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface LayoutProps {
  children: React.ReactNode;
  isChatOpen?: boolean;
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
      className="fixed bottom-24 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-600 transition-colors"
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

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 overflow-x-hidden">
      <header className="w-full bg-[#020617] border-b border-white/5 overflow-x-hidden">
        <div className="mx-auto max-w-[1280px] px-6 flex items-center justify-between h-14">
          <nav className="border-b border-slate-800 flex-1">
            <div className="flex justify-between items-center h-14">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm text-white">K</span>
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
                className="md:hidden text-white p-2 z-50 relative"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="메뉴"
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
          </nav>
        </div>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 모바일 메뉴 슬라이드인 패널 */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 md:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">메뉴</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 네비게이션 링크 */}
          <nav className="flex flex-col gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-lg transition-colors text-left ${
                  isActive(link.href)
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* 테마 토글 */}
            <button
              onClick={() => {
                setTheme(theme === "light" ? "dark" : "light");
              }}
              className="px-4 py-3 rounded-lg text-left text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors mt-2"
            >
              {theme === "light" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
            </button>
          </nav>

          {/* 하단 버튼 */}
          <div className="flex flex-col gap-3 pt-6 border-t border-slate-700">
            <Link
              href="/login"
              className="w-full rounded-lg border border-slate-600 py-3 text-center text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3 text-center text-sm font-semibold text-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-grow">{children}</main>

      <footer className="border-t dark:border-slate-800 light:border-slate-200 mt-10">
        <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-6 py-4 sm:py-8">
          <div className="space-y-2 sm:space-y-3 dark:text-slate-400 light:text-slate-600 text-[10px] sm:text-[12px] leading-relaxed sm:leading-relaxed" style={{lineHeight: '1.2'}}>
            <p className="max-w-[90%]">
              데이터 출처: 업비트, 빗썸, 코인원, 바이낸스 등 주요 국내·글로벌 거래소의 공개 API를 사용합니다.
            </p>
            <p className="max-w-[90%]">
              AI 분석: 과거 김프 패턴과 거래량, 시장 심리를 기반으로 한 예측 모델을 활용합니다.
            </p>
            <p className="dark:text-slate-500 light:text-slate-500 text-[9px] sm:text-[11px] mt-2 sm:mt-4">
              © 2024 KimpAI. 모든 권리 보유.
            </p>
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}
