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
  name_ko: string | null;
  name_en: string | null;
  icon_url: string;
  is_active: boolean;
};

/**
 * 업비트 KRW/BTC/USDT 마켓 (API 직접 호출)
 */
async function fetchUpbitMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Upbit] 전체 마켓 수집 시작...");
    const response = await fetch("https://api.upbit.com/v1/market/all?include_details=false");

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const markets: any[] = await response.json();
    if (!Array.isArray(markets)) {
      console.warn("[Upbit] 응답이 배열이 아님");
      return [];
    }

    // KRW, BTC, USDT 마켓만 수집
    const allMarkets = markets
      .filter((m: any) => {
        const market = m.market || "";
        return market.endsWith("-KRW") || market.endsWith("-BTC") || market.endsWith("-USDT");
      })
      .map((m: any) => {
        const market = m.market || "";
        const parts = market.split("-");
        const baseSymbol = parts[0] || "";
        const quoteSymbol = parts[1] || "KRW";
        
        return {
          exchange: "upbit",
          market_code: market,
          base_symbol: baseSymbol,
          quote_symbol: quoteSymbol,
          name_ko: m.korean_name || baseSymbol,
          name_en: m.english_name || baseSymbol,
          icon_url: `https://static.upbit.com/images/coin/logo/${baseSymbol.toLowerCase()}.png`,
          is_active: true,
        };
      });

    console.log(`[Upbit] ✅ ${allMarkets.length}개 마켓 수집 완료 (KRW/BTC/USDT)`);
    return allMarkets;
  } catch (err) {
    console.error("[Upbit] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 빗썸 KRW/BTC 마켓 - API 기반 수집 (name_ko/name_en 분리)
 */
async function fetchBithumbMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Bithumb] 마켓 데이터 수집 중...");

    // Bithumb API에서 거래 가능한 모든 코인 정보 조회
    const response = await fetch("https://api.bithumb.com/public/ticker/all", {
      headers: { "Accept": "application/json" }
    });
    
    if (!response.ok) {
      console.warn("[Bithumb] API 응답 실패:", response.status);
      return [];
    }

    const data = await response.json();

    if (data.status !== "0000" || !data.data) {
      console.warn("[Bithumb] API 응답 실패:", data.message);
      return [];
    }

    // 빗썸 공식 한글명 매핑 (Bithumb 웹 UI 기준) + 누락된 코인들
    const BITHUMB_NAMES: Record<string, { ko: string | null; en: string | null }> = {
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
      // 빗썸 웹 마켓에서 한글명이 있는 코인들 (지속적으로 확장)
      IMX: { ko: "이뮤터블X", en: "Immutable X" },
      CFX: { ko: "컨플럭스", en: "Conflux" },
      HFT: { ko: "해시플로우", en: "HashFlow" },
      FET: { ko: "페치에이아이", en: "Fetch.ai" },
      ARKM: { ko: "아르캄", en: "Arkham" },
      ETHW: { ko: "이더리움파우", en: "EthereumPoW" },
      WEMIX: { ko: "위믹스", en: "Wemix" },
      ID: { ko: "아이디", en: "Cosmos" },
      RDNT: { ko: "래디언트", en: "Radiant Capital" },
      STRK: { ko: "스타크넷", en: "Starknet" },
      // 추가 한글명 코인들
      SAFE: { ko: "세이프", en: "Safe" },
      NAKA: { ko: "나카모토", en: "Nakamoto" },
      XAI: { ko: "크산테", en: "Xanthe" },
      MOVE: { ko: "무브", en: "Move" },
      LISTA: { ko: "리스타", en: "Liquid Staking Token" },
      ENA: { ko: "에나", en: "Ethena" },
      MANTA: { ko: "만타", en: "Manta" },
      PNUT: { ko: "피넛", en: "Peanut" },
      PIXEL: { ko: "픽셀", en: "Pixel" },
      POMM: { ko: "폼", en: "Pomm" },
      SAGA: { ko: "사가", en: "Saga" },
      CORE: { ko: "코어", en: "Core" },
      PIKA: { ko: "피카", en: "Pika" },
      BRETT: { ko: "브렛", en: "Brett" },
      DEGEN: { ko: "디젠", en: "Degen" },
      AIOZ: { ko: "에이오즈", en: "AIOZ Network" },
      ALT: { ko: "알트", en: "Alt Layer" },
      ASTR: { ko: "아스터", en: "Astar" },
      BEAM: { ko: "빔", en: "Beam" },
      BTRST: { ko: "브라이트러스트", en: "Brighter" },
      DYM: { ko: "디뮤텐셈", en: "Dymension" },
      ECLIPSE: { ko: "이클립스", en: "Eclipse" },
      GOD: { ko: "갓", en: "God Games" },
      GRASS: { ko: "그래스", en: "Grass" },
      HASH: { ko: "해시", en: "Hash" },
      INJ: { ko: "인젝티브", en: "Injective" },
      ION: { ko: "아이온", en: "Ion" },
      ICP: { ko: "인터넷컴퓨터", en: "Internet Computer" },
      KAS: { ko: "카스파", en: "Kaspa" },
      KLAY: { ko: "클레이", en: "Klaytn" },
      LIT: { ko: "릿", en: "Lit" },
      MAG: { ko: "매그", en: "Magiccraft" },
      METIS: { ko: "메티스", en: "Metis" },
      MINA: { ko: "미나", en: "Mina" },
      NEIRO: { ko: "네이로", en: "Neiro" },
      ORDT: { ko: "오디널", en: "Ordinal" },
      ORION: { ko: "오리온", en: "Orion" },
      PENDLE: { ko: "펜들", en: "Pendle" },
      PHANTOM: { ko: "팬텀", en: "Phantom" },
      POKT: { ko: "포켓", en: "Pocket" },
      PORTAL: { ko: "포탈", en: "Portal" },
      PURSE: { ko: "퍼스", en: "Purse" },
      PYR: { ko: "파이로", en: "Pyro" },
      QNT: { ko: "퀀텀", en: "Quant" },
      RNDR: { ko: "랜더", en: "Render" },
      ROSE: { ko: "로즈", en: "Rose" },
      RSR: { ko: "리저브", en: "Reserve Rights" },
      SAND: { ko: "샌드박스", en: "Sandbox" },
      SATS: { ko: "새츠", en: "Sats" },
      SCALES: { ko: "스케일즈", en: "Scales" },
      SCAM: { ko: "스캠", en: "Scam" },
      SHRAP: { ko: "슈랩", en: "Shrap" },
      SMTX: { ko: "스매트맥스", en: "SmartMx" },
      TAL: { ko: "탈", en: "Tal" },
      TAO: { ko: "타오", en: "Tao" },
      TENSOR: { ko: "텐서", en: "Tensor" },
      TERN: { ko: "턴", en: "Tern" },
      TIA: { ko: "셀레스티아", en: "Celestia" },
      TOOLS: { ko: "툴즈", en: "Tools" },
      TOSHI: { ko: "토시", en: "Toshi" },
      TROY: { ko: "트로이", en: "Troy" },
      TUX: { ko: "턱스", en: "Tux" },
      VOXEL: { ko: "복셀", en: "Voxel" },
      W: { ko: "더블유", en: "Wormhole" },
      WEETH: { ko: "위이스", en: "Weeth" },
      WELL: { ko: "웰", en: "Well" },
      WHALE: { ko: "웨일", en: "Whale" },
      WLD: { ko: "월드", en: "World" },
      WOO: { ko: "우우 네트워크", en: "WOO Network" },
      XEN: { ko: "젠", en: "XEN" },
    };

    const markets: ExchangeMarketRow[] = [];
    for (const symbol of Object.keys(data.data)) {
      if (symbol.toUpperCase() === "DATE") continue;
      
      const upperSymbol = symbol.toUpperCase();
      const names = BITHUMB_NAMES[upperSymbol] || {
        ko: null,
        en: null,
      };
      
      // KRW 마켓
      markets.push({
        exchange: "bithumb",
        market_code: `${upperSymbol}_KRW`,
        base_symbol: upperSymbol,
        quote_symbol: "KRW",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: `https://static.bithumb.com/images/currency/logo/${upperSymbol.toLowerCase()}_logo.png`,
        is_active: true,
      });

      // BTC 마켓도 추가 (많은 코인이 BTC 페어 있음)
      markets.push({
        exchange: "bithumb",
        market_code: `${upperSymbol}_BTC`,
        base_symbol: upperSymbol,
        quote_symbol: "BTC",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: `https://static.bithumb.com/images/currency/logo/${upperSymbol.toLowerCase()}_logo.png`,
        is_active: true,
      });
    }

    console.log(`[Bithumb] ✅ ${markets.length}개 마켓 수집 완료 (KRW + BTC)`);
    return markets;
  } catch (err) {
    console.error("[Bithumb] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 코인원 KRW 마켓 - API 기반 수집
 */
async function fetchCoinoneMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Coinone] 마켓 데이터 수집 중...");

    // 코인원 공개 API v2 markets 엔드포인트
    const response = await fetch("https://api.coinone.co.kr/public/v2/markets", {
      headers: { "Accept": "application/json" }
    });
    
    if (!response.ok) {
      console.warn("[Coinone] API 응답 실패:", response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn("[Coinone] 응답 형식 오류");
      return [];
    }

    // 코인원 공식 한글명 매핑 (코인원 웹 UI 기준)
    const COINONE_NAMES: Record<string, { ko: string; en: string }> = {
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
      USDT: { ko: "테더", en: "Tether" },
      USDC: { ko: "USD 코인", en: "USD Coin" },
      DAI: { ko: "다이", en: "Dai" },
      AAVE: { ko: "에이브", en: "Aave" },
      SUSHI: { ko: "스시", en: "SushiSwap" },
      MKR: { ko: "메이커", en: "MakerDAO" },
      CRV: { ko: "커브", en: "Curve" },
      YFI: { ko: "예피", en: "Yearn Finance" },
      SNX: { ko: "신테틱스", en: "Synthetix" },
      LDO: { ko: "리도", en: "Lido" },
      LIDO: { ko: "리도", en: "Lido" },
      APT: { ko: "앱토스", en: "Aptos" },
      SUI: { ko: "수이", en: "Sui" },
      BLUR: { ko: "블러", en: "Blur" },
      SEI: { ko: "세이", en: "Sei" },
      ATOM: { ko: "코스모스", en: "Cosmos" },
      OSMO: { ko: "오스모시스", en: "Osmosis" },
      JUNO: { ko: "주노", en: "Juno" },
      EVMOS: { ko: "에브모스", en: "Evmos" },
      KAVA: { ko: "카바", en: "Kava" },
      BAND: { ko: "밴드", en: "Band Protocol" },
      STX: { ko: "스택스", en: "Stacks" },
      FITFI: { ko: "피트파이", en: "Fit Fi" },
      PEPE: { ko: "페페", en: "Pepe" },
      MANA: { ko: "디센트럴랜드", en: "Decentraland" },
      SAND: { ko: "샌드박스", en: "The Sandbox" },
      GALA: { ko: "갈라", en: "Gala" },
      FLOW: { ko: "플로우", en: "Flow" },
    };

    const markets: ExchangeMarketRow[] = [];
    for (const market of data) {
      const symbol = market.target_currency?.toUpperCase() || "";
      if (!symbol) continue;

      const names = COINONE_NAMES[symbol] || {
        ko: symbol,
        en: symbol,
      };

      markets.push({
        exchange: "coinone",
        market_code: symbol,
        base_symbol: symbol,
        quote_symbol: "KRW",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: `https://static.coinone.co.kr/images/coin/${symbol.toLowerCase()}.png`,
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
 * exchange_markets에 DELETE + INSERT (폴 리프레시 방식)
 * - 기존 모든 행 전체 삭제
 * - 새로 크롤링한 데이터 일괄 삽입
 * - 실제 저장된 행 수 반환
 */
async function upsertMarkets(markets: ExchangeMarketRow[]): Promise<number> {
  if (markets.length === 0) return 0;

  // 1단계: 기존 모든 마켓 전체 삭제
  console.log("[DB] 기존 모든 마켓 삭제 중...");
  const { error: delError, count: deletedCount } = await supabase
    .from("exchange_markets")
    .delete()
    .gte("id", 0); // id >= 0 (모든 행 삭제)

  if (delError) {
    console.error("\n❌ [CRITICAL DB DELETE ERROR]");
    console.error("Error message:", delError.message);
    console.error("Error details:", JSON.stringify(delError, null, 2));
    throw new Error(`Supabase DELETE failed: ${delError.message}`);
  }

  console.log(`[DB] ✅ 기존 ${deletedCount || 0}개 행 삭제됨`);

  // 2단계: 새 데이터 일괄 삽입
  console.log(`[DB] ${markets.length}개 마켓 삽입 중...`);
  const { data, error: insertError } = await supabase
    .from("exchange_markets")
    .insert(markets as any)
    .select("id");

  if (insertError) {
    console.error("\n❌ [CRITICAL DB INSERT ERROR]");
    console.error("Error message:", insertError.message);
    console.error("Error details:", JSON.stringify(insertError, null, 2));
    throw new Error(`Supabase INSERT failed: ${insertError.message}`);
  }

  const actualCount = (data as any[])?.length || 0;
  
  if (actualCount === 0) {
    console.error("\n❌ [CRITICAL DB INSERT RESULT ERROR]");
    throw new Error(`Database insert returned 0 rows (expected ${markets.length})`);
  }

  console.log(`[DB] ✅ ${actualCount}개 행 정상 저장됨`);
  return actualCount;
}

export async function refreshExchangeMarkets() {
  console.log("\n========== 국내 3거래소 마켓 자동 동기화 시작 ==========\n");

  try {
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
      throw new Error("수집된 마켓이 없습니다");
    }

    const totalInserted = await upsertMarkets(allMarkets);

    console.log(`\n========== 완료: 총 ${totalInserted}개 마켓이 exchange_markets에 저장됨 ==========\n`);
    return totalInserted;
  } catch (err) {
    console.error("\n❌ [FATAL ERROR] 마켓 동기화 실패:");
    console.error("Error:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error) {
      console.error("Stack:", err.stack);
    }
    throw err;
  }
}

// CLI 직접 실행용
if (process.argv[1]?.includes("refreshExchangeMarkets.ts")) {
  refreshExchangeMarkets().catch((err) => {
    console.error("Fatal error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
