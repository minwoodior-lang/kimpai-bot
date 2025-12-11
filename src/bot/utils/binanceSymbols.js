// src/bot/utils/binanceSymbols.js
// Binance TOP Symbols 헬퍼
// 우선 순위:
//  1) Render Proxy (TOP_SYMBOLS_URL)  → kimpai-price-proxy-1
//  2) Binance 24h ticker 직접 호출    → 451 나면 조용히 포기
//  3) FALLBACK_SYMBOLS               → 최소 동작 보장

const axios = require("axios");

// ✅ 최후 보루용 하드코딩 심볼들 (전부 소문자 usdt 마켓)
const FALLBACK_SYMBOLS = [
  "btcusdt",
  "ethusdt",
  "bnbusdt",
  "solusdt",
  "xrpusdt",
  "adausdt",
  "dogeusdt",
  "linkusdt",
  "ltcusdt",
  "uniusdt",
  "avaxusdt",
  "opusdt",
  "arbust",
  "suiusdt",
  "tonusdt",
  "stptusdt",
  "pepeusdt",
  "wifusdt",
  "bonkusdt",
];

// ⏱ 메모리 캐시 – Render / Binance API를 너무 자주 안 두드리게
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

let cache = {
  updatedAt: 0,
  symbols: FALLBACK_SYMBOLS,
};

// Render Proxy URL (Railway 환경변수에서 주입)
// 예) https://kimpai-price-proxy-1.onrender.com/api/internal/top-symbols
const TOP_SYMBOLS_URL = process.env.TOP_SYMBOLS_URL;

// ------------------------------------------------------------
// 1) Render(kimpai-price-proxy)에서 TOP 심볼 가져오기
//    응답 예: { ok:true, count:100, symbols:[ "btcusdt", ... ] }
//    또는 그냥 ["btcusdt", "ethusdt", ...] 배열일 수도 있다고 가정
// ------------------------------------------------------------
async function fetchFromRender() {
  if (!TOP_SYMBOLS_URL) {
    console.log("[TopSymbols] TOP_SYMBOLS_URL not set, skip Render fetch");
    return null;
  }

  try {
    const res = await axios.get(TOP_SYMBOLS_URL, { timeout: 5000 });

    let list = res.data;

    // 응답 타입이 배열인지 / { symbols: [...] } 인지 체크
    if (Array.isArray(list)) {
      // OK
    } else if (Array.isArray(list?.symbols)) {
      list = list.symbols;
    } else {
      console.warn(
        "[TopSymbols] Render API 응답 포맷이 배열이 아님 → FALLBACK 사용"
      );
      return null;
    }

    const symbols = list
      .map((s) => String(s).toLowerCase())
      .filter((s) => s.endsWith("usdt"));

    if (symbols.length === 0) {
      console.warn("[TopSymbols] Render API에서 유효한 USDT 심볼이 없음");
      return null;
    }

    console.log(
      `[TopSymbols] Loaded from Render (${symbols.length} symbols)`
    );
    return symbols;
  } catch (err) {
    const status = err?.response?.status;
    const msg = status ? `HTTP ${status}` : err.message;
    console.warn("[TopSymbols] Render fetch error:", msg);
    return null;
  }
}

// ------------------------------------------------------------
// 2) Binance 24h ticker에서 직접 상위 100개 랭킹
//    지역 제한(451) / 네트워크 에러 나면 그냥 null 리턴
// ------------------------------------------------------------
async function fetchFromBinance() {
  try {
    const res = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      { timeout: 7000 }
    );

    const rows = res.data;

    // USDT 마켓만 필터링
    const usdtRows = rows.filter(
      (r) => r.symbol && r.symbol.endsWith("USDT")
    );

    // quoteVolume 기준 상위 100개
    const sorted = usdtRows
      .map((r) => ({
        symbol: r.symbol.toLowerCase(),
        quoteVolume: parseFloat(r.quoteVolume || "0"),
      }))
      .filter((r) => r.quoteVolume > 0)
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, 100);

    const symbols = sorted.map((r) => r.symbol);

    if (symbols.length === 0) {
      console.warn("[TopSymbols] Binance 24h ticker에서 심볼 0개 → skip");
      return null;
    }

    console.log(
      `[TopSymbols] Loaded from Binance (${symbols.length} symbols)`
    );
    return symbols;
  } catch (err) {
    const status = err?.response?.status;
    const msg = status ? `HTTP ${status}` : err.message;
    console.warn("[TopSymbols] Binance fetch error:", msg);
    return null;
  }
}

// ------------------------------------------------------------
// 3) 공개 함수: getTopSymbols()
//    - 캐시 유효 → 바로 리턴
//    - Render → 실패하면 Binance → 실패하면 FALLBACK
// ------------------------------------------------------------
async function getTopSymbols() {
  const now = Date.now();

  // 1) 캐시가 살아있으면 그대로 사용
  if (now - cache.updatedAt < CACHE_TTL_MS && cache.symbols?.length) {
    return cache.symbols;
  }

  // 2) Render(kimpai-price-proxy) 먼저 시도
  let symbols = await fetchFromRender();

  // 3) Render 실패 시 Binance 직접 시도
  if (!symbols) {
    symbols = await fetchFromBinance();
  }

  // 4) 둘 다 실패하면 FALLBACK 사용
  if (!symbols || symbols.length === 0) {
    console.warn(
      "[TopSymbols] All fetch failed → FALLBACK_SYMBOLS 사용"
    );
    symbols = FALLBACK_SYMBOLS;
  }

  cache = {
    updatedAt: now,
    symbols,
  };

  return symbols;
}

module.exports = {
  getTopSymbols,
  FALLBACK_SYMBOLS,
};
