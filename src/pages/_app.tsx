import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // 외부 스크립트 공통 에러("Script error.")는 무시 (cross-origin 에러)
      if (event.message === "Script error." && !event.error) {
        return;
      }

      console.log("[GLOBAL ERROR]", {
        message: event.message,
        error: event.error,
        errorType: typeof event.error,
        errorConstructor: event.error?.constructor?.name,
        stack: (event.error as any)?.stack,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      // 단순 문자열/숫자 등 타입도 안전하게 로깅
      const err: any = event.reason;
      console.log("[UNHANDLED REJECTION]", {
        reason: err,
        type: typeof err,
        ctor: err?.constructor?.name,
        stack: err?.stack,
      });
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
