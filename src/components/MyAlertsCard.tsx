import Link from "next/link";

const TELEGRAM_FREE_SIGNAL_URL = "https://t.me/kimp_ai";

export default function MyAlertsCard({ className }: { className?: string }) {
  return (
    <div
      className={`h-full rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-4 flex flex-col ${className || ""}`}
    >
      {/* 타이틀 */}
      <div className="text-sm font-semibold text-slate-100 mb-2">
        📡 실시간 시그널 채널
      </div>

      {/* 본문 */}
      <div className="text-xs text-slate-300 space-y-1 mb-4 leading-relaxed">
        <p>Binance 고래 매매 · 거래량 폭발 ·</p>
        <p>BTC/ETH 김프 급변만 실시간 발송.</p>
      </div>

      {/* 버튼 */}
      <Link
        href={TELEGRAM_FREE_SIGNAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-semibold text-white py-2"
      >
        {/* 텔레그램 로고 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-4 h-4"
        >
          <path d="M9.04 15.34 8.9 18.5c.32 0 .46-.14.63-.31l1.5-1.43 3.11 2.28c.57.32.98.15 1.13-.53l2.05-9.62c.19-.81-.31-1.13-.86-.93L3.9 10.27c-.8.31-.79.76-.14.96l3.9 1.22 9.05-5.7c.43-.28.82-.13.5.15l-7.27 6.67Z" />
        </svg>

        텔레그램 채널 열기
      </Link>
    </div>
  );
}
