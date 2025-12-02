import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler for unhandled exceptions
    const handleError = (event: ErrorEvent | Event) => {
      try {
        const errorEvent = event as ErrorEvent;
        if (errorEvent.error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Global Error]', errorEvent.error instanceof Error ? errorEvent.error.message : String(errorEvent.error));
          }
          event.preventDefault();
        } else if (!errorEvent.error) {
          // Silently ignore errors where error is null/undefined
          event.preventDefault();
        }
      } catch (e) {
        // Catch any errors in error handler itself
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        if (event.reason) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Unhandled Rejection]', event.reason instanceof Error ? event.reason.message : String(event.reason));
          }
          event.preventDefault();
        } else {
          event.preventDefault();
        }
      } catch (e) {
        // Catch any errors in rejection handler itself
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
