import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // 모든 cross-origin 및 정의되지 않은 에러 무시
      if (event.message === "Script error." && !event.error) {
        event.preventDefault();
        return;
      }
      
      // undefined/null 에러는 무시 (내부 라이브러리 버그)
      if (!event.error || typeof event.error === 'undefined') {
        event.preventDefault();
        return;
      }

      // 실제 에러만 로깅
      console.debug("[App Error]", event.message, event.error?.stack);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      // undefined/null 거부는 무시
      if (!event.reason) {
        event.preventDefault();
        return;
      }
      
      // 문자열 형 거부는 무시 (라이브러리 버그)
      if (typeof event.reason === 'string') {
        event.preventDefault();
        return;
      }

      console.debug("[Promise Rejection]", event.reason);
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection, true);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection, true);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
