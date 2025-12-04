import { useState } from "react";
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
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 패널 */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 dark:bg-slate-900 light:bg-white z-50 overflow-y-auto shadow-2xl border-l dark:border-slate-700 light:border-slate-200">
        {/* 헤더 */}
        <div className="sticky top-0 dark:bg-slate-900 light:bg-white border-b dark:border-slate-700 light:border-slate-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold dark:text-white light:text-slate-900">개인화 설정</h2>
          <button
            onClick={onClose}
            className="text-2xl font-light dark:text-slate-400 light:text-slate-600 hover:dark:text-slate-300 hover:light:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4 space-y-6">
          {/* 1. 차트 숨기기 */}
          <div>
            <h3 className="text-sm font-semibold dark:text-slate-200 light:text-slate-800 mb-2">
              차트
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.hideChart}
                onChange={(e) => onPrefsChange({ hideChart: e.target.checked })}
                className="w-4 h-4 dark:accent-indigo-500 light:accent-indigo-600"
              />
              <span className="text-sm dark:text-slate-300 light:text-slate-700">
                홈 차트 숨기기
              </span>
            </label>
            <p className="text-xs dark:text-slate-500 light:text-slate-500 mt-1 ml-7">
              홈 화면 상단 프리미엄 차트를 숨깁니다.
            </p>
          </div>

          {/* 2. 가격 단위 */}
          <div>
            <h3 className="text-sm font-semibold dark:text-slate-200 light:text-slate-800 mb-2">
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
                  className="w-4 h-4 dark:accent-indigo-500 light:accent-indigo-600"
                />
                <span className="text-sm dark:text-slate-300 light:text-slate-700">
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
                  className="w-4 h-4 dark:accent-indigo-500 light:accent-indigo-600"
                />
                <span className="text-sm dark:text-slate-300 light:text-slate-700">
                  USDT 기준
                </span>
              </label>
            </div>
          </div>

          {/* 3. 리스트 필터 */}
          <div>
            <h3 className="text-sm font-semibold dark:text-slate-200 light:text-slate-800 mb-2">
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
                  className="w-4 h-4 dark:accent-indigo-500 light:accent-indigo-600"
                />
                <span className="text-sm dark:text-slate-300 light:text-slate-700">
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
                  className="w-4 h-4 dark:accent-indigo-500 light:accent-indigo-600"
                />
                <span className="text-sm dark:text-slate-300 light:text-slate-700">
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
                  className="w-4 h-4 dark:accent-indigo-500 light:accent-indigo-600"
                />
                <span className="text-sm dark:text-slate-300 light:text-slate-700">
                  내 관심 자산만
                  {prefs.favorites && prefs.favorites.length > 0 && (
                    <span className="ml-1 text-xs text-indigo-400">
                      ({prefs.favorites.length}개)
                    </span>
                  )}
                </span>
              </label>
              {prefs.filterMode === "favorites" && (!prefs.favorites || prefs.favorites.length === 0) && (
                <p className="text-xs dark:text-amber-400/80 light:text-amber-600 mt-1 ml-7">
                  아직 즐겨찾기한 코인이 없습니다. 코인 목록에서 ★ 버튼을 눌러 추가해주세요.
                </p>
              )}
            </div>
          </div>

          {/* 4. 기본 차트 시간간격 */}
          <div>
            <h3 className="text-sm font-semibold dark:text-slate-200 light:text-slate-800 mb-2">
              기본 차트 시간간격
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {timeframeOptions.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => onPrefsChange({ defaultTimeframe: tf.value })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    prefs.defaultTimeframe === tf.value
                      ? "dark:bg-indigo-600 light:bg-indigo-600 text-white"
                      : "dark:bg-slate-800 light:bg-slate-200 dark:text-slate-300 light:text-slate-700 hover:dark:bg-slate-700 hover:light:bg-slate-300"
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
