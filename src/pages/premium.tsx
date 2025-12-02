import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import PremiumTable from "@/components/PremiumTable";

export default function PremiumPage() {
  return (
    <Layout>
      <Head>
        <title>김치 프리미엄 실시간 시세 - KimpAI</title>
        <meta
          name="description"
          content="실시간 김치 프리미엄 비교. 업비트, 빗썸, 코인원 등 국내 거래소와 바이낸스, OKX, Bybit 등 해외 거래소 가격 비교."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              김치 프리미엄 실시간 시세
            </h1>
            <p className="text-gray-400">
              국내 · 해외 거래소 가격 비교 및 프리미엄 분석
            </p>
          </div>

          <PremiumTable showHeader={true} showFilters={true} limit={0} />

          <div className="mt-8 bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              김치 프리미엄이란?
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              김치 프리미엄(Kimchi Premium)은 한국 거래소와 해외 거래소 간의
              암호화폐 가격 차이를 나타냅니다. 한국 시장의 높은 수요와 제한된
              공급, 자본 규제로 인해 발생합니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="text-green-400 font-medium mb-2">
                  낮은 프리미엄 (0~1%)
                </div>
                <p className="text-gray-400 text-sm">
                  시장이 안정적인 상태입니다. 차익거래 기회가 제한적입니다.
                </p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="text-yellow-400 font-medium mb-2">
                  보통 프리미엄 (1~3%)
                </div>
                <p className="text-gray-400 text-sm">
                  일반적인 프리미엄 수준입니다. 한국 시장의 수요가 활발합니다.
                </p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="text-red-400 font-medium mb-2">
                  높은 프리미엄 (3%+)
                </div>
                <p className="text-gray-400 text-sm">
                  시장 과열 신호일 수 있습니다. 주의가 필요합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/alerts"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all"
            >
              프리미엄 알림 설정하기
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
