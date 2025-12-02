import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 정의되지 않은 에러 타입 throw하는 라이브러리 방지
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const handleError = (event: ErrorEvent) => {
      // 모든 정의되지 않은/null 에러는 완전히 무시
      if (!event.error || event.error === null || event.error === undefined) {
        event.preventDefault();
        return;
      }
      
      // cross-origin 에러 무시
      if (event.message === "Script error." && !event.error?.stack) {
        event.preventDefault();
        return;
      }
      
      // 빈 메시지 에러 무시
      if (!event.message || event.message.trim() === "") {
        event.preventDefault();
        return;
      }

      // 실제 에러만 처리
      if (event.error instanceof Error) {
        console.debug("[App Error Caught]", event.error.message);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      // 모든 falsy 이유 무시
      if (
        !event.reason ||
        event.reason === null ||
        event.reason === undefined ||
        event.reason === "" ||
        typeof event.reason === "string" ||
        typeof event.reason === "number"
      ) {
        event.preventDefault();
        return;
      }

      // 실제 객체 에러만 로깅
      if (event.reason instanceof Error) {
        console.debug("[Rejection Caught]", event.reason.message);
      }
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
