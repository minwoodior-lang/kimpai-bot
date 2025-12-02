import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global error handler - suppress all unhandled errors
    window.addEventListener('error', (e) => {
      try { e.preventDefault(); } catch { }
    }, true);

    window.addEventListener('unhandledrejection', (e) => {
      try { e.preventDefault(); } catch { }
    }, true);
  }, []);

  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
