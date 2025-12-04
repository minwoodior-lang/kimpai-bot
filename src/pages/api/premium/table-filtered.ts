import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

function loadPremiumTable(): any[] {
  try {
    const file = path.join(process.cwd(), "data", "premiumTable.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function loadExchangeMarkets(): any[] {
  try {
    const file = path.join(process.cwd(), "data", "exchange_markets.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function loadMasterSymbols(): any[] {
  try {
    const file = path.join(process.cwd(), "data", "master_symbols.json");
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const premiumTable = loadPremiumTable();
    const exchangeMarkets = loadExchangeMarkets();
    const masterSymbols = loadMasterSymbols();

    const results: any[] = [];

    for (const row of premiumTable) {
      const symbol = row.symbol;
      const baseSymbol = symbol.includes("/") ? symbol.split("/")[0] : symbol;

      // master_symbols 매칭 (base_symbol 기반)
      const master = masterSymbols.find((m: any) => m.base_symbol === baseSymbol || m.symbol === baseSymbol);

      // exchange_markets 매칭
      const market = exchangeMarkets.find((m: any) => m.base === baseSymbol);

      // cmcSlug 우선순위 (어디에 있어도 무조건 잡히도록 설정)
      const cmcSlug =
        row.cmcSlug ||           // premiumTable.json (최상위 우선)
        market?.cmcSlug ||       // exchange_markets.json
        master?.cmc_slug ||      // master_symbols.cmc_slug
        null;                    // 없으면 null → 프론트는 /search?q= 처리

      // cmcSlug를 반드시 응답에 포함해야 프론트가 정상 작동합니다.
      results.push({
        symbol: row.symbol,
        koreanName: row.koreanName || row.name_ko,
        domesticPrice: row.koreanPrice,
        globalPrice: row.globalPrice,
        premium: row.premium,
        domesticExchange: row.domesticExchange,
        foreignExchange: row.foreignExchange,
        volume24hKrw: row.volume24hKrw,
        volume24hUsdt: row.volume24hUsdt,
        change24h: row.change24h,
        cmcSlug: cmcSlug,     // ← 핵심! 반드시 포함해야 함
      });
    }

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (err) {
    console.error("TABLE FILTER ERROR:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
