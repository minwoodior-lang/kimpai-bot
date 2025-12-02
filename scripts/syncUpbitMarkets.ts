import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function syncUpbit() {
  console.log("🔄 Starting Upbit market sync...");
  
  try {
    const res = await fetch(
      "https://api.upbit.com/v1/market/all?isDetails=true"
    );
    const data = await res.json();

    const rows = data
      .filter((m: any) => {
        const [quote] = m.market.split("-");
        return ["KRW", "BTC", "USDT"].includes(quote);
      })
      .map((m: any) => {
        const [quote, base] = m.market.split("-");
        return {
          exchange: "UPBIT",
          market: m.market,
          base_symbol: base,
          quote_symbol: quote,
          name_ko: m.korean_name,
          name_en: m.english_name,
          icon_url: null,
        };
      });

    console.log(`📊 Found ${rows.length} Upbit markets (KRW/BTC/USDT)`);

    const { error } = await supabase
      .from("exchange_markets")
      .upsert(rows, { onConflict: "exchange,market" });

    if (error) {
      console.error("❌ syncUpbit error:", error);
      throw error;
    }

    console.log(`✅ Successfully synced ${rows.length} Upbit markets`);
  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  }
}

syncUpbit();
