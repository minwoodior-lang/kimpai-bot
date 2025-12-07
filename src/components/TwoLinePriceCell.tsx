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
  // 1 이상 100 미만: 2자리
  if (value >= 1) {
    return value.toFixed(2);
  }
  // 1 미만: 2자리 (이전 4자리에서 2자리로 수정)
  return value.toFixed(2);
};

// 동적 KRW 가격 포맷 (저가 코인도 0.00 으로 안 죽게, 최대 8자리)
export const formatKrwDynamic = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "-";

  const abs = Math.abs(value);
  let fractionDigits = 0;

  if (abs >= 1000) {
    fractionDigits = 0;             // 1,000 이상: 0자리
  } else if (abs >= 1) {
    fractionDigits = 2;             // 1 ~ 1,000 미만: 2자리
  } else if (abs >= 0.1) {
    fractionDigits = 3;             // 0.1 ~ 1 미만: 3자리
  } else if (abs >= 0.01) {
    fractionDigits = 4;             // 0.01 ~ 0.1 미만: 4자리
  } else if (abs >= 0.001) {
    fractionDigits = 5;             // 0.001 ~ 0.01 미만: 5자리
  } else if (abs >= 0.0001) {
    fractionDigits = 6;             // 0.0001 ~ 0.001 미만: 6자리
  } else {
    fractionDigits = 8;             // 0.0001 미만: 8자리 (초저가 코인)
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
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
