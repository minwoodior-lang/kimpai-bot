import fs from "fs";
import path from "path";

interface CoinInfo {
  symbol: string;
  name_ko?: string;
  name_en?: string;
}

interface BithumbNameMap {
  [symbol: string]: { name_ko?: string; name_en?: string };
}

// CoinGecko API를 사용해서 모든 코인 정보 크롤링
async function crawlFromCoinGecko(): Promise<BithumbNameMap> {
  const nameMap: BithumbNameMap = {};

  try {
    console.log("🔄 Fetching coin data from CoinGecko...");

    // CoinGecko에서 모든 코인 목록 가져오기 (한국어 포함)
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/list?include_platform=false",
      {
        headers: {
          "Accept-Language": "ko",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API failed: ${res.status}`);
    }

    const coins: Array<{ id: string; symbol: string; name: string }> =
      await res.json();

    // 각 코인의 상세 정보 가져오기 (배치 처리)
    const batchSize = 10;
    for (let i = 0; i < coins.length; i += batchSize) {
      const batch = coins.slice(i, i + batchSize);
      const promises = batch.map(async (coin) => {
        try {
          const detailRes = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=ko`,
            {
              headers: {
                "Accept-Language": "ko",
              },
            }
          );

          if (detailRes.ok) {
            const detail = await detailRes.json();
            const symbol = coin.symbol.toUpperCase();
            const nameEn = detail.name || coin.name;
            const nameKo = detail.localization?.ko || "";

            if (nameKo && nameKo.length > 0) {
              nameMap[symbol] = {
                name_ko: nameKo,
                name_en: nameEn,
              };
            } else {
              nameMap[symbol] = {
                name_en: nameEn,
              };
            }
          }
        } catch (err) {
          // 개별 코인 크롤링 실패는 무시
        }
      });

      await Promise.all(promises);
      console.log(
        `✅ Processed ${Math.min(i + batchSize, coins.length)}/${coins.length} coins`
      );

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return nameMap;
  } catch (err) {
    console.warn("⚠ CoinGecko crawl failed, using fallback", err);
    return {};
  }
}

// 기존 names.json 로드
function loadExistingNames(): BithumbNameMap {
  const filePath = path.join("data", "raw", "bithumb", "names.json");
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.warn("⚠ Failed to load existing names.json");
      return {};
    }
  }
  return {};
}

// Bithumb 마켓 심볼 로드
function loadBithumbMarketSymbols(): string[] {
  const filePath = path.join("data", "raw", "bithumb", "markets.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const markets = JSON.parse(content) as Array<{
      base_symbol: string;
    }>;
    return [...new Set(markets.map((m) => m.base_symbol.toUpperCase()))];
  } catch (err) {
    console.warn("⚠ Failed to load market symbols");
    return [];
  }
}

// 한글명 변환 로직 (특수 케이스)
function getKoreanName(
  symbol: string,
  nameEn: string,
  nameKo?: string
): string | undefined {
  // 기존 매핑
  const specialCases: { [key: string]: string } = {
    USDT: "테더",
    USDC: "유에스디",
    BTC: "비트코인",
    ETH: "이더리움",
    XRP: "리플",
  };

  if (specialCases[symbol]) {
    return specialCases[symbol];
  }

  if (nameKo && nameKo.length > 0) {
    return nameKo;
  }

  // 영문명을 간단한 한글로 변환 시도
  if (nameEn) {
    // Bitcoin -> 비트코인 패턴으로 변환
    const mapping: { [key: string]: string } = {
      bitcoin: "비트코인",
      ethereum: "이더리움",
      ripple: "리플",
      litecoin: "라이트코인",
      bitcoin_cash: "비트코인캐시",
      eos: "이오스",
      stellar: "스텔라루멘",
      chainlink: "체인링크",
      dogecoin: "도지코인",
      polkadot: "폴카닷",
      solana: "솔라나",
      avalanche: "아발란시",
      polygon: "폴리곤",
      cardano: "카르다노",
      uniswap: "유니스왑",
      aave: "에이브",
      shiba: "시바이누",
      dai: "다이",
    };

    for (const [key, korean] of Object.entries(mapping)) {
      if (nameEn.toLowerCase().includes(key)) {
        return korean;
      }
    }
  }

  return undefined;
}

async function main() {
  try {
    console.log("📊 Loading existing names...");
    const existingNames = loadExistingNames();
    console.log(`✅ Loaded ${Object.keys(existingNames).length} existing names`);

    console.log("📊 Loading market symbols...");
    const bithumbSymbols = loadBithumbMarketSymbols();
    console.log(`✅ Found ${bithumbSymbols.length} Bithumb market symbols`);

    console.log("🔄 Crawling new names from CoinGecko...");
    const newNames = await crawlFromCoinGecko();
    console.log(
      `✅ Crawled ${Object.keys(newNames).length} coins from CoinGecko`
    );

    // 기존 이름과 새로 크롤링한 이름 병합
    const mergedNames: BithumbNameMap = { ...newNames, ...existingNames };

    // Bithumb 심볼에 대해서만 필터링
    const finalNames: BithumbNameMap = {};
    let filledCount = 0;
    let withKoCount = 0;

    for (const symbol of bithumbSymbols) {
      if (mergedNames[symbol]) {
        finalNames[symbol] = mergedNames[symbol];
        if (mergedNames[symbol].name_ko) {
          withKoCount++;
        }
        filledCount++;
      }
    }

    // names.json 저장
    const outPath = path.join("data", "raw", "bithumb", "names.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(finalNames, null, 2), "utf-8");

    console.log(`\n✅ Bithumb names.json 업데이트 완료!`);
    console.log(
      `📊 총 ${bithumbSymbols.length}개 심볼 중 ${filledCount}개 채움, ${withKoCount}개에 한글명 있음`
    );

    // 채워지지 않은 심볼 표시
    const missingSymbols = bithumbSymbols.filter((s) => !finalNames[s]);
    if (missingSymbols.length > 0 && missingSymbols.length <= 20) {
      console.log(`\n❌ 아직 채워지지 않은 심볼:`, missingSymbols.join(", "));
    } else if (missingSymbols.length > 20) {
      console.log(`\n❌ 아직 ${missingSymbols.length}개 심볼이 채워지지 않음`);
    }
  } catch (err) {
    console.error("❌ Main failed:", err);
    process.exit(1);
  }
}

main();
