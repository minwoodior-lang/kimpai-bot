import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 기본 SEO */}
        <title>KimpAI - AI 기반 김프 분석 &amp; 재정거래 기회 탐지</title>
        <meta
          name="description"
          content="실시간 암호화폐 김치 프리미엄 분석, 김프 변동 감지, 재정거래 기회 탐지, 초정밀 AI 시점 예측. 업비트·빗썸·코인원·해외거래소 자동 비교."
        />
        <meta
          name="keywords"
          content="김프, 김치프리미엄, 재정거래, 코인 프리미엄, 암호화폐, AI 분석, KimpAI, 김프 비교 사이트"
        />
        <meta name="author" content="KimpAI" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#3B82F6" />

        {/* Open Graph (카톡, 디스코드 등 공유 썸네일) */}
        <meta property="og:title" content="KimpAI - AI가 포착하는 김프 재정거래 기회" />
        <meta
          property="og:description"
          content="실시간 김치 프리미엄 분석 및 AI 기반 초정밀 시점 예측. 국내·해외 9개 거래소 가격 자동 비교."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kimpai.io" />
        <meta property="og:image" content="https://kimpai.io/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="KimpAI" />

        {/* Twitter Card (X 공유 최적화) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KimpAI - AI가 포착하는 김프 재정거래 기회" />
        <meta
          name="twitter:description"
          content="AI 기반 실시간 김프 분석 · 김치 프리미엄 자동 비교 · 재정거래 탐지 서비스"
        />
        <meta name="twitter:image" content="https://kimpai.io/og-image.png" />
        <meta name="twitter:site" content="@kimpai" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://kimpai.io" />

        {/* 파비콘 세트 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />

        {/* 구조화 데이터(JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "KimpAI",
              url: "https://kimpai.io",
              description:
                "실시간 김프(김치 프리미엄) 분석 및 AI 기반 재정거래 탐지 플랫폼",
              publisher: {
                "@type": "Organization",
                name: "KimpAI",
                url: "https://kimpai.io",
                logo: "https://kimpai.io/favicon-192x192.png",
              },
            }),
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
