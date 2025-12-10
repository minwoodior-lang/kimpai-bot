import Head from "next/head";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setSession(data.session);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  const email = session?.user?.email;

  return (
    <Layout>
      <Head>
        <title>대시보드 - KimpAI</title>
        <meta name="description" content="KimpAI 프로 대시보드" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">대시보드</h1>
            <p className="text-slate-400">다시 오셨습니다. {email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">평균 김프</div>
            <div className="text-2xl font-bold text-green-400">+3.8%</div>
            <div className="text-slate-500 text-sm mt-1">어제 대비 +0.5%</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">BTC 김프</div>
            <div className="text-2xl font-bold text-green-400">+4.2%</div>
            <div className="text-slate-500 text-sm mt-1">₩98.5M / $67.5K</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">활성 알림</div>
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-slate-500 text-sm mt-1">오늘 발생 2건</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">USDT/KRW 환율</div>
            <div className="text-2xl font-bold text-white">₩1,325.50</div>
            <div className="text-slate-500 text-sm mt-1">오늘 -0.3%</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">김프 차트</h2>
              <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-white text-sm">
                <option>최근 7일</option>
                <option>최근 30일</option>
                <option>최근 90일</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center border border-dashed border-slate-600 rounded-lg">
              <span className="text-slate-500">차트 영역 - 김프 추세 그래프</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">빠른 메뉴</h2>
            <div className="space-y-3">
              <Link
                href="/alerts"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔔</span>
                </div>
                <div>
                  <div className="text-white font-medium">알림 만들기</div>
                  <div className="text-slate-500 text-sm">가격 알림 설정</div>
                </div>
              </Link>
              <Link
                href="/analysis"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <div className="text-white font-medium">AI 분석</div>
                  <div className="text-slate-500 text-sm">시장 예측 보기</div>
                </div>
              </Link>
              <Link
                href="/markets"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <div className="text-white font-medium">라이브 시장</div>
                  <div className="text-slate-500 text-sm">모든 거래쌍 보기</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">최근 알림</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white">BTC 김프가 4%를 초과했습니다</span>
              </div>
              <span className="text-slate-500 text-sm">2시간 전</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-white">ETH 가격이 ₩4.8M 아래로 내려갔습니다</span>
              </div>
              <span className="text-slate-500 text-sm">5시간 전</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
