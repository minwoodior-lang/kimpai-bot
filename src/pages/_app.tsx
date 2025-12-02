import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler - debug uncaught errors
    function onError(event: ErrorEvent) {
      console.log("[GLOBAL ERROR]", {
        message: event.message,
        error: event.error,
        errorType: typeof event.error,
        errorConstructor: event.error?.constructor?.name,
        stack: event.error?.stack,
      });
      event.preventDefault();
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      console.log("[UNHANDLED REJECTION]", {
        reason: event.reason,
        reasonType: typeof event.reason,
        reasonConstructor: event.reason?.constructor?.name,
        reasonStack: event.reason?.stack,
      });
      event.preventDefault();
    }

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection, true);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
