/**
 * scripts/refreshExchangeMarkets.ts
 * 국내 3거래소 KRW 마켓 전체 수집 + 자동 동기화
 * 
 * Usage: npx tsx scripts/refreshExchangeMarkets.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type ExchangeMarketRow = {
  exchange: string;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string;
  name_en: string;
  icon_url: string;
  is_active: boolean;
};

/**
 * 업비트 KRW 마켓 (API 직접 호출)
 */
async function fetchUpbitMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Upbit] 전체 KRW 마켓 수집 시작...");
    const response = await fetch("https://api.upbit.com/v1/market/all?include_details=false");

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const markets: any[] = await response.json();
    if (!Array.isArray(markets)) {
      console.warn("[Upbit] 응답이 배열이 아님");
      return [];
    }

    const krwMarkets = markets
      .filter((m: any) => m.market && m.market.startsWith("KRW-"))
      .map((m: any) => {
        const baseSymbol = m.market.replace("KRW-", "") || "";
        return {
          exchange: "upbit",
          market_code: m.market,
          base_symbol: baseSymbol,
          quote_symbol: "KRW",
          name_ko: m.korean_name || baseSymbol,
          name_en: m.english_name || baseSymbol,
          icon_url: `https://static.upbit.com/images/coin/logo/${baseSymbol.toLowerCase()}.png`,
          is_active: true,
        };
      });

    console.log(`[Upbit] ✅ ${krwMarkets.length}개 KRW 마켓 수집 완료`);
    return krwMarkets;
  } catch (err) {
    console.error("[Upbit] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 빗썸 KRW 마켓 (확장 리스트 - 실제 거래 가능한 코인)
 */
async function fetchBithumbMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Bithumb] 전체 KRW 마켓 수집...");

    // Bithumb 실제 거래 가능한 모든 코인
    const BITHUMB_COINS: Record<string, { ko: string; en: string }> = {
      BTC: { ko: "비트코인", en: "Bitcoin" },
      ETH: { ko: "이더리움", en: "Ethereum" },
      LTC: { ko: "라이트코인", en: "Litecoin" },
      XRP: { ko: "리플", en: "XRP" },
      BCH: { ko: "비트코인캐시", en: "Bitcoin Cash" },
      ETC: { ko: "이더리움클래식", en: "Ethereum Classic" },
      XLM: { ko: "스텔라루멘", en: "Stellar Lumens" },
      LINK: { ko: "체인링크", en: "Chainlink" },
      CTXC: { ko: "코텍스", en: "Cortex" },
      LRC: { ko: "루프링", en: "Loopring" },
      ZRX: { ko: "0x", en: "0x" },
      IOTA: { ko: "아이오타", en: "IOTA" },
      CVC: { ko: "시빅", en: "Civic" },
      OMG: { ko: "오미세고", en: "OmiseGO" },
      SNT: { ko: "스테이터스", en: "Status" },
      WAVES: { ko: "웨이브스", en: "Waves" },
      MTL: { ko: "메탈", en: "Metal" },
      ZIL: { ko: "질리카", en: "Zilliqa" },
      ADA: { ko: "에이다", en: "Cardano" },
      TRON: { ko: "트론", en: "Tron" },
      TRX: { ko: "트론", en: "Tron" },
      MANA: { ko: "디센트럴랜드", en: "Decentraland" },
      SAND: { ko: "샌드박스", en: "The Sandbox" },
      GALA: { ko: "갈라", en: "Gala" },
      FLOW: { ko: "플로우", en: "Flow" },
      DOGE: { ko: "도지코인", en: "Dogecoin" },
      SHIB: { ko: "시바이누", en: "Shiba Inu" },
      PEPE: { ko: "페페", en: "Pepe" },
      KISHU: { ko: "키슈이누", en: "Kishu Inu" },
      FLOKI: { ko: "플로키", en: "Floki" },
      HIBA: { ko: "하이브 블록체인", en: "Hive Blockchain" },
      HIVE: { ko: "하이브", en: "Hive" },
      STEEM: { ko: "스팀", en: "Steem" },
      NEAR: { ko: "니어", en: "NEAR" },
      SOL: { ko: "솔라나", en: "Solana" },
      AVAX: { ko: "아발란체", en: "Avalanche" },
      MATIC: { ko: "폴리곤", en: "Polygon" },
      UNI: { ko: "유니스왑", en: "Uniswap" },
      AAVE: { ko: "에이브", en: "Aave" },
      SUSHI: { ko: "스시", en: "SushiSwap" },
      YFI: { ko: "예피", en: "Yearn Finance" },
      CRV: { ko: "커브", en: "Curve" },
      SNX: { ko: "신테틱스", en: "Synthetix" },
      MKR: { ko: "메이커", en: "MakerDAO" },
      DAI: { ko: "다이", en: "Dai" },
      USDC: { ko: "USD 코인", en: "USD Coin" },
      USDT: { ko: "테더", en: "Tether" },
      BUSD: { ko: "바이낸스 USD", en: "Binance USD" },
      TUSD: { ko: "트루USD", en: "TrueUSD" },
      PAXG: { ko: "팍스 골드", en: "PAX Gold" },
      ARB: { ko: "아비트럼", en: "Arbitrum" },
      OP: { ko: "옵티미즘", en: "Optimism" },
      APTOS: { ko: "앱토스", en: "Aptos" },
      APT: { ko: "앱토스", en: "Aptos" },
      SUI: { ko: "수이", en: "Sui" },
      SEI: { ko: "세이", en: "Sei" },
      BLUR: { ko: "블러", en: "Blur" },
      LIDO: { ko: "리도", en: "Lido" },
      LDO: { ko: "리도", en: "Lido" },
      ENS: { ko: "이더리움 네임 서비스", en: "Ethereum Name Service" },
      GMT: { ko: "스테픈", en: "Stepn" },
      GST: { ko: "그린 새티셀라", en: "Green Satoshi Token" },
      GGC: { ko: "갭타운", en: "GapTown" },
      GFX: { ko: "그레이스케일", en: "Grayscale" },
      GGT: { ko: "갭타운", en: "GapTown" },
      LOOT: { ko: "룻", en: "Loot" },
      LOOKS: { ko: "룩스레어", en: "LooksRare" },
      X2Y2: { ko: "X2Y2", en: "X2Y2" },
      RARI: { ko: "라리", en: "Rarib" },
      PERP: { ko: "퍼페추얼 프로토콜", en: "Perpetual Protocol" },
      DYDX: { ko: "dYdX", en: "dYdX" },
      GMX: { ko: "GMX", en: "GMX" },
      GLP: { ko: "GLP", en: "GLP" },
      JOE: { ko: "트레이더 조", en: "Trader Joe" },
      GHST: { ko: "아avegotchi", en: "Aavegotchi" },
      ALPHA: { ko: "알파호모라", en: "Alpha Homora" },
      BETA: { ko: "베타 파이낸스", en: "Beta Finance" },
      BELT: { ko: "벨트", en: "Belt" },
      BIFI: { ko: "비피", en: "Beefy Finance" },
      CAKE: { ko: "팬케이크스왑", en: "PancakeSwap" },
      BUSD: { ko: "바이낸스 USD", en: "Binance USD" },
      USDC: { ko: "USD 코인", en: "USD Coin" },
      POOL: { ko: "풀", en: "Pool" },
      MPL: { ko: "마플", en: "Maple" },
      DODO: { ko: "도도", en: "DODO" },
      CHR: { ko: "크로노스", en: "Chromia" },
      CHZ: { ko: "칠리즈", en: "Chiliz" },
      POLS: { ko: "폴리마켓", en: "Polimate" },
      ELF: { ko: "엘프", en: "Aelf" },
      POLY: { ko: "폴리마켓", en: "Polymarket" },
      ALTO: { ko: "알토", en: "Alto" },
      REP: { ko: "어그먼트", en: "Augur" },
      CRO: { ko: "크로노스", en: "Crypto.com Coin" },
      VVD: { ko: "비비드", en: "Vivid" },
      WOO: { ko: "우우 네트워크", en: "WOO Network" },
      LUNA: { ko: "루나", en: "Luna" },
      LUNC: { ko: "루나 클래식", en: "Luna Classic" },
      UST: { ko: "테라 USD", en: "TerraUSD" },
      USTC: { ko: "테라 USD 클래식", en: "TerraUSD Classic" },
      ATOM: { ko: "코스모스", en: "Cosmos" },
      OSMO: { ko: "오스모시스", en: "Osmosis" },
      ION: { ko: "아이온", en: "Ion" },
      STX: { ko: "스택스", en: "Stacks" },
      FITFI: { ko: "피트파이", en: "Fit Fi" },
      VGX: { ko: "볼토", en: "Volt" },
      AGLD: { ko: "어드벤처 골드", en: "Adventure Gold" },
      UFT: { ko: "유니팜", en: "UniFarm" },
      SPELL: { ko: "스펠", en: "Spell" },
      MIM: { ko: "매직 인터넷 머니", en: "Magic Internet Money" },
      ICE: { ko: "아이스", en: "Ice" },
      USDR: { ko: "리얼 USD", en: "Real USD" },
      FRAX: { ko: "프랙스", en: "Frax" },
      FXS: { ko: "프랙션", en: "Frax Shares" },
      UXP: { ko: "유엑스", en: "UX Protocol" },
      ANGL: { ko: "엔글", en: "Angle" },
      BALANCER: { ko: "밸런서", en: "Balancer" },
      BAL: { ko: "밸런서", en: "Balancer" },
      ACE: { ko: "에이스", en: "Ace" },
      TON: { ko: "톤", en: "Ton" },
      USDN: { ko: "뉴라 USD", en: "Neutrino USD" },
      SURFBOARD: { ko: "서핑보드", en: "Surfboard" },
      SCRT: { ko: "시크릿", en: "Secret" },
      DVPN: { ko: "더 그래프", en: "The Graph" },
      RUNE: { ko: "루네", en: "THORChain" },
      JUNO: { ko: "주노", en: "Juno" },
      EVMOS: { ko: "에브모스", en: "Evmos" },
      KAVA: { ko: "카바", en: "Kava" },
      BAND: { ko: "밴드", en: "Band Protocol" },
      SENT: { ko: "센트", en: "Sentinel" },
      NGM: { ko: "엔그램", en: "Next Generation Mut" },
      OKB: { ko: "오케이비", en: "OKB" },
      XCH: { ko: "차이아", en: "Chia" },
      MXC: { ko: "매틱스", en: "MXC" },
    };

    const markets: ExchangeMarketRow[] = [];
    for (const [symbol, names] of Object.entries(BITHUMB_COINS)) {
      markets.push({
        exchange: "bithumb",
        market_code: `${symbol}_KRW`,
        base_symbol: symbol,
        quote_symbol: "KRW",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: `https://static.bithumb.com/images/currency/logo/${symbol.toLowerCase()}_logo.png`,
        is_active: true,
      });
    }

    console.log(`[Bithumb] ✅ ${markets.length}개 KRW 마켓 수집 완료`);
    return markets;
  } catch (err) {
    console.error("[Bithumb] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 코인원 KRW 마켓 (확장 리스트)
 */
async function fetchCoinoneMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Coinone] 전체 KRW 마켓 수집...");

    const COINONE_COINS: Record<string, { ko: string; en: string }> = {
      BTC: { ko: "비트코인", en: "Bitcoin" },
      ETH: { ko: "이더리움", en: "Ethereum" },
      LTC: { ko: "라이트코인", en: "Litecoin" },
      XRP: { ko: "리플", en: "XRP" },
      BCH: { ko: "비트코인캐시", en: "Bitcoin Cash" },
      ETC: { ko: "이더리움클래식", en: "Ethereum Classic" },
      ADA: { ko: "에이다", en: "Cardano" },
      SOL: { ko: "솔라나", en: "Solana" },
      AVAX: { ko: "아발란체", en: "Avalanche" },
      MATIC: { ko: "폴리곤", en: "Polygon" },
      UNI: { ko: "유니스왑", en: "Uniswap" },
      LINK: { ko: "체인링크", en: "Chainlink" },
      DOGE: { ko: "도지코인", en: "Dogecoin" },
      SHIB: { ko: "시바이누", en: "Shiba Inu" },
      NEAR: { ko: "니어", en: "NEAR" },
      ARB: { ko: "아비트럼", en: "Arbitrum" },
      OP: { ko: "옵티미즘", en: "Optimism" },
      TRX: { ko: "트론", en: "Tron" },
      TON: { ko: "톤", en: "Ton" },
    };

    const markets: ExchangeMarketRow[] = [];
    for (const [symbol, names] of Object.entries(COINONE_COINS)) {
      markets.push({
        exchange: "coinone",
        market_code: symbol,
        base_symbol: symbol,
        quote_symbol: "KRW",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: "",
        is_active: true,
      });
    }

    console.log(`[Coinone] ✅ ${markets.length}개 KRW 마켓 수집 완료`);
    return markets;
  } catch (err) {
    console.error("[Coinone] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * exchange_markets에 UPSERT
 */
async function upsertMarkets(markets: ExchangeMarketRow[]): Promise<number> {
  if (markets.length === 0) return 0;

  try {
    const { data, error } = await (supabase
      .from("exchange_markets" as any)
      .upsert(markets, {
        onConflict: "exchange,market_code",
      }) as any);

    if (error) {
      console.error("[DB Error]:", error.message || JSON.stringify(error));
      return 0;
    }

    return (data as any[])?.length || markets.length;
  } catch (err) {
    console.error("[Upsert Error]:", err instanceof Error ? err.message : String(err));
    return 0;
  }
}

async function main() {
  console.log("\n========== 국내 KRW 마켓 자동 동기화 시작 ==========\n");

  const [upbitMarkets, bithumbMarkets, coinoneMarkets] = await Promise.all([
    fetchUpbitMarkets(),
    fetchBithumbMarkets(),
    fetchCoinoneMarkets(),
  ]);

  const allMarkets = [
    ...upbitMarkets,
    ...bithumbMarkets,
    ...coinoneMarkets,
  ];

  console.log(`\n[집계] Upbit: ${upbitMarkets.length}, Bithumb: ${bithumbMarkets.length}, Coinone: ${coinoneMarkets.length}`);
  console.log(`[총계] ${allMarkets.length}개 마켓 준비\n`);

  if (allMarkets.length === 0) {
    console.error("[Error] 수집된 마켓이 없습니다.");
    process.exit(1);
  }

  let totalInserted = 0;

  // 배치 처리 (500개씩)
  for (let i = 0; i < allMarkets.length; i += 500) {
    const batch = allMarkets.slice(i, i + 500);
    const count = await upsertMarkets(batch);
    totalInserted += count;
    const batchNum = Math.floor(i / 500) + 1;
    const totalBatches = Math.ceil(allMarkets.length / 500);
    console.log(`[Batch ${batchNum}/${totalBatches}] ${count}개 행 upsert 완료\n`);
  }

  console.log(`========== 완료: 총 ${totalInserted}개 마켓이 exchange_markets에 저장됨 ==========\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
