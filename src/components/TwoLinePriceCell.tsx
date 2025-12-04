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

type Trend = "up" | "down" | null;

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
  const [trend, setTrend] = useState<Trend>(null);
  const prevTopRef = useRef<number | null>(null);
  const prevBottomRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prevTop = prevTopRef.current;
    const prevBottom = prevBottomRef.current;

    let newTrend: Trend = null;

    if (topValue != null && prevTop != null) {
      if (topValue > prevTop) newTrend = "up";
      else if (topValue < prevTop) newTrend = "down";
    }

    if (!newTrend && bottomValue != null && prevBottom != null) {
      if (bottomValue > prevBottom) newTrend = "up";
      else if (bottomValue < prevBottom) newTrend = "down";
    }

    prevTopRef.current = topValue ?? null;
    prevBottomRef.current = bottomValue ?? null;

    if (newTrend) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setTrend(newTrend);
      timerRef.current = setTimeout(() => {
        setTrend(null);
      }, 500);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [topValue, bottomValue]);

  const flashClass =
    trend === "up"
      ? "price-flash-up"
      : trend === "down"
      ? "price-flash-down"
      : "";

  const topFormatted = topValue != null ? formatFn(topValue) : "-";
  const bottomFormatted = isUnlisted ? "-" : (bottomValue != null ? formatFn(bottomValue) : "-");

  return (
    <div className={`flex flex-col items-end leading-tight ${flashClass}`}>
      <span className="text-sm font-medium text-white whitespace-nowrap">
        {topPrefix}{topFormatted}{topSuffix}
      </span>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {isUnlisted ? "-" : `${bottomPrefix}${bottomFormatted}${bottomSuffix}`}
      </span>
    </div>
  );
};

export default TwoLinePriceCell;
