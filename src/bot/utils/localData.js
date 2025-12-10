const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");

function readJsonFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.warn(`[LocalData] ${filename} 읽기 실패:`, err.message);
    return null;
  }
}

function getPrices() {
  return readJsonFile("prices.json") || {};
}

function getMarketStats() {
  return readJsonFile("marketStats.json") || {};
}

function getPremiumTable() {
  return readJsonFile("premiumTable.json") || [];
}

function getBtcData() {
  const prices = getPrices();
  const stats = getMarketStats();
  const premium = getPremiumTable();
  
  const btcRow = premium.find(r => r.symbol === "BTC");
  const upbitBtc = prices["UPBIT:BTC:KRW"];
  const binanceBtc = prices["BINANCE:BTC:USDT"];
  const btcStats = stats["UPBIT:BTC:KRW"];
  
  const koreanPrice = upbitBtc?.price || btcRow?.koreanPrice || 0;
  const globalPrice = binanceBtc?.price || btcRow?.globalPrice || 0;
  const currentPremium = btcRow?.premium || 0;
  const change24h = btcStats?.change24hRate || btcRow?.change24h || 0;
  
  return {
    korean_price: koreanPrice,
    global_price: globalPrice,
    current: currentPremium.toFixed(2),
    prev: (currentPremium - 0.1).toFixed(2),
    change_24h: change24h.toFixed(2),
  };
}

function getEthData() {
  const prices = getPrices();
  const stats = getMarketStats();
  const premium = getPremiumTable();
  
  const ethRow = premium.find(r => r.symbol === "ETH");
  const upbitEth = prices["UPBIT:ETH:KRW"];
  const binanceEth = prices["BINANCE:ETH:USDT"];
  const ethStats = stats["UPBIT:ETH:KRW"];
  
  const koreanPrice = upbitEth?.price || ethRow?.koreanPrice || 0;
  const globalPrice = binanceEth?.price || ethRow?.globalPrice || 0;
  const volume = ethStats?.volume24h || ethRow?.volume24hKrw || 0;
  
  return {
    korean_price: koreanPrice,
    global_price: globalPrice,
    oi: "N/A",
    fund: "0.00",
    bias: "중립",
    vol_prev: (volume * 0.9).toFixed(0),
    vol_now: volume.toFixed(0),
  };
}

function getAltData(symbol) {
  const prices = getPrices();
  const stats = getMarketStats();
  const premium = getPremiumTable();
  
  const row = premium.find(r => r.symbol === symbol.toUpperCase());
  if (!row) return null;
  
  const upbitKey = `UPBIT:${symbol.toUpperCase()}:KRW`;
  const binanceKey = `BINANCE:${symbol.toUpperCase()}:USDT`;
  
  const koreanPrice = prices[upbitKey]?.price || row.koreanPrice || 0;
  const globalPrice = prices[binanceKey]?.price || row.globalPrice || 0;
  const altStats = stats[upbitKey] || {};
  
  return {
    symbol: row.symbol,
    korean_price: koreanPrice,
    usdt_price: globalPrice,
    global_price: globalPrice,
    premium: row.premium?.toFixed(2) || "0",
    price_change_1h: altStats.change1hRate?.toFixed(2) || row.change24h?.toFixed(2) || "0",
    volume_change_1h: "0",
    funding_rate: "0.00",
  };
}

function getAltsTop(limit = 50) {
  const premium = getPremiumTable();
  const stats = getMarketStats();
  
  return premium
    .filter(r => r.symbol !== "BTC" && r.symbol !== "ETH" && r.koreanPrice)
    .slice(0, limit)
    .map(row => {
      const upbitKey = `UPBIT:${row.symbol}:KRW`;
      const altStats = stats[upbitKey] || {};
      
      return {
        symbol: row.symbol,
        korean_price: row.koreanPrice,
        usdt_price: row.globalPrice,
        premium: row.premium?.toFixed(2) || "0",
        price_change_1h: altStats.change1hRate?.toFixed(2) || row.change24h?.toFixed(2) || "0",
        volume_change_1h: "0",
        volume_24h: row.volume24hKrw || 0,
      };
    });
}

function getPremiumFiltered(domesticExchange = "UPBIT", domesticQuote = "KRW", foreignExchange = "BINANCE", foreignQuote = "USDT") {
  const premium = getPremiumTable();
  const prices = getPrices();
  const stats = getMarketStats();
  
  return premium.map(row => {
    const domesticKey = `${domesticExchange}:${row.symbol}:${domesticQuote}`;
    const foreignKey = `${foreignExchange}:${row.symbol}:${foreignQuote}`;
    
    const domesticPrice = prices[domesticKey]?.price || row.koreanPrice;
    const foreignPrice = prices[foreignKey]?.price || row.globalPrice;
    const domesticStats = stats[domesticKey] || {};
    
    return {
      symbol: row.symbol,
      domesticPrice,
      foreignPrice,
      premium: row.premium,
      change24h: domesticStats.change24hRate ?? row.change24h,
      volume24hKrw: row.volume24hKrw,
    };
  }).filter(r => r.domesticPrice || r.foreignPrice);
}

function getProBtcData() {
  const btc = getBtcData();
  const premium = getPremiumTable();
  const btcRow = premium.find(r => r.symbol === "BTC");
  
  return {
    symbol: "BTC",
    kimp: parseFloat(btc.current) || 0,
    korean_price: btc.korean_price,
    global_price: btc.global_price,
    change_24h: parseFloat(btc.change_24h) || 0,
    volume_24h: btcRow?.volume24hKrw || 0,
    up_prob: 52,
    score: 65,
    ai_line: null,
  };
}

function getProWhaleData(symbol) {
  const alt = getAltData(symbol);
  if (!alt) return null;
  
  const premium = getPremiumTable();
  const row = premium.find(r => r.symbol === symbol.toUpperCase());
  
  return {
    symbol: alt.symbol,
    trend: "중립",
    change_24h: parseFloat(alt.price_change_1h) || 0,
    premium: parseFloat(alt.premium) || 0,
    net_inflow: 0,
    korean_price: alt.korean_price,
    global_price: alt.global_price,
    volume_24h: row?.volume24hKrw || 0,
    ai_line: null,
  };
}

function getProRiskData(symbol) {
  const alt = getAltData(symbol);
  if (!alt) return null;
  
  const premium = getPremiumTable();
  const row = premium.find(r => r.symbol === symbol.toUpperCase());
  
  return {
    symbol: alt.symbol,
    risk_level: "보통",
    risk_score: 45,
    premium: parseFloat(alt.premium) || 0,
    change_24h: parseFloat(alt.price_change_1h) || 0,
    korean_price: alt.korean_price,
    global_price: alt.global_price,
    volume_24h: row?.volume24hKrw || 0,
    ai_line: null,
  };
}

module.exports = {
  readJsonFile,
  getPrices,
  getMarketStats,
  getPremiumTable,
  getBtcData,
  getEthData,
  getAltData,
  getAltsTop,
  getPremiumFiltered,
  getProBtcData,
  getProWhaleData,
  getProRiskData,
};
