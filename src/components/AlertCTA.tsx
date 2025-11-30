import Link from "next/link";

const AlertCTA = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-slate-700 rounded-xl p-8 text-center text-white">
      <h2 className="text-2xl font-bold">자동 김프 알림 기능</h2>
      <p className="mt-3 text-slate-300">
        원하는 김프 구간에 도달하면 자동으로 알려드립니다.
        <br />
        무료로 몇 개의 알림부터 바로 써볼 수 있어요.
      </p>

      <Link
        href="/alerts"
        className="mt-6 inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-lg font-semibold hover:opacity-90"
      >
        🔔 김프 알림 설정하러 가기
      </Link>
    </div>
  );
};

export default AlertCTA;
