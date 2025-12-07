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
  let decimals = 0;

  // 🔹 김프가 스타일 소수점 규칙 (저가 코인 강조)
  if (abs >= 1000) {
    // 1,000원 이상 → 정수
    decimals = 0;
  } else if (abs >= 1) {
    // 1원 ~ 1,000원 → 소수 2자리
    decimals = 2;
  } else if (abs >= 0.1) {
    // 0.1 ~ 1 → 소수 3자리
    decimals = 3;
  } else if (abs >= 0.01) {
    // 0.01 ~ 0.1 → 소수 4자리
    decimals = 4;
  } else if (abs >= 0.001) {
    // 0.001 ~ 0.01 → 소수 5자리
    decimals = 5;
  } else {
    // 0.001 미만 → 소수 6자리
    decimals = 6;
  }

  // 기본 포맷 (천단위 콤마 + 소수 자릿수)
  let formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);

  // 끝 0 제거: 0.010000 → 0.01, 42.000000 → 42
  formatted = formatted.replace(/\.?0+$/, "");

  // 부호 적용
  if (signed) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}₩${formatted}`;
  }
  return `₩${formatted}`;
}

export function formatKrwDomestic(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  const abs = Math.abs(value);

  // 1,000원 이상: 정수만 (김프가 스타일)
  if (abs >= 1000) {
    return "₩" + new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value);
  }

  // 1,000원 미만: 기존 동적 규칙 사용 (소수점)
  return formatKrwDynamic(value, { signed: false });
}

// ✨ 새로운 포맷 유틸: 차액을 기준값 자리수에 맞춰 포맷
// 용도: 김프 금액, 전일대비 금액 등
// 효과: 현재가와 동일한 자리수로 차액을 표시
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

  // 기준값(base)의 자리수에 따라 소수점 결정
  if (absBase >= 1000) decimals = 0;
  else if (absBase >= 1) decimals = 2;
  else if (absBase >= 0.1) decimals = 3;
  else if (absBase >= 0.01) decimals = 4;
  else if (absBase >= 0.001) decimals = 5;
  else decimals = 6;

  // 차액의 절댓값을 포맷
  const absDiff = Math.abs(diff);
  let formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absDiff);

  // 끝 0 제거: 0.010000 → 0.01, 42.000000 → 42
  formatted = formatted.replace(/\.?0+$/, "");

  // 부호 적용
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

  const topFormatted = topValue != null ? formatTop(topValue) : "-";
  const bottomFormatted = bottomValue != null ? formatBottom(bottomValue) : "-";

  const getTopClass = () => {
    const base = "block text-right whitespace-nowrap tabular-nums min-w-[92px] text-[13px] md:text-[14px] font-medium";
    if (topValue === null) return `${base} text-gray-500`;
    if (topFlash === "up") return `${base} price-flash-up`;
    if (topFlash === "down") return `${base} price-flash-down`;
    return `${base} text-white`;
  };

  const getBottomClass = () => {
    const base = "block text-right whitespace-nowrap tabular-nums min-w-[92px] text-[10px] md:text-[11px]";
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
