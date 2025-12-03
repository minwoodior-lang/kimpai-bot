import { useState, useEffect } from "react";

export interface UserPrefs {
  hideChart: boolean;
  priceUnit: "KRW" | "USDT";
  filterMode: "all" | "foreign" | "favorites";
  defaultTimeframe: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "3h" | "4h" | "1d" | "1w";
}

const defaultPrefs: UserPrefs = {
  hideChart: false,
  priceUnit: "KRW",
  filterMode: "all",
  defaultTimeframe: "5m",
};

const STORAGE_KEY = "kimpai_user_prefs";

export function useUserPrefs() {
  const [prefs, setPrefsState] = useState<UserPrefs>(defaultPrefs);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드 (클라이언트만)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const loaded = raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
      setPrefsState(loaded);
    } catch {
      setPrefsState(defaultPrefs);
    }
    setIsLoaded(true);
  }, []);

  // 선호도 업데이트
  const setPrefs = (update: Partial<UserPrefs> | ((prev: UserPrefs) => Partial<UserPrefs>)) => {
    setPrefsState((prev) => {
      const nextUpdate = typeof update === "function" ? update(prev) : update;
      const merged = { ...prev, ...nextUpdate };

      // localStorage에 저장
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
          console.error("Failed to save prefs to localStorage");
        }
      }

      return merged;
    });
  };

  return { prefs, setPrefs, isLoaded };
}
