import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler for unhandled exceptions - silently catch all
    const handleError = (event: ErrorEvent | Event) => {
      try {
        event.preventDefault();
      } catch (e) {
        // Ignore any errors
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        event.preventDefault();
      } catch (e) {
        // Ignore any errors
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
