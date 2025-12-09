import React from "react";

interface TwoLineCellProps {
  line1: string | number | null;
  line2: string | number | null;
  line1Color?: string;
  line2Color?: string;
  line1Prefix?: string;
  line2Prefix?: string;
  line1Suffix?: string;
  line2Suffix?: string;
  align?: "left" | "center" | "right";
  isUnlisted?: boolean;
}

export default function TwoLineCell({
  line1,
  line2,
  line1Color = "text-slate-100",
  line2Color = "text-gray-500",
  line1Prefix = "",
  line2Prefix = "",
  line1Suffix = "",
  line2Suffix = "",
  align = "right",
  isUnlisted = false,
}: TwoLineCellProps) {
  const alignClass =
    align === "left"
      ? "items-start"
      : align === "center"
      ? "items-center"
      : "items-end";

  const formatValue = (val: string | number | null): string => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "number" && isNaN(val)) return "-";
    return String(val);
  };

  const topColor = isUnlisted ? "text-gray-500" : line1Color;

  // 모바일에서 숫자/폭 축소, md 이상은 기존 유지
  const topBaseClass =
    "block text-right whitespace-nowrap tabular-nums " +
    "min-w-[70px] md:min-w-[128px] " +
    "text-[10px] md:text-[14px] font-medium";

  const bottomBaseClass =
    "block text-right whitespace-nowrap tabular-nums " +
    "min-w-[70px] md:min-w-[128px] " +
    "text-[8px] md:text-[11px]";

  if (isUnlisted) {
    return (
      <div className={`flex flex-col leading-[1.1] ${alignClass}`}>
        <span className={`${topBaseClass} ${topColor}`}>-</span>
        <span className={`${bottomBaseClass} ${line2Color}`}>-</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col leading-[1.1] ${alignClass}`}>
      <span className={`${topBaseClass} ${topColor}`}>
        {line1Prefix}
        {formatValue(line1)}
        {line1Suffix}
      </span>
      <span className={`${bottomBaseClass} ${line2Color}`}>
        {line2Prefix}
        {formatValue(line2)}
        {line2Suffix}
      </span>
    </div>
  );
}
