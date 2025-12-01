import { useEffect, useState, useRef } from "react";
import { useMarkets } from "@/hooks/useMarkets";

interface PremiumDataPoint {
  time: string;
  premium: number;
}

export default function KoreaPremiumChart({ height = 400 }: { height?: number }) {
  const [premiumHistory, setPremiumHistory] = useState<PremiumDataPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { averagePremium, fxRate, updatedAt } = useMarkets({
    domestic: "UPBIT_KRW",
    foreign: "BINANCE_USDT",
  });

  useEffect(() => {
    if (averagePremium !== undefined && updatedAt) {
      setPremiumHistory((prev) => {
        const newPoint = {
          time: new Date(updatedAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          premium: averagePremium,
        };
        const updated = [...prev, newPoint].slice(-60);
        return updated;
      });
    }
  }, [averagePremium, updatedAt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || premiumHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    const padding = { top: 40, right: 60, bottom: 40, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const drawHeight = chartHeight - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, chartHeight);

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, chartHeight);

    const premiums = premiumHistory.map((d) => d.premium);
    const minPremium = Math.min(...premiums) - 0.5;
    const maxPremium = Math.max(...premiums) + 0.5;
    const range = maxPremium - minPremium || 1;

    const getY = (premium: number) => {
      return padding.top + drawHeight - ((premium - minPremium) / range) * drawHeight;
    };

    const getX = (index: number) => {
      return padding.left + (index / (premiumHistory.length - 1)) * chartWidth;
    };

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (drawHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = maxPremium - (range / gridLines) * i;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${value.toFixed(1)}%`, width - padding.right + 35, y + 4);
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

    ctx.beginPath();
    ctx.moveTo(getX(0), chartHeight - padding.bottom);
    premiumHistory.forEach((point, index) => {
      ctx.lineTo(getX(index), getY(point.premium));
    });
    ctx.lineTo(getX(premiumHistory.length - 1), chartHeight - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    premiumHistory.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(getX(index), getY(point.premium));
      } else {
        ctx.lineTo(getX(index), getY(point.premium));
      }
    });
    ctx.stroke();

    if (premiumHistory.length > 0) {
      const lastPoint = premiumHistory[premiumHistory.length - 1];
      const lastX = getX(premiumHistory.length - 1);
      const lastY = getY(lastPoint.premium);

      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = lastPoint.premium >= 0 ? "#22c55e" : "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Korea Premium Index (KPI)", padding.left, 25);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94a3b8";
    const currentPremium = premiumHistory[premiumHistory.length - 1]?.premium || 0;
    ctx.fillText(`현재: ${currentPremium >= 0 ? "+" : ""}${currentPremium.toFixed(2)}%`, padding.left + 200, 25);

    if (premiumHistory.length >= 10) {
      const step = Math.floor(premiumHistory.length / 5);
      ctx.fillStyle = "#64748b";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      for (let i = 0; i < premiumHistory.length; i += step) {
        const x = getX(i);
        ctx.fillText(premiumHistory[i].time, x, chartHeight - padding.bottom + 20);
      }
      const lastIdx = premiumHistory.length - 1;
      ctx.fillText(premiumHistory[lastIdx].time, getX(lastIdx), chartHeight - padding.bottom + 20);
    }

  }, [premiumHistory]);

  return (
    <div style={{ height: `${height}px`, width: "100%" }} className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        className="rounded-lg"
      />
      {premiumHistory.length < 2 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">프리미엄 데이터 수집 중...</p>
            <p className="text-slate-500 text-xs mt-1">실시간 업비트 vs 바이낸스 기준</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-xs text-slate-500">
        환율: ₩{fxRate?.toLocaleString() || "-"}/USDT
      </div>
    </div>
  );
}
