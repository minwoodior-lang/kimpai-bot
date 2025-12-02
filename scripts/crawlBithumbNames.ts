import fs from "fs";
import path from "path";
import cheerio from "cheerio";

interface BithumbNameMap {
  [symbol: string]: { name_ko?: string; name_en?: string };
}

async function crawlBithumbNames(): Promise<BithumbNameMap> {
  const nameMap: BithumbNameMap = {};

  try {
    console.log("🔄 Crawling Bithumb official page...");

    // Bithumb 거래 정보 페이지에서 크롤링
    const res = await fetch("https://bithumb.com/information/trade", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Bithumb 페이지에서 코인 정보 추출
    // 여러 셀렉터 시도
    $("td, tr, div").each((_, el) => {
      const text = $(el).text().trim();
      
      // 코인 심볼과 이름 패턴 매칭
      const match = text.match(/([A-Z0-9]+)\s+([가-힣\w\s]+)/);
      if (match && match[1].length <= 10 && match[2].length > 0) {
        const symbol = match[1].toUpperCase();
        const name = match[2].trim();

        if (name && !nameMap[symbol]) {
          nameMap[symbol] = {
            name_ko: name,
          };
        }
      }
    });

    // 대체 방법: 테이블 행에서 추출
    $("table tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 2) {
        const symbol = cells.eq(0).text().trim().toUpperCase();
        const nameKo = cells.eq(1).text().trim();

        if (symbol && nameKo && symbol.length <= 10 && nameKo.length > 0) {
          if (!nameMap[symbol]) {
            nameMap[symbol] = { name_ko: nameKo };
          }
        }
      }
    });

    console.log(`✅ Crawled ${Object.keys(nameMap).length} coins from Bithumb`);

    if (Object.keys(nameMap).length === 0) {
      console.warn("⚠ Crawling returned no results, using fallback method");
      return getFallbackBithumbNames();
    }

    return nameMap;
  } catch (err) {
    console.warn("⚠ Crawling failed, using fallback:", err);
    return getFallbackBithumbNames();
  }
}

function getFallbackBithumbNames(): BithumbNameMap {
  // 주요 코인 한글명 데이터베이스
  return {
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
    USDC: { name_ko: "유에스디", name_en: "USDC" },
    USDT: { name_ko: "테더", name_en: "Tether" },
    DAI: { name_ko: "다이", name_en: "Dai" },
    WBTC: { name_ko: "래핑된비트코인", name_en: "Wrapped Bitcoin" },
    SNX: { name_ko: "신세틱스", name_en: "Synthetix" },
    CRV: { name_ko: "커브", name_en: "Curve" },
    YFI: { name_ko: "예피나인스", name_en: "Yearn Finance" },
    SUSHI: { name_ko: "스시", name_en: "Sushi" },
    COMP: { name_ko: "컴파운드", name_en: "Compound" },
    MKR: { name_ko: "메이커", name_en: "Maker" },
    GRT: { name_ko: "더그래프", name_en: "The Graph" },
    ENS: { name_ko: "이더리움네임서비스", name_en: "Ethereum Name Service" },
    BNB: { name_ko: "바이낸스코인", name_en: "BNB" },
    ALGO: { name_ko: "알고랜드", name_en: "Algorand" },
    ATOM: { name_ko: "코스모스", name_en: "Cosmos" },
    NEAR: { name_ko: "니어", name_en: "NEAR" },
    FIL: { name_ko: "파일코인", name_en: "Filecoin" },
    XTZ: { name_ko: "테조스", name_en: "Tezos" },
    ONT: { name_ko: "온톨로지", name_en: "Ontology" },
    KSM: { name_ko: "쿠사마", name_en: "Kusama" },
    KAIA: { name_ko: "카이아", name_en: "Kaia" },
    ONG: { name_ko: "온토로지가스", name_en: "ONG" },
    JST: { name_ko: "저스트", name_en: "JUST" },
    TRX: { name_ko: "트론", name_en: "TRON" },
    ICX: { name_ko: "아이콘", name_en: "ICON" },
    ETC: { name_ko: "이더리움클래식", name_en: "Ethereum Classic" },
    QTUM: { name_ko: "퀀텀", name_en: "Qtum" },
    VET: { name_ko: "비챗", name_en: "VeChain" },
    KNC: { name_ko: "카일로", name_en: "Kyber" },
    ZIL: { name_ko: "질리카", name_en: "Zilliqa" },
    BAT: { name_ko: "베이직어텐션토큰", name_en: "Basic Attention Token" },
    THETA: { name_ko: "세타", name_en: "Theta" },
    ZRX: { name_ko: "0x", name_en: "0x Protocol" },
    WAVES: { name_ko: "웨이브스", name_en: "Waves" },
    ENJ: { name_ko: "엔진코인", name_en: "Enjin Coin" },
  };
}

async function main() {
  try {
    const nameMap = await crawlBithumbNames();
    
    const outPath = path.join("data", "raw", "bithumb", "names.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(nameMap, null, 2), "utf-8");

    console.log(`✅ Bithumb names saved: ${Object.keys(nameMap).length} coins with Korean names`);
  } catch (err) {
    console.error("❌ Crawling failed:", err);
    process.exit(1);
  }
}

main();
