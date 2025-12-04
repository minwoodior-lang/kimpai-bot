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

const formatKrwPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";

  if (value >= 1000) {
    return Math.round(value).toLocaleString("ko-KR");
  }
  if (value >= 100) {
    return value.toFixed(1);
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
};

const TwoLinePriceCell: React.FC<TwoLinePriceCellProps> = ({
  topValue,
  bottomValue,
  topPrefix = "",
  bottomPrefix = "",
  topSuffix = "",
  bottomSuffix = "",
  isUnlisted = false,
  formatFn = formatKrwPrice,
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

  if (isUnlisted) {
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[13px] md:text-[14px] font-medium text-white whitespace-nowrap">-</span>
        <span className="text-[11px] md:text-[12px] text-gray-500 whitespace-nowrap">-</span>
      </div>
    );
  }

  const topFormatted = topValue != null ? formatFn(topValue) : "-";
  const bottomFormatted = bottomValue != null ? formatFn(bottomValue) : "-";

  const getTopClass = () => {
    const base = "text-[13px] md:text-[14px] font-medium whitespace-nowrap";
    if (topFlash === "up") return `${base} price-flash-up`;
    if (topFlash === "down") return `${base} price-flash-down`;
    return `${base} text-white`;
  };

  const getBottomClass = () => {
    const base = "text-[11px] md:text-[12px] whitespace-nowrap";
    if (bottomFlash === "up") return `${base} price-flash-up`;
    if (bottomFlash === "down") return `${base} price-flash-down`;
    return `${base} text-gray-500`;
  };

  return (
    <div className="flex flex-col items-end leading-tight">
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
