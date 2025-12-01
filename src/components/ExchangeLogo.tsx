import Image from "next/image";
import { EXCHANGE_LOGOS } from "@/contexts/ExchangeSelectionContext";

interface ExchangeLogoProps {
  exchange: string;
  size?: number;
  className?: string;
}

export default function ExchangeLogo({ exchange, size = 20, className = "" }: ExchangeLogoProps) {
  const logoPath = EXCHANGE_LOGOS[exchange.toUpperCase()] || EXCHANGE_LOGOS["BINANCE"];
  
  return (
    <Image
      src={logoPath}
      alt={`${exchange} logo`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      unoptimized
    />
  );
}

export function ExchangeLogoImg({ exchange, size = 20, className = "" }: ExchangeLogoProps) {
  const logoPath = EXCHANGE_LOGOS[exchange.toUpperCase()] || EXCHANGE_LOGOS["BINANCE"];
  
  return (
    <img
      src={logoPath}
      alt={`${exchange} logo`}
      width={size}
      height={size}
      className={`rounded-full inline-block ${className}`}
    />
  );
}
