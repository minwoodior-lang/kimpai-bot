import { useEffect } from "react";
import Router from "next/router";

export function useAnalyticsHeartbeat() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let path = window.location.pathname;

    const sendHeartbeat = () => {
      fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }).catch(() => {});
    };

    // 최초 1회
    sendHeartbeat();

    // 30초마다
    const interval = setInterval(sendHeartbeat, 30_000);

    // 라우트 변경 시 path 업데이트 + 한 번 더 전송
    const handleRouteChange = (url: string) => {
      path = url;
      sendHeartbeat();
    };
    Router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      clearInterval(interval);
      Router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);
}
