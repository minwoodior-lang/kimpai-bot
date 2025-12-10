import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";
import { useAnalyticsHeartbeat } from "@/hooks/useAnalyticsHeartbeat";

function AppContent({ Component, pageProps }: AppProps) {
  useAnalyticsHeartbeat();
  return <Component {...pageProps} />;
}

export default function App(props: AppProps) {
  return (
    <ExchangeSelectionProvider>
      <AppContent {...props} />
    </ExchangeSelectionProvider>
  );
}
