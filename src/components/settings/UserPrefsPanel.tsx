import { UserPrefs } from "@/hooks/useUserPrefs";

interface UserPrefsPanelProps {
  prefs: UserPrefs;
  onPrefsChange: (update: Partial<UserPrefs>) => void;
  onClose: () => void;
}

const timeframeOptions = [
  { value: "1m" as const, label: "1분" },
  { value: "3m" as const, label: "3분" },
  { value: "5m" as const, label: "5분" },
  { value: "15m" as const, label: "15분" },
  { value: "30m" as const, label: "30분" },
  { value: "1h" as const, label: "1시간" },
  { value: "2h" as const, label: "2시간" },
  { value: "3h" as const, label: "3시간" },
  { value: "4h" as const, label: "4시간" },
  { value: "1d" as const, label: "1일" },
  { value: "1w" as const, label: "1주" },
];

export default function UserPrefsPanel({
  prefs,
  onPrefsChange,
  onClose,
}: UserPrefsPanelProps) {
  return (
    <>
      {/* 어두운 오버레이 (좌측 흐리게) */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* 오른쪽 설정 패널 (불투명 배경) */}
      <div
        className="
          fixed right-0 top-0 bottom-0
          w-full sm:w-[360px]
          bg-[#020617]           /* ← 완전 불투명 다크 배경 */
          z-50 overflow-y-auto
          shadow-[0_0_30px_rgba(0,0,0,0.7)]
          border-l border-slate-800
        "
      >
        {/* 헤더 */}
        <div className="
          sticky top-0 z-10
          bg-[#020617]
          border-b border-slate-800
          p-4 flex items-center justify-between
        ">
          <h2 className="text-lg font-semibold text-white">
            개인화 설정
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-light text-slate-400 hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-6 text-slate-200">
          {/* 1. 차트 숨기기 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">
              차트
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.hideChart}
                onChange={(e) =>
                  onPrefsChange({ hideChart: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-500"
              />
              <span className="text-sm text-slate-300">
                홈 차트 숨기기
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-7">
              홈 화면 상단 프리미엄 차트를 숨깁니다.
            </p>
          </div>

          {/* 2. 가격 단위 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">
              가격 단위
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="priceUnit"
                  value="KRW"
                  checked={prefs.priceUnit === "KRW"}
                  onChange={() => onPrefsChange({ priceUnit: "KRW" })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-sm text-slate-300">
                  KRW 기준 (기본값)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="priceUnit"
                  value="USDT"
                  checked={prefs.priceUnit === "USDT"}
                  onChange={() => onPrefsChange({ priceUnit: "USDT" })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-sm text-slate-300">
                  USDT 기준
                </span>
              </label>
            </div>
          </div>

          {/* 3. 리스트 필터 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">
              리스트 필터
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filterMode"
                  value="all"
                  checked={prefs.filterMode === "all"}
                  onChange={() => onPrefsChange({ filterMode: "all" })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-sm text-slate-300">
                  모든 코인
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filterMode"
                  value="foreign"
                  checked={prefs.filterMode === "foreign"}
                  onChange={() => onPrefsChange({ filterMode: "foreign" })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-sm text-slate-300">
                  해외 거래소 보유 자산만
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filterMode"
                  value="favorites"
                  checked={prefs.filterMode === "favorites"}
                  onChange={() => onPrefsChange({ filterMode: "favorites" })}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-sm text-slate-300">
                  내 관심 자산만
                  {prefs.favorites && prefs.favorites.length > 0 && (
                    <span className="ml-1 text-xs text-indigo-400">
                      ({prefs.favorites.length}개)
                    </span>
                  )}
                </span>
              </label>

              {prefs.filterMode === "favorites" &&
                (!prefs.favorites || prefs.favorites.length === 0) && (
                  <p className="text-xs text-amber-400/80 mt-1 ml-7">
                    아직 즐겨찾기한 코인이 없습니다. 코인 목록에서 ★ 버튼을 눌러 추가해주세요.
                  </p>
                )}
            </div>
          </div>

          {/* 4. 기본 차트 시간간격 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">
              기본 차트 시간간격
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {timeframeOptions.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() =>
                    onPrefsChange({ defaultTimeframe: tf.value })
                  }
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    prefs.defaultTimeframe === tf.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
