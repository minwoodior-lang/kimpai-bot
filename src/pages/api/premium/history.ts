import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

interface PremiumHistoryResponse {
  success: boolean;
  data: { time: string; premium: number }[];
  symbol: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PremiumHistoryResponse>
) {
  const { symbol = "BTC", hours = "24" } = req.query;
  const hoursNum = parseInt(hours as string, 10) || 24;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(200).json({
        success: true,
        data: [],
        symbol: symbol as string,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = new Date(Date.now() - hoursNum * 60 * 60 * 1000).toISOString();

    const { data: snapshots, error } = await supabase
      .from("price_snapshots")
      .select("created_at, premium")
      .eq("symbol", symbol)
      .gte("created_at", startTime)
      .order("created_at", { ascending: true });

    if (error || !snapshots) {
      return res.status(200).json({
        success: true,
        data: [],
        symbol: symbol as string,
      });
    }

    const interval = Math.max(1, Math.floor(snapshots.length / 100));
    const sampledData = snapshots
      .filter((_, index) => index % interval === 0)
      .map((snapshot) => ({
        time: snapshot.created_at,
        premium: Number(snapshot.premium),
      }));

    res.status(200).json({
      success: true,
      data: sampledData,
      symbol: symbol as string,
    });
  } catch (error) {
    console.error("Premium history error:", error);
    res.status(200).json({
      success: true,
      data: [],
      symbol: symbol as string,
    });
  }
}
