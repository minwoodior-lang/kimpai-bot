import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { ExchangeSelectionProvider } from "@/contexts/ExchangeSelectionContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <ExchangeSelectionProvider>
        <Component {...pageProps} />
      </ExchangeSelectionProvider>
    </ThemeProvider>
  );
}
