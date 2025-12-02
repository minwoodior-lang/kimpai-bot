import Link from "next/link";

const HeroSection = () => {
  return (
    <div className="text-center text-white">
      <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
        실시간 김프 확인 + AI 분석 플랫폼
      </h1>
      <p className="text-slate-300 mt-4 text-lg">
        업비트·바이낸스 가격을 비교해{" "}
        <span className="font-semibold">김치프리미엄</span>을 즉시 확인하고,
        AI 분석으로 시장 흐름을 예측하세요.
      </p>
      <Link
        href="/alerts"
        className="inline-block mt-8 px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 rounded-xl font-semibold"
      >
        🔔 무료 김프 알림 받기
      </Link>
    </div>
  );
};

export default HeroSection;
