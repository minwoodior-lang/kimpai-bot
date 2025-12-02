import fs from "fs";
import path from "path";
import axios from "axios";

interface PremiumRow {
  symbol: string;
  koreanPrice: number;
  globalPriceKrw: number;
  premium: number;
  domesticExchange: string;
  foreignExchange: string;
  timestamp: string;
}

async function fetchUpbitPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://api.upbit.com/v1/ticker?markets=KRW-${symbol}`
    );
    if (response.data && response.data.length > 0) {
      return response.data[0].trade_price;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchOkxPrice(
  symbol: string,
  fxRate: number = 1340
): Promise<number | null> {
  try {
    const instId =
      symbol === "BTC"
        ? "BTC-USDT"
        : symbol === "ETH"
          ? "ETH-USDT"
          : null;
    if (!instId) return null;

    const response = await axios.get(
      `https://www.okx.com/api/v5/market/ticker?instId=${instId}`
    );
    if (response.data && response.data.data && response.data.data.length > 0) {
      const priceUsd = Number(response.data.data[0].last);
      return priceUsd * fxRate;
    }
  } catch {
    return null;
  }
  return null;
}

async function main() {
  console.log(
    `[priceWorker] 시작: ${new Date().toISOString()}`
  );

  try {
    let fxRate = 1340;
    try {
      const rateResponse = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      fxRate = rateResponse.data.rates.KRW || 1340;
    } catch {
      console.warn("[FX] 환율 조회 실패, 기본값 사용");
    }

    const symbols = ["BTC", "ETH"];
    const results: PremiumRow[] = [];

    for (const symbol of symbols) {
      const upbitPrice = await fetchUpbitPrice(symbol);
      const okxPrice = await fetchOkxPrice(symbol, fxRate);

      if (upbitPrice && okxPrice) {
        const premium = ((upbitPrice - okxPrice) / okxPrice) * 100;

        results.push({
          symbol,
          koreanPrice: upbitPrice,
          globalPriceKrw: okxPrice,
          premium,
          domesticExchange: "UPBIT",
          foreignExchange: "OKX",
          timestamp: new Date().toISOString(),
        });

        console.log(
          `[${symbol}] 김프: ${premium.toFixed(2)}% (업비트: ${upbitPrice}, OKX: ${okxPrice.toFixed(0)})`
        );
      }
    }

    const filePath = path.join(process.cwd(), "data", "premiumTable.json");
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    console.log(`[priceWorker] 완료: ${filePath}`);
  } catch (error) {
    console.error("[priceWorker] 오류:", error);
    process.exit(1);
  }
}

main();
