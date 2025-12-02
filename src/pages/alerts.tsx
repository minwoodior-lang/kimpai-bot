import Head from "next/head";
import Layout from "@/components/layout/Layout";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

type AlertRow = {
  id: string;
  symbol: string;
  condition_type: "above" | "below";
  threshold: number;
  is_active: boolean;
  created_at: string;
};

type UserProfile = {
  plan: string | null;
  credits: number | null;
};

const MIN_THRESHOLD = 0.1; // 최소 0.1%
const MAX_THRESHOLD = 100; // 최대 100%

export default function Alerts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    symbol: "BTC/KRW",
    conditionType: "above" as "above" | "below",
    threshold: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 유저 프로필 가져오기
  const fetchProfile = useCallback(async (uid: string) => {
    setLoadingProfile(true);
    const { data, error } = await supabase
      .from("users")
      .select("plan, credits")
      .eq("id", uid)
      .single();

    if (error) {
      console.error("프로필 조회 오류:", error);
    } else {
      setProfile({
        plan: data?.plan ?? null,
        credits: data?.credits ?? null,
      });
    }
    setLoadingProfile(false);
  }, []);

  // 알림 목록 가져오기
  const fetchAlerts = useCallback(async (uid: string) => {
    setLoadingAlerts(true);
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("알림 조회 오류:", error);
    } else {
      setAlerts(data || []);
    }
    setLoadingAlerts(false);
  }, []);

  // 로그인 세션 확인 후 uid 세팅 + 프로필/알림 로드
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        const uid = data.session.user.id;
        setUserId(uid);
        setLoading(false);
        fetchProfile(uid);
        fetchAlerts(uid);
      }
    });
  }, [router, fetchProfile, fetchAlerts]);

  // 알림 생성
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setFormError("");
    setSubmitting(true);

    const threshold = Number(form.threshold);

    if (
      isNaN(threshold) ||
      threshold < MIN_THRESHOLD ||
      threshold > MAX_THRESHOLD
    ) {
      setFormError(
        `임계값은 ${MIN_THRESHOLD}% 이상, ${MAX_THRESHOLD}% 이하의 숫자만 입력할 수 있습니다.`
      );
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("alerts").insert({
      user_id: userId,
      symbol: form.symbol,
      condition_type: form.conditionType,
      threshold: threshold,
      is_active: true,
    });

    if (error) {
      console.error("알림 생성 오류:", error);
      setFormError("알림 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } else {
      setForm({ symbol: "BTC/KRW", conditionType: "above", threshold: "" });
      setShowCreateModal(false);
      fetchAlerts(userId);
    }
    setSubmitting(false);
  };

  // 알림 활성/비활성 토글
  const handleToggle = async (alert: AlertRow) => {
    if (!userId) return;

    const { error } = await supabase
      .from("alerts")
      .update({ is_active: !alert.is_active })
      .eq("id", alert.id)
      .eq("user_id", userId);

    if (error) {
      console.error("알림 상태 변경 오류:", error);
    } else {
      fetchAlerts(userId);
    }
  };

  // 알림 삭제
  const handleDelete = async (alert: AlertRow) => {
    if (!userId) return;

    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", alert.id)
      .eq("user_id", userId);

    if (error) {
      console.error("알림 삭제 오류:", error);
    } else {
      fetchAlerts(userId);
    }
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

  return (
    <Layout>
      <Head>
        <title>가격 알림 - KimpAI</title>
        <meta
          name="description"
          content="김프 및 코인 가격 변화에 맞춰 자동으로 알려주는 KimpAI 가격 알림 기능"
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 유저 플랜 / 크레딧 표시 */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
            플랜:{" "}
            <span className="font-semibold">
              {profile?.plan ? profile.plan.toUpperCase() : "FREE"}
            </span>
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
            남은 크레딧:{" "}
            <span className="font-semibold">
              {loadingProfile
                ? "불러오는 중..."
                : profile?.credits ?? "—"}
            </span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">김프 / 가격 알림</h1>
            <p className="text-slate-400">
              지정한 조건에 도달하면 자동으로 알려주는 알림을 설정하세요.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <span>+</span> 알림 생성
          </button>
        </div>

        {/* 알림 목록 카드 */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">내 알림 목록</h2>
          </div>

          {loadingAlerts ? (
            <div className="p-8 text-center text-slate-400">
              알림 목록을 불러오는 중입니다...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              아직 등록된 알림이 없습니다. 상단의 <b>알림 생성</b> 버튼을 눌러 첫 알림을
              만들어보세요.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          alert.is_active ? "bg-green-400" : "bg-slate-500"
                        }`}
                      ></div>
                      <div>
                        <div className="text-white font-medium">
                          {alert.symbol}{" "}
                          {alert.condition_type === "above"
                            ? "프리미엄 이상일 때"
                            : "프리미엄 이하일 때"}{" "}
                          {alert.threshold}%
                        </div>
                        <div className="text-slate-500 text-sm">
                          생성일{" "}
                          {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          alert.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-600/50 text-slate-400"
                        }`}
                      >
                        {alert.is_active ? "사용 중" : "일시 정지"}
                      </span>
                      <button
                        onClick={() => handleToggle(alert)}
                        className="text-slate-400 hover:text-blue-400 transition-colors px-3 py-1 text-sm border border-slate-600 rounded-lg hover:border-blue-500"
                      >
                        {alert.is_active ? "일시 정지" : "다시 사용"}
                      </button>
                      <button
                        onClick={() => handleDelete(alert)}
                        className="text-slate-400 hover:text-red-400 transition-colors px-3 py-1 text-sm border border-slate-600 rounded-lg hover:border-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 알림 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">새 알림 만들기</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">종목</label>
                  <select
                    value={form.symbol}
                    onChange={(e) =>
                      setForm({ ...form, symbol: e.target.value })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BTC/KRW">BTC/KRW</option>
                    <option value="ETH/KRW">ETH/KRW</option>
                    <option value="XRP/KRW">XRP/KRW</option>
                    <option value="SOL/KRW">SOL/KRW</option>
                    <option value="ADA/KRW">ADA/KRW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">
                    조건
                  </label>
                  <select
                    value={form.conditionType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        conditionType: e.target
                          .value as "above" | "below",
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="above">프리미엄 ○○% 이상일 때</option>
                    <option value="below">프리미엄 ○○% 이하일 때</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">
                    임계값 (%)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={MIN_THRESHOLD}
                    max={MAX_THRESHOLD}
                    value={form.threshold}
                    onChange={(e) =>
                      setForm({ ...form, threshold: e.target.value })
                    }
                    placeholder={`예: 5 (최소 ${MIN_THRESHOLD} ~ 최대 ${MAX_THRESHOLD})`}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    예) 5 입력 시, 프리미엄이 5% 이상 / 이하가 될 때 알림을 받습니다.
                    (범위: {MIN_THRESHOLD}% ~ {MAX_THRESHOLD}%)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "알림 생성 중..." : "알림 생성"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
