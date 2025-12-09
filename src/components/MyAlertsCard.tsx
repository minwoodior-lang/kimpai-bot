import Link from "next/link";

const TELEGRAM_FREE_SIGNAL_URL = "https://t.me/kimp_ai";

export default function MyAlertsCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border dark:border-slate-700/60 light:border-slate-300/40
      dark:bg-slate-900/40 light:bg-slate-100/30
      p-3 sm:p-4 h-full flex flex-col ${className ?? ""}`}
    >
      {/* 타이틀 */}
      <div className="text-base font-bold dark:text-slate-100 light:text-slate-900 mb-2 flex items-center gap-2">
        <span>📡</span>
        <span>실시간 시그널 채널</span>
      </div>

      {/* 본문 */}
      <p className="text-xs sm:text-sm dark:text-slate-300 light:text-slate-700 mb-4 leading-relaxed">
        Binance 고래 매매 · 거래량 폭발 · BTC/ETH 김프 급변만 실시간 발송.
      </p>

      {/* 버튼 */}
      <Link
        href={TELEGRAM_FREE_SIGNAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto"
      >
        <button
          type="button"
          className="w-full h-10 rounded-lg font-semibold text-white text-xs sm:text-sm
          bg-gradient-to-r from-[#8155FF] to-[#5D3DFF]
          hover:from-[#7043FF] hover:to-[#4C2FFF]
          flex items-center justify-center gap-2 transition-all"
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

          <span>텔레그램 채널 열기</span>
        </button>
      </Link>
    </div>
  );
}
