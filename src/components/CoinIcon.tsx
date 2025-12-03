import React, { useEffect, useState } from "react";
import { BAD_ICON_SYMBOLS } from "@/config/badIconSymbols";

interface CoinIconProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconUrl?: string | null; // master_symbols.icon_url
}

const COIN_ID_MAP: Record<string, string> = {};
const GRADIENT_COLORS: Record<string, string> = {};

const loggedMissingIcons = new Set<string>();

function normalizeSymbol(symbol: string) {
  return symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export default function CoinIcon({
  symbol,
  size = "md",
  className = "",
  iconUrl,
}: CoinIconProps) {
  const normalized = normalizeSymbol(symbol);
  const lower = normalized.toLowerCase();
  const upper = normalized.toUpperCase();

  const [cdnIndex, setCdnIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  // BAD_ICON_SYMBOLS 에 포함된 심볼은 항상 Placeholder 사용
  const forcePlaceholder = BAD_ICON_SYMBOLS.includes(upper);
  const finalIconUrl = forcePlaceholder ? null : iconUrl;
  
  // DEBUG: H/A 코인 디버깅
  if (upper === "H" || upper === "A") {
    console.log("[CoinIcon DEBUG] H/A Coin:", {
      raw_symbol: symbol,
      normalized: upper,
      iconUrl,
      forcePlaceholder,
      BAD_ICON_SYMBOLS,
      finalIconUrl,
    });
  }

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  // 2) 로컬 기본 경로
  const localIcon = `/coins/${upper}.png`;

  // 3) 아이콘 시도 우선순위
  const iconSources = [
    finalIconUrl && finalIconUrl.trim() ? finalIconUrl : null, // 1순위: DB
    localIcon, // 2순위: /public/coins/SYMBOL.png
    `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${lower}.png`,
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${lower}.png`,
    `https://static.coincap.io/assets/icons/${lower}@2x.png`,
    COIN_ID_MAP[upper]
      ? `https://assets.coingecko.com/coins/images/1/small/${COIN_ID_MAP[upper]}.png`
      : null,
    `https://www.cryptocompare.com/media/37746251/${lower}.png`,
  ].filter(Boolean) as string[];

  const handleError = () => {
    if (cdnIndex < iconSources.length - 1) {
      setCdnIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  useEffect(() => {
    if (hasError && process.env.NODE_ENV === "development") {
      if (!loggedMissingIcons.has(upper)) {
        loggedMissingIcons.add(upper);
        console.warn("[CoinIcon] Missing icon for:", upper);
      }
    }
  }, [hasError, upper]);

  if (hasError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-slate-600 flex items-center justify-center text-white font-bold ${textSizes[size]} ${className}`}
      >
        {upper.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={iconSources[cdnIndex]}
      alt={upper}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      onError={handleError}
      loading="lazy"
    />
  );
}
