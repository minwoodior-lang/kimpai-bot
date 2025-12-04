import React, { useEffect, useRef, useState } from "react";

interface PriceCellProps {
  price: number | null | undefined;
  className?: string;
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

const PriceCell: React.FC<PriceCellProps> = ({ price, className = "" }) => {
  const [trend, setTrend] = useState<Trend>(null);
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (price == null) return;

    const prev = prevPriceRef.current;
    if (prev != null) {
      if (price > prev) setTrend("up");
      else if (price < prev) setTrend("down");
    }

    prevPriceRef.current = price;

    if (trend) {
      const timer = setTimeout(() => setTrend(null), 500);
      return () => clearTimeout(timer);
    }
  }, [price]);

  const formatted = formatKrwPrice(price);

  const flashClass =
    trend === "up"
      ? "price-flash-up"
      : trend === "down"
      ? "price-flash-down"
      : "";

  return (
    <span className={`whitespace-nowrap ${flashClass} ${className}`}>
      {formatted}
    </span>
  );
};

export default PriceCell;
