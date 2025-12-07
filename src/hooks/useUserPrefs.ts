import { useState, useEffect, useCallback } from "react";

export interface UserPrefs {
  hideChart: boolean;
  priceUnit: "KRW" | "USDT";
  filterMode: "all" | "foreign" | "favorites";
  defaultTimeframe:
    | "1m" | "3m" | "5m" | "15m" | "30m"
    | "1h" | "2h" | "3h" | "4h" | "1d" | "1w";
  favorites: string[];
}

const defaultPrefs: UserPrefs = {
  hideChart: false,
  priceUnit: "KRW",
  filterMode: "all",
  defaultTimeframe: "5m",
  favorites: [],
};

const STORAGE_KEY = "kimpai_user_prefs";

/** ★ 모든 즐겨찾기 로직에서 사용하는 공통 정규화 함수 */
export function normalizeSymbol(symbol: string): string {
  return symbol
    .replace(/[-/]/g, "")
    .replace(/KRW|USDT|BTC/g, "")
    .toUpperCase();
}

export function useUserPrefs() {
  const [prefs, setPrefsState] = useState<UserPrefs>(defaultPrefs);
  const [isLoaded, setIsLoaded] = useState(false);

  /** 초기 로드 (클라이언트 전용) */
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const loaded = raw
        ? { ...defaultPrefs, ...JSON.parse(raw) }
        : defaultPrefs;

      if (!Array.isArray(loaded.favorites)) {
        loaded.favorites = [];
      }

      setPrefsState(loaded);
    } catch {
      setPrefsState(defaultPrefs);
    }

    setIsLoaded(true);
  }, []);

  /** 일반 prefs 업데이트 함수 */
  const setPrefs = (
    update:
      | Partial<UserPrefs>
      | ((prev: UserPrefs) => Partial<UserPrefs>)
  ) => {
    setPrefsState((prev) => {
      const nextUpdate =
        typeof update === "function" ? update(prev) : update;

      const merged = { ...prev, ...nextUpdate };

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(merged)
          );
        } catch {
          console.error("Failed to save prefs to localStorage");
        }
      }

      return merged;
    });
  };

  /** ★ 즐겨찾기 토글: raw symbol을 받아 normalizeSymbol()로 통일 */
  const toggleFavorite = useCallback((rawSymbol: string) => {
    const key = normalizeSymbol(rawSymbol);

    setPrefsState((prev) => {
      const current = prev.favorites || [];
      const exists = current.includes(key);

      const newFavorites = exists
        ? current.filter((s) => s !== key)
        : [...current, key];

      const merged = { ...prev, favorites: newFavorites };

      // localStorage 저장
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(merged)
          );
        } catch {
          console.error("Failed to save favorites to localStorage");
        }
      }

      return merged;
    });
  }, []);

  /** 즐겨찾기 여부 체크: normalizeSymbol 기준으로 판단 */
  const isFavorite = useCallback(
    (symbol: string): boolean => {
      const key = normalizeSymbol(symbol);
      return (prefs.favorites || []).includes(key);
    },
    [prefs.favorites]
  );

  return {
    prefs,
    setPrefs,
    isLoaded,
    toggleFavorite,
    isFavorite
  };
}
