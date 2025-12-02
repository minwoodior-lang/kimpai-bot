import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler - silently suppress all unhandled exceptions
    const errorHandler = (event: ErrorEvent) => {
      try {
        event.preventDefault();
        event.stopImmediatePropagation();
        // Silently suppress - don't log to avoid triggering error handler loops
      } catch (handlerErr) {
        // Suppress handler errors silently
      }
      return true; // Consumed
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      try {
        event.preventDefault();
        // Silently suppress - don't log to avoid triggering error handler loops
      } catch (handlerErr) {
        // Suppress handler errors silently
      }
      return true; // Consumed
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
