import React, { useEffect } from 'react';

// 심볼 정규화 함수: 거래소별 다양한 형식 통일
export function normalizeSymbol(raw: string): string {
  let symbol = raw.replace(/[-_/]/g, '').toUpperCase(); // 구분자 제거 (BTC-KRW, BTC_KRW, BTC/USDT 등)
  
  // 마켓 접미사 제거 (단, 심볼 자체가 해당 토큰인 경우는 유지)
  // 예: BTCKRW -> BTC, ETHUSDT -> ETH, XRPBTC -> XRP
  // 예외: BTC -> BTC (유지), ETH -> ETH (유지), USDT -> USDT (유지)
  const marketSuffixes = ['KRW', 'USDT', 'BTC', 'ETH'];
  for (const suffix of marketSuffixes) {
    if (symbol.length > suffix.length && symbol.endsWith(suffix)) {
      symbol = symbol.slice(0, -suffix.length);
      break;
    }
  }
  
  return symbol;
}

// 업비트/빗썸/코인원 상장 코인 기준 심볼 → CoinGecko ID 매핑 (상위 200+)
export const COIN_ID_MAP: Record<string, string> = {
  // Top 50 by Market Cap
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'XRP': 'ripple',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'SHIB': 'shiba-inu',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'TRX': 'tron',
  'MATIC': 'matic-network',
  'POL': 'matic-network',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'APT': 'aptos',
  'FIL': 'filecoin',
  'ICP': 'internet-computer',
  'HBAR': 'hedera-hashgraph',
  'VET': 'vechain',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'MKR': 'maker',
  'GRT': 'the-graph',
  'INJ': 'injective-protocol',
  'RUNE': 'thorchain',
  'AAVE': 'aave',
  'ALGO': 'algorand',
  'EOS': 'eos',
  'XTZ': 'tezos',
  'FLOW': 'flow',
  'THETA': 'theta-token',
  'KLAY': 'klaytn',
  'IMX': 'immutable-x',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TON': 'the-open-network',
  'PEPE': 'pepe',
  'BONK': 'bonk',
  'WIF': 'dogwifcoin',
  'FLOKI': 'floki',
  
  // 51-100
  'STX': 'stacks',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'FTM': 'fantom',
  'EGLD': 'elrond-erd-2',
  'GALA': 'gala',
  'CHZ': 'chiliz',
  'ENJ': 'enjincoin',
  'LRC': 'loopring',
  'BAT': 'basic-attention-token',
  'CRV': 'curve-dao-token',
  'COMP': 'compound-governance-token',
  'SNX': 'havven',
  'YFI': 'yearn-finance',
  'ZRX': '0x',
  'ENS': 'ethereum-name-service',
  'ONE': 'harmony',
  'ROSE': 'oasis-network',
  'IOTA': 'iota',
  'ZIL': 'zilliqa',
  'ICX': 'icon',
  'ONT': 'ontology',
  'SC': 'siacoin',
  'QTUM': 'qtum',
  'ZEN': 'horizen',
  'RVN': 'ravencoin',
  'ANKR': 'ankr',
  'CKB': 'nervos-network',
  'STORJ': 'storj',
  'SKL': 'skale',
  'CELO': 'celo',
  'GLM': 'golem',
  'AUDIO': 'audius',
  'LPT': 'livepeer',
  '1INCH': '1inch',
  'MASK': 'mask-network',
  'API3': 'api3',
  'OCEAN': 'ocean-protocol',
  'SSV': 'ssv-network',
  'RLC': 'iexec-rlc',
  'NMR': 'numeraire',
  'BAND': 'band-protocol',
  'CTSI': 'cartesi',
  'TRB': 'tellor',
  'RSR': 'reserve-rights-token',
  'CELR': 'celer-network',
  'MTL': 'metal',
  'REQ': 'request-network',
  'POWR': 'power-ledger',
  
  // 101-150 (업비트/빗썸 인기 코인)
  'SXP': 'swipe',
  'ONG': 'ontology-gas',
  'STMX': 'storm',
  'MED': 'medibloc',
  'MLK': 'milk-alliance',
  'BORA': 'bora',
  'PLA': 'playdapp',
  'META': 'metadium',
  'MOC': 'moss-coin',
  'AQT': 'alpha-quark-token',
  'FCT2': 'firmachain',
  'JST': 'just',
  'STPT': 'standard-tokenization-protocol',
  'GAS': 'gas',
  'STRAX': 'stratis',
  'WAXP': 'wax',
  'SRM': 'serum',
  'DAWN': 'dawn-protocol',
  'HUNT': 'hunt-token',
  'AERGO': 'aergo',
  'ORBS': 'orbs',
  'BTT': 'bittorrent',
  'WIN': 'wink',
  'SUN': 'sun-token',
  'NFT': 'apenft',
  'XEC': 'ecash',
  'KNC': 'kyber-network-crystal',
  'HIVE': 'hive',
  'STEEM': 'steem',
  'BSV': 'bitcoin-sv',
  'DASH': 'dash',
  'XMR': 'monero',
  'ZEC': 'zcash',
  'DCR': 'decred',
  'WAVES': 'waves',
  'NEO': 'neo',
  'LOOM': 'loom-network',
  'ELF': 'aelf',
  'IOST': 'iostoken',
  'TFUEL': 't-fuel',
  'ARDR': 'ardor',
  'XEM': 'nem',
  'KMD': 'komodo',
  'LSK': 'lisk',
  'MINA': 'mina-protocol',
  'CFX': 'conflux-token',
  'FLUX': 'zelcash',
  'KSM': 'kusama',
  'AR': 'arweave',
  'HNT': 'helium',
  
  // 151-200+ (추가 인기 코인)
  'BLUR': 'blur',
  'MAGIC': 'magic',
  'GMX': 'gmx',
  'LQTY': 'liquity',
  'RPL': 'rocket-pool',
  'LDO': 'lido-dao',
  'FXS': 'frax-share',
  'PENDLE': 'pendle',
  'JOE': 'joe',
  'SUSHI': 'sushi',
  'CAKE': 'pancakeswap-token',
  'DYDX': 'dydx',
  'PERP': 'perpetual-protocol',
  'SNT': 'status',
  'OMG': 'omisego',
  'ZKS': 'zkspace',
  'LEVER': 'lever',
  'T': 'threshold-network-token',
  'ACH': 'alchemy-pay',
  'JASMY': 'jasmycoin',
  'AGIX': 'singularitynet',
  'FET': 'fetch-ai',
  'RNDR': 'render-token',
  'WLD': 'worldcoin-wld',
  'ARKM': 'arkham',
  'CYBER': 'cyberconnect',
  'ID': 'space-id',
  'EDU': 'open-campus',
  'SLP': 'smooth-love-potion',
  'ALICE': 'my-neighbor-alice',
  'LOOKS': 'looksrare',
  'X2Y2': 'x2y2',
  'APE': 'apecoin',
  'MEME': 'memecoin',
  'PYTH': 'pyth-network',
  'JTO': 'jito-governance-token',
  'TIA': 'celestia',
  'STRK': 'starknet',
  'DYM': 'dymension',
  'ALT': 'altlayer',
  'PIXEL': 'pixels',
  'PORTAL': 'portal-2',
  'AEVO': 'aevo-exchange',
  'W': 'wormhole',
  'ENA': 'ethena',
  'ONDO': 'ondo-finance',
  'NOT': 'notcoin',
  'ZRO': 'layerzero',
  'IO': 'io-net',
  'ZK': 'zksync',
  'BLAST': 'blast',
  'LISTA': 'lista-dao',
  'BOME': 'book-of-meme',
  'ETHFI': 'ether-fi',
  'REZ': 'renzo',
  'OMNI': 'omni-network',
  'SAGA': 'saga-2',
  'TNSR': 'tensor',
  'TAIKO': 'taiko',
  'BRETT': 'based-brett',
  'POPCAT': 'popcat',
  'MEW': 'cat-in-a-dogs-world',
  'MOTHER': 'mother-iggy',
  'TURBO': 'turbo',
  'NEIRO': 'first-neiro-on-ethereum',
  'DOGS': 'dogs-2',
  'CATI': 'catizen',
  'HMSTR': 'hamster-kombat',
  'EIGEN': 'eigenlayer',
  'SIGN': 'sign',
  
  // 스테이블코인
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'DAI': 'dai',
  'TUSD': 'true-usd',
  'USDD': 'usdd',
  'FRAX': 'frax',
  'USDP': 'paxos-standard',
  
  // 추가 한국 거래소 인기 코인
  'BTG': 'bitcoin-gold',
  'XVS': 'venus',
  'RARE': 'superrare',
  'HIGH': 'highstreet',
  'VOXEL': 'voxies',
  'GMT': 'stepn',
  'GST': 'green-satoshi-token',
  'LUNC': 'terra-luna',
  'USTC': 'terrausd',
  'LUNA': 'terra-luna-2',
  'HOOK': 'hooked-protocol',
  'RDNT': 'radiant-capital',
  'OSMO': 'osmosis',
  'AKT': 'akash-network',
  'KUJI': 'kujira',
  'JUP': 'jupiter-exchange-solana',
  'RAY': 'raydium',
  'ORCA': 'orca',
  'MNDE': 'marinade',
  
  // 업비트/빗썸/코인원 추가 상장 코인 (2024-2025)
  'MON': 'mon-protocol',
  'SAHARA': 'sahara',
  'DEEP': 'deepbook-protocol',
  'KAITO': 'kaito',
  'MORPHO': 'morpho',
  'ANIME': 'anime',
  'LAYER': 'layer',
  'PUMP': 'pump',
  'PNUT': 'peanut-the-squirrel',
  'LAYER3': 'layer3',
  'VIRTUAL': 'virtual-protocol',
  'AI16Z': 'ai16z',
  'ZEREBRO': 'zerebro',
  'FARTCOIN': 'fartcoin',
  'GRIFFAIN': 'griffain',
  'ARC': 'arc',
  'AIXBT': 'aixbt',
  'GOAT': 'goatseus-maximus',
  'ACT': 'act-i-the-ai-prophecy',
  'PRCL': 'parcl',
  'MYRO': 'myro',
  'SLERF': 'slerf',
  'ZETA': 'zetachain',
  'JITO': 'jito-governance-token',
  'MANTA': 'manta-network',
  'XAI': 'xai-games',
  'MAVIA': 'heroes-of-mavia',
  'BSQUARED': 'b2-network',
  'PANDORA': 'pandora',
  
  // 한국 거래소 특화 코인 (중복 제외)
  'WEMIX': 'wemix-token',
  'KAVA': 'kava',
  'CBK': 'cobak-token',
  'MBL': 'moviebloc',
  'OBSR': 'observer-coin',
  'UPP': 'sentinel-protocol',
  'SBD': 'steem-dollars',
  'VALOR': 'smart-valor',
  'ONIT': 'onit',
  'QKC': 'quark-chain',
  'CRO': 'crypto-com-chain',
  'GNO': 'gnosis',
  'PUNDIX': 'pundi-x-2',
  'MVL': 'mass-vehicle-ledger',
  'ASTR': 'astar',
  'GLMR': 'moonbeam',
  'MOVR': 'moonriver',
  'CFG': 'centrifuge',
  'AZERO': 'aleph-zero',
  'KDA': 'kadena',
  'FLR': 'flare-networks',
  'SGB': 'songbird',
  'COTI': 'coti',
  'ERG': 'ergo',
  'KAS': 'kaspa',
  'ALPH': 'alephium',
  'XCH': 'chia',
  'CTC': 'creditcoin-2',
  'CORE': 'coredao',
  'BAL': 'balancer',
  'LUSD': 'liquity-usd',
  'GNS': 'gains-network',
  'KWENTA': 'kwenta',
  'VELO': 'velodrome-finance',
  'AERO': 'aerodrome-finance',
};

// 심볼별 그라데이션 컬러 (폴백용)
const GRADIENT_COLORS: Record<string, string> = {
  'BTC': 'from-orange-500 to-yellow-500',
  'ETH': 'from-indigo-500 to-purple-500',
  'XRP': 'from-gray-400 to-blue-500',
  'SOL': 'from-purple-500 to-green-400',
  'DOGE': 'from-yellow-400 to-amber-500',
  'ADA': 'from-blue-600 to-cyan-400',
  'USDT': 'from-green-500 to-emerald-600',
  'USDC': 'from-blue-400 to-blue-600',
  'SHIB': 'from-red-500 to-orange-500',
  'AVAX': 'from-red-600 to-pink-500',
  'DOT': 'from-pink-500 to-purple-600',
  'LINK': 'from-blue-500 to-indigo-600',
  'MATIC': 'from-purple-600 to-violet-500',
  'POL': 'from-purple-600 to-violet-500',
  'TRX': 'from-red-500 to-red-700',
  'TON': 'from-blue-400 to-sky-500',
  'PEPE': 'from-green-400 to-green-600',
  'NEAR': 'from-green-500 to-teal-500',
  'APT': 'from-teal-400 to-cyan-500',
  'SUI': 'from-blue-400 to-cyan-400',
  'SEI': 'from-red-400 to-pink-500',
  'ARB': 'from-blue-500 to-blue-700',
  'OP': 'from-red-500 to-red-600',
  'ATOM': 'from-purple-500 to-indigo-600',
  'FIL': 'from-blue-400 to-teal-500',
  'ICP': 'from-purple-500 to-pink-500',
  'SAND': 'from-cyan-400 to-blue-500',
  'MANA': 'from-red-400 to-pink-500',
  'AXS': 'from-blue-400 to-purple-500',
  'ALGO': 'from-gray-700 to-gray-900',
  'EOS': 'from-gray-700 to-black',
  'XTZ': 'from-blue-500 to-blue-700',
  'HBAR': 'from-gray-800 to-black',
  'VET': 'from-blue-400 to-blue-600',
  'THETA': 'from-teal-400 to-green-500',
  'FTM': 'from-blue-500 to-blue-700',
  'KLAY': 'from-orange-400 to-red-500',
  'NEO': 'from-green-500 to-green-700',
  'WAVES': 'from-blue-400 to-blue-600',
  'ZIL': 'from-teal-400 to-cyan-500',
  'LSK': 'from-blue-500 to-indigo-600',
  'SIGN': 'from-purple-400 to-pink-500',
  'WLD': 'from-gray-800 to-black',
  'RNDR': 'from-orange-400 to-red-500',
  'FET': 'from-purple-500 to-indigo-500',
  'AGIX': 'from-purple-400 to-blue-500',
  
  // 신규 상장 코인 그라데이션
  'MON': 'from-indigo-500 to-purple-600',
  'SAHARA': 'from-amber-400 to-orange-500',
  'DEEP': 'from-blue-600 to-cyan-500',
  'KAITO': 'from-pink-400 to-rose-500',
  'MORPHO': 'from-blue-400 to-indigo-500',
  'ANIME': 'from-pink-500 to-purple-500',
  'LAYER': 'from-teal-400 to-emerald-500',
  'PUMP': 'from-green-400 to-lime-500',
  'PNUT': 'from-amber-500 to-yellow-400',
  'VIRTUAL': 'from-violet-500 to-purple-600',
  'AI16Z': 'from-gray-700 to-slate-800',
  'ZEREBRO': 'from-green-500 to-teal-500',
  'FARTCOIN': 'from-green-400 to-lime-400',
  'GRIFFAIN': 'from-orange-500 to-red-500',
  'ARC': 'from-blue-500 to-purple-500',
  'AIXBT': 'from-cyan-500 to-blue-600',
  'GOAT': 'from-amber-600 to-yellow-500',
  'ACT': 'from-blue-500 to-indigo-600',
  'WEMIX': 'from-blue-600 to-indigo-700',
  'KAVA': 'from-red-500 to-pink-500',
  'KAS': 'from-teal-500 to-cyan-500',
  'CORE': 'from-orange-500 to-amber-400',
};

interface CoinIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CoinIcon({ symbol, size = 'md', className = '' }: CoinIconProps) {
  const [cdnIndex, setCdnIndex] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);
  
  // 심볼 정규화 적용
  const normalizedSymbol = normalizeSymbol(symbol);
  const lowerSymbol = normalizedSymbol.toLowerCase();
  const upperSymbol = normalizedSymbol.toUpperCase();
  
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  const textSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };
  
  const gradient = GRADIENT_COLORS[upperSymbol] || 'from-slate-500 to-slate-600';
  const coingeckoId = COIN_ID_MAP[upperSymbol];
  
  // 우선순위 기반 CDN URL 목록
  const cdnUrls = [
    // 1순위: cryptocurrency-icons (가장 안정적)
    `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${lowerSymbol}.png`,
    // 2순위: spothq GitHub (백업)
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${lowerSymbol}.png`,
    // 3순위: CoinCap (대부분 커버)
    `https://static.coincap.io/assets/icons/${lowerSymbol}@2x.png`,
    // 4순위: CoinGecko ID 기반 (매핑된 코인만)
    coingeckoId ? `https://assets.coingecko.com/coins/images/1/small/${coingeckoId}.png` : null,
    // 5순위: CryptoCompare
    `https://www.cryptocompare.com/media/37746251/${lowerSymbol}.png`,
  ].filter(Boolean) as string[];

  const handleError = () => {
    if (cdnIndex < cdnUrls.length - 1) {
      setCdnIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  // 개발 모드에서 폴백 발생 시 콘솔 경고
  useEffect(() => {
    if (hasError && process.env.NODE_ENV === 'development') {
      console.warn('[CoinIcon] missing icon for symbol:', upperSymbol, '| original:', symbol);
    }
  }, [hasError, upperSymbol, symbol]);

  // 폴백: 그라데이션 배지
  if (hasError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold ${textSizes[size]} flex-shrink-0 ${className}`}>
        {upperSymbol.charAt(0)}
      </div>
    );
  }
  
  return (
    <img
      src={cdnUrls[cdnIndex]}
      alt={upperSymbol}
      className={`${sizeClasses[size]} rounded-full flex-shrink-0 ${className}`}
      onError={handleError}
      loading="lazy"
    />
  );
}
