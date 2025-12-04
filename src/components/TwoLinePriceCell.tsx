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
  const prevSumRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isUnlisted) {
      prevSumRef.current = null;
      return;
    }

    const currentSum = (topValue ?? 0) + (bottomValue ?? 0);
    const prevSum = prevSumRef.current;

    let newTrend: Trend = null;

    if (prevSum !== null && currentSum !== prevSum) {
      if (currentSum > prevSum) {
        newTrend = "up";
      } else if (currentSum < prevSum) {
        newTrend = "down";
      }
    }

    prevSumRef.current = currentSum;

    if (newTrend) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setTrend(newTrend);
      timerRef.current = setTimeout(() => {
        setTrend(null);
      }, 400);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [topValue, bottomValue, isUnlisted]);

  const flashClass =
    trend === "up"
      ? "price-flash-up"
      : trend === "down"
      ? "price-flash-down"
      : "";

  if (isUnlisted) {
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[13px] font-medium text-white whitespace-nowrap">-</span>
        <span className="text-[11px] text-gray-500 whitespace-nowrap">-</span>
      </div>
    );
  }

  const topFormatted = topValue != null ? formatFn(topValue) : "-";
  const bottomFormatted = bottomValue != null ? formatFn(bottomValue) : "-";

  return (
    <div className={`flex flex-col items-end leading-tight ${flashClass}`}>
      <span className="text-[13px] font-medium text-white whitespace-nowrap">
        {topPrefix}{topFormatted}{topSuffix}
      </span>
      <span className="text-[11px] text-gray-500 whitespace-nowrap">
        {bottomPrefix}{bottomFormatted}{bottomSuffix}
      </span>
    </div>
  );
};

export default TwoLinePriceCell;
