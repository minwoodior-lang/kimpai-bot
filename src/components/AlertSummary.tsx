import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Alert {
  id: string;
  symbol: string;
  condition_type: string;
  threshold: number;
  is_active: boolean;
}

export default function AlertSummary() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .limit(3);

      if (data) {
        setAlerts(data);
      }
      setLoading(false);
    }

    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-24 mb-3"></div>
          <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-3 bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">내 알림</h3>
        <p className="text-slate-400 text-sm mb-3">로그인하면 김프 알림을 설정할 수 있습니다.</p>
        <Link
          href="/login"
          className="inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          로그인하기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">내 알림</h3>
        <Link href="/alerts" className="text-xs text-blue-400 hover:text-blue-300">
          전체 보기
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div>
          <p className="text-slate-400 text-sm mb-3">설정된 알림이 없습니다.</p>
          <Link
            href="/alerts"
            className="inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            알림 설정하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between text-sm bg-slate-700/30 px-3 py-2 rounded-lg"
            >
              <span className="text-white font-medium">{alert.symbol}</span>
              <span className="text-slate-400">
                {alert.condition_type === "above" ? ">" : "<"} {alert.threshold}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
