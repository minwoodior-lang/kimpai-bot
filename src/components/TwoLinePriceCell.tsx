import React, { useEffect, useRef, useState } from "react";

interface TwoLinePriceCellProps {
  topValue: number | null | undefined;
  bottomValue: number | null | undefined;
  topPrefix?: string;
  bottomPrefix?: string;
  topSuffix?: string;
  bottomSuffix?: string;
  isUnlisted?: boolean;
  formatTop?: (value: number, options?: { signed?: boolean }) => string;
  formatBottom?: (value: number, options?: { signed?: boolean }) => string;
}

type FlashState = "up" | "down" | null;

export function formatKrwDynamic(
  value: number | null | undefined,
  options: { signed?: boolean } = {}
): string {
  const { signed = false } = options;

  // 값이 없으면 "-"
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  let decimals =
    abs >= 10000000
      ? 0
      : abs >= 1000000
      ? 0
      : abs >= 100000
      ? 0
      : abs >= 10000
      ? 0
      : abs >= 1000
      ? 0
      : abs >= 100
      ? 1
      : abs >= 10
      ? 2
      : abs >= 1
      ? 2
      : abs >= 0.1
      ? 3
      : abs >= 0.01
      ? 4
      : 5;

  let formatted = value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (signed && value > 0) {
    formatted = `+${formatted}`;
  }

  return formatted;
}

export function formatPercentDynamic(
  value: number | null | undefined,
  options: { signed?: boolean } = {}
): string {
  const { signed = false } = options;

  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  const decimals =
    abs >= 1000
      ? 0
      : abs >= 100
      ? 1
      : abs >= 10
      ? 2
      : abs >= 1
      ? 2
      : abs >= 0.1
      ? 3
      : 4;

  let formatted = value.toFixed(decimals);

  if (signed && value > 0) {
    formatted = `+${formatted}`;
  }

  return `${formatted}%`;
}

export default function TwoLinePriceCell({
  topValue,
  bottomValue,
  topPrefix,
  bottomPrefix,
  topSuffix,
  bottomSuffix,
  isUnlisted = false,
  formatTop = formatKrwDynamic,
  formatBottom = formatKrwDynamic,
}: TwoLinePriceCellProps) {
  const [topFlash, setTopFlash] = useState<FlashState>(null);
  const [bottomFlash, setBottomFlash] = useState<FlashState>(null);
  const prevTopValueRef = useRef<number | null | undefined>(null);
  const prevBottomValueRef = useRef<number | null | undefined>(null);

  useEffect(() => {
    if (
      topValue !== null &&
      topValue !== undefined &&
      prevTopValueRef.current !== null &&
      prevTopValueRef.current !== undefined &&
      topValue !== prevTopValueRef.current
    ) {
      setTopFlash(topValue > prevTopValueRef.current ? "up" : "down");
      const timer = setTimeout(() => setTopFlash(null), 600);
      return () => clearTimeout(timer);
    }
    prevTopValueRef.current = topValue ?? null;
  }, [topValue]);

  useEffect(() => {
    if (
      bottomValue !== null &&
      bottomValue !== undefined &&
      prevBottomValueRef.current !== null &&
      prevBottomValueRef.current !== undefined &&
      bottomValue !== prevBottomValueRef.current
    ) {
      setBottomFlash(bottomValue > prevBottomValueRef.current ? "up" : "down");
      const timer = setTimeout(() => setBottomFlash(null), 600);
      return () => clearTimeout(timer);
    }
    prevBottomValueRef.current = bottomValue ?? null;
  }, [bottomValue]);

  const formatTopValue = () =>
    topValue !== null && topValue !== undefined
      ? formatTop(topValue)
      : isUnlisted
      ? "미상장"
      : "-";

  const formatBottomValue = () =>
    bottomValue !== null && bottomValue !== undefined
      ? formatBottom(bottomValue)
      : "-";

  const getTopClass = () => {
    const base =
      "block text-right whitespace-nowrap tabular-nums min-w-[72px] md:min-w-[92px] text-[12px] md:text-[14px] font-medium";
    if (topValue === null) return `${base} text-gray-500`;
    if (topFlash === "up") return `${base} price-flash-up`;
    if (topFlash === "down") return `${base} price-flash-down`;
    return `${base} text-slate-50`;
  };

  const getBottomClass = () => {
    const base =
      "block text-right whitespace-nowrap tabular-nums min-w-[72px] md:min-w-[92px] text-[10px] md:text-[11px]";
    if (bottomValue === null) return `${base} text-gray-500`;
    if (bottomFlash === "up") return `${base} price-flash-up`;
    if (bottomFlash === "down") return `${base} price-flash-down`;
    return `${base} text-slate-400`;
  };

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className={getTopClass()}>
        {topPrefix}
        {formatTopValue()}
        {topSuffix}
      </span>
      <span className={getBottomClass()}>
        {bottomPrefix}
        {formatBottomValue()}
        {bottomSuffix}
      </span>
    </div>
  );
}
