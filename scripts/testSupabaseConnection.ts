import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function test() {
  console.log("🔍 Testing Supabase connection...");
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 간단한 조회로 연결 테스트
    const { data, error } = await supabase
      .from("exchange_markets")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Error:", error);
    } else {
      console.log("✅ Connection OK. Existing records:", data?.length || 0);
    }
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

test();
