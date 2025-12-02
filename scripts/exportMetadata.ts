import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportTable(
  table: string,
  fileName: string
): Promise<{ table: string; file: string; rows: number; status: string }> {
  try {
    const { data, error } = await supabase.from(table).select("*");

    if (error) {
      console.error(`❌ Export error for ${table}:`, error.message);
      return { table, file: fileName, rows: 0, status: "ERROR" };
    }

    if (!data) {
      console.error(`❌ No data returned for ${table}`);
      return { table, file: fileName, rows: 0, status: "NO_DATA" };
    }

    const filePath = path.join(process.cwd(), "data", "symbols", fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✅ ${table} → ${fileName} 완료 (${data.length} rows)`);
    return { table, file: fileName, rows: data.length, status: "SUCCESS" };
  } catch (err: any) {
    console.error(`❌ Exception for ${table}:`, err.message);
    return { table, file: fileName, rows: 0, status: "EXCEPTION" };
  }
}

async function main() {
  console.log("🚀 메타데이터 Export 시작...\n");

  const results = await Promise.all([
    exportTable("master_symbols", "master_symbols.json"),
    exportTable("exchange_markets", "exchange_markets.json"),
    exportTable("exchange_symbol_mappings", "exchange_symbol_mappings.json"),
    exportTable("exchanges", "exchanges.json"),
  ]);

  console.log("\n📊 Export 결과:");
  console.log("─".repeat(70));

  let totalRows = 0;
  for (const result of results) {
    console.log(
      `${result.status === "SUCCESS" ? "✅" : "❌"} ${result.table.padEnd(30)} → ${result.rows} rows`
    );
    if (result.status === "SUCCESS") totalRows += result.rows;
  }

  console.log("─".repeat(70));
  console.log(`📁 총 ${totalRows}개 행이 로컬에 저장되었습니다.\n`);

  const allSuccess = results.every((r) => r.status === "SUCCESS");
  process.exit(allSuccess ? 0 : 1);
}

main();
