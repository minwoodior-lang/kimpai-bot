import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "로그인에 실패했습니다");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch (err) {
      setError("서버 연결에 실패했습니다");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>관리자 로그인 - KimpAI</title>
        <meta name="description" content="KimpAI 관리자 로그인" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/favicon-32x32.png" alt="KimpAI" className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">관리자 로그인</h1>
            <p className="text-slate-400">KimpAI 관리자 페이지</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-slate-300 text-sm font-medium mb-2">
                  아이디
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="아이디 입력"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="비밀번호 입력"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm text-center">
                관리자 전용 페이지입니다. 무단 접근 시도는 기록됩니다.
              </p>
            </div>
          </div>

          <p className="text-center text-slate-400 mt-6">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              메인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
