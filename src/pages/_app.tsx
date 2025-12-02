import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

// 글로벌 에러 억제 설정
if (typeof window !== "undefined") {
  // 콘솔 에러 강제 억제
  const suppressErrors = () => {
    window.addEventListener(
      "error",
      (e: ErrorEvent) => {
        // 정의되지 않은 에러, null/undefined 에러 완전 차단
        if (!e.error || e.message?.includes("uncaught exception")) {
          e.preventDefault();
          return true;
        }
      },
      true
    );

    window.addEventListener(
      "unhandledrejection",
      (e: PromiseRejectionEvent) => {
        // 모든 undefined/null/문자열 거부는 무시
        if (!e.reason || typeof e.reason !== "object") {
          e.preventDefault();
          return true;
        }
      },
      true
    );
  };

  suppressErrors();
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 추가 에러 억제 (HMR 등 내부 라이브러리 에러)
    const handleError = (e: ErrorEvent) => {
      if (!e.error || !e.message) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    const handleRejection = (e: PromiseRejectionEvent) => {
      if (!e.reason) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection, true);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection, true);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
