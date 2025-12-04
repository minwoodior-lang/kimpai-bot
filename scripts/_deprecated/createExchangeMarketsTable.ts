import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function createTable() {
  console.log("🔨 Creating exchange_markets table if not exists...");

  try {
    const { error } = await supabase.rpc("create_exchange_markets_table", {});

    if (error) {
      console.error("RPC error:", error);
      // Try direct SQL instead
      console.log("📝 Attempting direct SQL creation...");
    } else {
      console.log("✅ Table creation initiated");
    }
  } catch (err) {
    console.error("⚠️ Create failed:", err);
  }
}

createTable();
