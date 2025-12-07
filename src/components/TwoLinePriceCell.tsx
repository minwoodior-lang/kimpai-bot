import React, { useEffect, useRef, useState } from "react";

interface TwoLinePriceCellProps {
  topValue: number | null | undefined;
  bottomValue: number | null | undefined;
  topPrefix?: string;
  bottomPrefix?: string;
  topSuffix?: string;
  bottomSuffix?: string;
  isUnlisted?: boolean;
  formatFn?: (value: number) => string;
}

type FlashState = "up" | "down" | null;

const formatKrwDynamic = (value: number | null | undefined): string => {
  // 0 또는 null일 때 "-"로 표시
  if (value === null || value === undefined || isNaN(value) || value === 0) return "-";

  const absValue = Math.abs(value);
  
  // 값이 작을수록 자리수를 늘려서 표시
  if (absValue >= 1000) {
    return Math.round(value).toLocaleString("ko-KR");
  }
  if (absValue >= 1) {
    return value.toFixed(2);
  }
  if (absValue >= 0.1) {
    return value.toFixed(3);
  }
  if (absValue >= 0.01) {
    return value.toFixed(4);
  }
  if (absValue >= 0.001) {
    return value.toFixed(5);
  }
  if (absValue >= 0.0001) {
    return value.toFixed(6);
  }
  // 그 미만: 소수 8자리
  return value.toFixed(8);
};

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
