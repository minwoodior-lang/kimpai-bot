import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ExchangeSelectionProvider>
      <Component {...pageProps} />
    </ExchangeSelectionProvider>
  );
}
