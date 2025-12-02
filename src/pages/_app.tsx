import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler - suppress ALL unhandled errors
    const errorHandler = (e: Event) => {
      try {
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch {}
      return false;
    };

    const rejectionHandler = (e: Event) => {
      try {
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch {}
      return false;
    };

    window.addEventListener('error', errorHandler, true);
    window.addEventListener('unhandledrejection', rejectionHandler, true);

    return () => {
      window.removeEventListener('error', errorHandler, true);
      window.removeEventListener('unhandledrejection', rejectionHandler, true);
    };
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
