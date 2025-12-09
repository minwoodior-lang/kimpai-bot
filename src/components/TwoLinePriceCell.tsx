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

  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  let decimals = 0;

  if (abs >= 1000) {
    decimals = 0;
  } else if (abs >= 1) {
    decimals = 2;
  } else if (abs >= 0.1) {
    decimals = 3;
  } else if (abs >= 0.01) {
    decimals = 4;
  } else if (abs >= 0.001) {
    decimals = 5;
  } else {
    decimals = 6;
  }

  const formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);

  if (signed) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}₩${formatted}`;
  }
  return `₩${formatted}`;
}

export function formatKrwDomestic(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  const abs = Math.abs(value);

  if (abs >= 1000) {
    return (
      "₩" +
      new Intl.NumberFormat("ko-KR", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(value)
    );
  }

  return formatKrwDynamic(value, { signed: false });
}

export function formatKrwDiffByBase(
  diff: number | null | undefined,
  base: number | null | undefined
): string {
  if (
    diff === null ||
    diff === undefined ||
    Number.isNaN(diff) ||
    base === null ||
    base === undefined ||
    Number.isNaN(base)
  ) {
    return "-";
  }

  const absBase = Math.abs(base);
  let decimals = 0;

  if (absBase >= 1000) decimals = 0;
  else if (absBase >= 1) decimals = 2;
  else if (absBase >= 0.1) decimals = 3;
  else if (absBase >= 0.01) decimals = 4;
  else if (absBase >= 0.001) decimals = 5;
  else decimals = 6;

  const absDiff = Math.abs(diff);
  const formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absDiff);

  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  return `${sign}₩${formatted}`;
}

const TwoLinePriceCell: React.FC<TwoLinePriceCellProps> = ({
  topValue,
  bottomValue,
  topPrefix = "",
  bottomPrefix = "",
  topSuffix = "",
  bottomSuffix = "",
  isUnlisted = false,
  formatTop = formatKrwDynamic,
  formatBottom = formatKrwDynamic,
}) => {
  const [topFlash, setTopFlash] = useState<FlashState>(null);
  const [bottomFlash, setBottomFlash] = useState<FlashState>(null);

  const prevTopRef = useRef<number | null>(null);
  const prevBottomRef = useRef<number | null>(null);

  const topTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bottomTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isUnlisted) {
      prevTopRef.current = null;
      return;
    }

    const currentTop = topValue ?? 0;
    const prevTop = prevTopRef.current;

    if (prevTop !== null && currentTop !== prevTop) {
      if (topTimerRef.current) clearTimeout(topTimerRef.current);
      setTopFlash(currentTop > prevTop ? "up" : "down");
      topTimerRef.current = setTimeout(() => setTopFlash(null), 400);
    }

    prevTopRef.current = currentTop;

    return () => {
      if (topTimerRef.current) clearTimeout(topTimerRef.current);
    };
  }, [topValue, isUnlisted]);

  useEffect(() => {
    if (isUnlisted) {
      prevBottomRef.current = null;
      return;
    }

    const currentBottom = bottomValue ?? 0;
    const prevBottom = prevBottomRef.current;

    if (prevBottom !== null && currentBottom !== prevBottom) {
      if (bottomTimerRef.current) clearTimeout(bottomTimerRef.current);
      setBottomFlash(currentBottom > prevBottom ? "up" : "down");
      bottomTimerRef.current = setTimeout(() => setBottomFlash(null), 400);
    }

    prevBottomRef.current = currentBottom;

    return () => {
      if (bottomTimerRef.current) clearTimeout(bottomTimerRef.current);
    };
  }, [bottomValue, isUnlisted]);

  const topFormatted = topValue != null ? formatTop(topValue) : "-";
  const bottomFormatted = bottomValue != null ? formatBottom(bottomValue) : "-";

  const getTopClass = () => {
    const base =
      "block text-right whitespace-nowrap tabular-nums min-w-[80px] md:min-w-[92px] text-[11px] md:text-[14px] font-medium";
    if (topValue === null) return `${base} text-gray-500`;
    if (topFlash === "up") return `${base} price-flash-up`;
    if (topFlash === "down") return `${base} price-flash-down`;
    return `${base} text-white`;
  };

  const getBottomClass = () => {
    const base =
      "block text-right whitespace-nowrap tabular-nums min-w-[80px] md:min-w-[92px] text-[9px] md:text-[11px]";
    if (bottomValue === null) return `${base} text-gray-500`;
    if (bottomFlash === "up") return `${base} price-flash-up`;
    if (bottomFlash === "down") return `${base} price-flash-down`;
    return `${base} text-gray-500`;
  };

  return (
    <div className="flex flex-col items-end leading-[1.1]">
      <span className={getTopClass()}>
        {topPrefix}
        {topFormatted}
        {topSuffix}
      </span>
      <span className={getBottomClass()}>
        {bottomPrefix}
        {bottomFormatted}
        {bottomSuffix}
      </span>
    </div>
  );
};

export default TwoLinePriceCell;
