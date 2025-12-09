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

  // ✅ 모바일: min-w 60px, SE(≤375px)에서 52px까지, md 이상: 128px 유지
  const topBaseClass =
    "block text-right whitespace-nowrap tabular-nums " +
    "min-w-[60px] md:min-w-[128px] max-[375px]:min-w-[52px] " +
    "text-[10px] md:text-[14px] max-[375px]:text-[9px] font-medium";

  const bottomBaseClass =
    "block text-right whitespace-nowrap tabular-nums " +
    "min-w-[60px] md:min-w-[128px] max-[375px]:min-w-[52px] " +
    "text-[8px] md:text-[11px] max-[375px]:text-[7px]";

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
