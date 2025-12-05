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
  const alignClass = align === "left" 
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

  if (isUnlisted) {
    return (
      <div className={`flex flex-col leading-[1.1] ${alignClass}`}>
        <span className={`text-[13px] md:text-[14px] font-medium whitespace-nowrap ${topColor}`}>-</span>
        <span className={`text-[10px] md:text-[11px] whitespace-nowrap ${line2Color}`}>-</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col leading-[1.1] ${alignClass}`}>
      <span className={`text-[13px] md:text-[14px] font-medium whitespace-nowrap ${topColor}`}>
        {line1Prefix}{formatValue(line1)}{line1Suffix}
      </span>
      <span className={`text-[10px] md:text-[11px] whitespace-nowrap ${line2Color}`}>
        {line2Prefix}{formatValue(line2)}{line2Suffix}
      </span>
    </div>
  );
}
