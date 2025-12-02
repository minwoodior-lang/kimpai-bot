import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function fetchBithumbMarkets() {
  try {
    const res = await fetch("https://api.bithumb.com/public/ticker/ALL");
    const data = await res.json();

    if (data.status !== "0000") {
      throw new Error(`Bithumb API error: ${data.message}`);
    }

    const markets: any[] = [];
    Object.entries(data.data).forEach(([market, _]: any) => {
      if (market === "date") return;

      const [base, quote] = market.split("_");
      if (!["KRW", "BTC", "USDT"].includes(quote) || !base) return;

      markets.push({
        market: `${quote}-${base}`,
        base_symbol: base,
        quote_symbol: quote,
      });
    });

    return markets;
  } catch (err) {
    console.error("❌ fetchBithumbMarkets error:", err);
    throw err;
  }
}

async function syncBithumb() {
  console.log("🔄 Starting Bithumb market sync...");

  try {
    const markets = await fetchBithumbMarkets();

    const rows = markets.map((m) => ({
      exchange: "BITHUMB",
      market: m.market,
      base_symbol: m.base_symbol,
      quote_symbol: m.quote_symbol,
      name_ko: null,
      name_en: null,
      icon_url: null,
    }));

    console.log(`📊 Found ${rows.length} Bithumb markets (KRW/BTC/USDT)`);

    const { error } = await supabase
      .from("exchange_markets")
      .upsert(rows, { onConflict: "exchange,market" });

    if (error) {
      console.error("❌ syncBithumb error:", error);
      throw error;
    }

    console.log(`✅ Successfully synced ${rows.length} Bithumb markets`);
  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  }
}

syncBithumb();
