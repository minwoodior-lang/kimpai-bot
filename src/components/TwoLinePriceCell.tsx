import React, { useEffect, useRef, useState } from "react";

interface TwoLinePriceCellProps {
  topValue: number | null | undefined;
  bottomValue: number | null | undefined;
  topPrefix?: string;
  bottomPrefix?: string;
  topSuffix?: string;
  bottomSuffix?: string;
  isUnlisted?: boolean;
  formatFn?: (value: number, options?: { signed?: boolean }) => string;
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

  // 동적 소수점 규칙 (김프가와 동일)
  if (abs >= 1000) decimals = 0;
  else if (abs >= 1) decimals = 2;
  else if (abs >= 0.1) decimals = 3;
  else if (abs >= 0.01) decimals = 4;
  else if (abs >= 0.001) decimals = 5;
  else decimals = 6; // 김프가는 최대 소수점 6자리 정도까지 표기

  // 1) 지정된 자리수까지 포맷
  let formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);

  // 2) 끝에 붙은 0 자동 제거
  // 예: 0.010000 → 0.01, 0.00056000 → 0.00056
  formatted = formatted.replace(/\.?0+$/, "");

  let result = formatted;

  // 3) 부호 처리
  if (signed) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    result = `${sign}₩${result}`;
  } else {
    result = `₩${result}`;
  }

  return result;
}

const TwoLinePriceCell: React.FC<TwoLinePriceCellProps> = ({
  topValue,
  bottomValue,
  topPrefix = "",
  bottomPrefix = "",
  topSuffix = "",
  bottomSuffix = "",
  isUnlisted = false,
  formatFn = formatKrwDynamic,
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
      if (topTimerRef.current) {
        clearTimeout(topTimerRef.current);
      }
      setTopFlash(currentTop > prevTop ? "up" : "down");
      topTimerRef.current = setTimeout(() => {
        setTopFlash(null);
      }, 400);
    }

    prevTopRef.current = currentTop;

    return () => {
      if (topTimerRef.current) {
        clearTimeout(topTimerRef.current);
      }
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
      if (bottomTimerRef.current) {
        clearTimeout(bottomTimerRef.current);
      }
      setBottomFlash(currentBottom > prevBottom ? "up" : "down");
      bottomTimerRef.current = setTimeout(() => {
        setBottomFlash(null);
      }, 400);
    }

    prevBottomRef.current = currentBottom;

    return () => {
      if (bottomTimerRef.current) {
        clearTimeout(bottomTimerRef.current);
      }
    };
  }, [bottomValue, isUnlisted]);

  const topFormatted = topValue != null ? formatFn(topValue) : "-";
  const bottomFormatted = bottomValue != null ? formatFn(bottomValue) : "-";

  const getTopClass = () => {
    const base = "text-[13px] md:text-[14px] font-medium whitespace-nowrap";
    if (topValue === null) return `${base} text-gray-500`;
    if (topFlash === "up") return `${base} price-flash-up`;
    if (topFlash === "down") return `${base} price-flash-down`;
    return `${base} text-white`;
  };

  const getBottomClass = () => {
    const base = "text-[10px] md:text-[11px] whitespace-nowrap";
    if (bottomValue === null) return `${base} text-gray-500`;
    if (bottomFlash === "up") return `${base} price-flash-up`;
    if (bottomFlash === "down") return `${base} price-flash-down`;
    return `${base} text-gray-500`;
  };

  return (
    <div className="flex flex-col items-end leading-[1.1]">
      <span className={getTopClass()}>
        {topPrefix}{topFormatted}{topSuffix}
      </span>
      <span className={getBottomClass()}>
        {bottomPrefix}{bottomFormatted}{bottomSuffix}
      </span>
    </div>
  );
};

export default TwoLinePriceCell;
