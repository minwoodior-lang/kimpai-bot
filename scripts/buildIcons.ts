import fs from "fs";
import path from "path";
import axios from "axios";

interface MasterSymbol {
  symbol: string;
  name_ko?: string;
  name_en?: string;
  icon_path?: string;
  cmc_slug?: string | null;
}

interface CoinGeckoItem {
  id: string;
  symbol: string;
  name: string;
}

interface CoinGeckoDetail {
  id: string;
  symbol: string;
  name: string;
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
}

const COINGECKO_LIST_URL = "https://api.coingecko.com/api/v3/coins/list";
const COINGECKO_COIN_URL = "https://api.coingecko.com/api/v3/coins";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCoinGeckoList(): Promise<CoinGeckoItem[]> {
  try {
    console.log("[buildIcons] Fetching CoinGecko coins list...");
    const response = await axios.get<CoinGeckoItem[]>(COINGECKO_LIST_URL, {
      timeout: 30000,
    });
    console.log(`[buildIcons] Found ${response.data.length} coins in CoinGecko`);
    return response.data;
  } catch (err: any) {
    console.error("[buildIcons] Failed to fetch CoinGecko list:", err.message);
    return [];
  }
}

async function fetchCoinIcon(coinId: string): Promise<string | null> {
  try {
    const url = `${COINGECKO_COIN_URL}/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`;
    const response = await axios.get<CoinGeckoDetail>(url, { timeout: 15000 });
    const iconUrl = response.data.image?.small || response.data.image?.thumb || null;
    return iconUrl;
  } catch (err: any) {
    if (err.response?.status === 429) {
      console.log(`[buildIcons] Rate limited, waiting 60s...`);
      await sleep(60000);
      return fetchCoinIcon(coinId);
    }
    return null;
  }
}

function buildSymbolToIdMap(geckoList: CoinGeckoItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const coin of geckoList) {
    const upperSymbol = coin.symbol.toUpperCase();
    if (!map.has(upperSymbol)) {
      map.set(upperSymbol, coin.id);
    }
  }
  return map;
}

export async function buildIcons(): Promise<void> {
  const masterSymbolsPath = path.join(process.cwd(), "data", "master_symbols.json");
  const symbolIconsPath = path.join(process.cwd(), "data", "symbolIcons.json");

  if (!fs.existsSync(masterSymbolsPath)) {
    console.error("[buildIcons] master_symbols.json not found");
    return;
  }

  const masterSymbols: MasterSymbol[] = JSON.parse(
    fs.readFileSync(masterSymbolsPath, "utf-8")
  );

  let symbolIcons: Record<string, string> = {};
  try {
    symbolIcons = JSON.parse(fs.readFileSync(symbolIconsPath, "utf-8"));
  } catch {
    console.log("[buildIcons] symbolIcons.json not found, creating new one");
  }

  const missingIconSymbols = masterSymbols.filter(
    (s) => !s.icon_path && !symbolIcons[s.symbol]
  );

  if (missingIconSymbols.length === 0) {
    console.log("[buildIcons] No missing icons found. All symbols have icons.");
    return;
  }

  console.log(`[buildIcons] Found ${missingIconSymbols.length} symbols without icons`);

  const geckoList = await fetchCoinGeckoList();
  if (geckoList.length === 0) {
    console.error("[buildIcons] CoinGecko list is empty, skipping icon fetch");
    return;
  }

  const symbolToId = buildSymbolToIdMap(geckoList);

  let successCount = 0;
  let failedSymbols: string[] = [];
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 3000;
  const DELAY_BETWEEN_REQUESTS = 1500;

  for (let i = 0; i < missingIconSymbols.length; i += BATCH_SIZE) {
    const batch = missingIconSymbols.slice(i, i + BATCH_SIZE);
    console.log(
      `[buildIcons] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        missingIconSymbols.length / BATCH_SIZE
      )} (${batch.length} symbols)`
    );

    for (const symbol of batch) {
      const coinId = symbolToId.get(symbol.symbol);
      if (!coinId) {
        failedSymbols.push(symbol.symbol);
        continue;
      }

      const iconUrl = await fetchCoinIcon(coinId);
      if (iconUrl) {
        const masterIdx = masterSymbols.findIndex((s) => s.symbol === symbol.symbol);
        if (masterIdx !== -1) {
          masterSymbols[masterIdx].icon_path = iconUrl;
        }
        symbolIcons[symbol.symbol] = iconUrl;
        successCount++;
        console.log(`[buildIcons] ✓ ${symbol.symbol}: ${iconUrl}`);
      } else {
        failedSymbols.push(symbol.symbol);
      }

      await sleep(DELAY_BETWEEN_REQUESTS);
    }

    if (i + BATCH_SIZE < missingIconSymbols.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  fs.writeFileSync(masterSymbolsPath, JSON.stringify(masterSymbols, null, 2), "utf-8");
  fs.writeFileSync(symbolIconsPath, JSON.stringify(symbolIcons, null, 2), "utf-8");

  console.log(`\n[buildIcons] ========== Summary ==========`);
  console.log(`[buildIcons] ✓ Successfully fetched: ${successCount} icons`);
  console.log(`[buildIcons] ✗ Failed/Not found: ${failedSymbols.length} symbols`);

  if (failedSymbols.length > 0) {
    console.log(`[buildIcons] Failed symbols: ${failedSymbols.slice(0, 20).join(", ")}${failedSymbols.length > 20 ? "..." : ""}`);
  }

  console.log(`[buildIcons] Updated master_symbols.json and symbolIcons.json`);
}

if (require.main === module) {
  buildIcons()
    .then(() => {
      console.log("[buildIcons] Done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[buildIcons] Fatal error:", err);
      process.exit(1);
    });
}
