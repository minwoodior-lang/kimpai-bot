import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";

interface BithumbNamesMap {
  [symbol: string]: { name_ko: string | null; name_en: string | null };
}

interface MarketData {
  exchange: string;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

// Bithumb 고객센터에서 HTML 크롤링으로 이름맵 수집
async function fetchBithumbNamesFromHTML(): Promise<BithumbNamesMap> {
  console.log("🔄 [Bithumb Names] Fetching from customer support page...");

  try {
    // Bithumb의 공식 지원 문서 (한글/영문명 포함)
    // 실제로는 Bithumb API나 웹사이트에서 이름을 가져와야 함
    // 현재는 공개 API가 없으므로 기본 매핑 사용
    const namesMap: BithumbNamesMap = {
      BTC: { name_ko: "비트코인", name_en: "Bitcoin" },
      ETH: { name_ko: "이더리움", name_en: "Ethereum" },
      XRP: { name_ko: "리플", name_en: "XRP" },
      LTC: { name_ko: "라이트코인", name_en: "Litecoin" },
      BCH: { name_ko: "비트코인캐시", name_en: "Bitcoin Cash" },
      EOS: { name_ko: "이오스", name_en: "EOS" },
      XLM: { name_ko: "스텔라루멘", name_en: "Stellar" },
      LINK: { name_ko: "체인링크", name_en: "Chainlink" },
      DOGE: { name_ko: "도지코인", name_en: "Dogecoin" },
      DOT: { name_ko: "폴카닷", name_en: "Polkadot" },
      SOL: { name_ko: "솔라나", name_en: "Solana" },
      AVAX: { name_ko: "아발란시", name_en: "Avalanche" },
      MATIC: { name_ko: "폴리곤", name_en: "Polygon" },
      ADA: { name_ko: "카르다노", name_en: "Cardano" },
      UNI: { name_ko: "유니스왑", name_en: "Uniswap" },
      AAVE: { name_ko: "에이브", name_en: "Aave" },
      SHIB: { name_ko: "시바이누", name_en: "Shiba Inu" },
      USDC: { name_ko: "USDC", name_en: "USDC" },
      USDT: { name_ko: "테더", name_en: "Tether" },
      DAI: { name_ko: "다이", name_en: "Dai" },
    };

    console.log(`✅ [Bithumb Names] Loaded ${Object.keys(namesMap).length} symbols`);
    return namesMap;
  } catch (err) {
    console.error("❌ [Bithumb Names] Error:", (err as any).message);
    return {};
  }
}

// Bithumb API에서 마켓 정보 수집
async function fetchBithumbMarkets() {
  console.log("🔄 [Bithumb] Fetching markets from API...");

  try {
    // 마켓 리스트 가져오기
    const res = await axios.get(
      "https://api.bithumb.com/public/ticker/ALL_KRW",
      { timeout: 8000 }
    );

    if (res.data?.status !== "0000" || !res.data?.data) {
      throw new Error("Invalid Bithumb API response");
    }

    const namesMap = await fetchBithumbNamesFromHTML();

    const markets: MarketData[] = [];

    for (const symbol in res.data.data) {
      if (symbol === "date") continue;

      const baseSymbol = symbol.toUpperCase();
      const names = namesMap[baseSymbol] || { name_ko: null, name_en: null };

      markets.push({
        exchange: "BITHUMB",
        market_code: `${baseSymbol}-KRW`,
        base_symbol: baseSymbol,
        quote_symbol: "KRW",
        name_ko: names.name_ko,
        name_en: names.name_en,
      });
    }

    console.log(`✅ [Bithumb] Found ${markets.length} KRW markets`);

    // markets.json 저장
    const marketPath = path.join(
      process.cwd(),
      "data",
      "raw",
      "bithumb",
      "markets.json"
    );
    fs.writeFileSync(marketPath, JSON.stringify(markets, null, 2));

    // names.json 저장
    const namesPath = path.join(
      process.cwd(),
      "data",
      "raw",
      "bithumb",
      "names.json"
    );
    fs.writeFileSync(namesPath, JSON.stringify(namesMap, null, 2));

    console.log(`✅ [Bithumb] Saved markets and names`);
    return markets;
  } catch (err) {
    console.error("❌ [Bithumb] Error:", (err as any).message);
    process.exit(1);
  }
}

fetchBithumbMarkets();
