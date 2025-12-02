import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler - wrap non-Error exceptions and prevent crash
    const errorHandler = (event: ErrorEvent) => {
      try {
        const error = event.error;
        
        // 에러가 Error 객체가 아니면 래핑
        if (error && !(error instanceof Error)) {
          const wrappedError = new Error(`[GlobalErrorHandler] ${String(error)}`);
          console.error('[App] Non-Error exception caught:', wrappedError);
        } else if (error instanceof Error) {
          // 이미 Error 객체면 로그만
          if (!error.message.includes('Server-only module')) {
            console.error('[App] Unhandled error:', error.message);
          }
        }
        
        event.preventDefault();
        event.stopImmediatePropagation();
      } catch (handlerErr) {
        console.error('[App] Error handler itself failed:', handlerErr);
      }
      return false;
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      try {
        const reason = event.reason;
        
        // Promise rejection이 Error가 아니면 래핑
        if (reason && !(reason instanceof Error)) {
          const wrappedError = new Error(`[GlobalRejectionHandler] ${String(reason)}`);
          console.error('[App] Non-Error rejection caught:', wrappedError);
        } else if (reason instanceof Error) {
          console.error('[App] Unhandled rejection:', reason.message);
        }
        
        event.preventDefault();
      } catch (handlerErr) {
        console.error('[App] Rejection handler itself failed:', handlerErr);
      }
      return false;
    };

    window.addEventListener('error', errorHandler as EventListener, true);
    window.addEventListener('unhandledrejection', rejectionHandler as EventListener, true);

    return () => {
      window.removeEventListener('error', errorHandler as EventListener, true);
      window.removeEventListener('unhandledrejection', rejectionHandler as EventListener, true);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
