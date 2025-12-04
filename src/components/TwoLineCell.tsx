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
}

export default function TwoLineCell({
  line1,
  line2,
  line1Color = "text-white",
  line2Color = "text-slate-400",
  line1Prefix = "",
  line2Prefix = "",
  line1Suffix = "",
  line2Suffix = "",
  align = "right",
}: TwoLineCellProps) {
  const alignClass = align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right";

  const formatValue = (val: string | number | null): string => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "number" && isNaN(val)) return "-";
    return String(val);
  };

  return (
    <div className={`flex flex-col leading-tight ${alignClass}`}>
      <span className={`text-[11px] md:text-sm ${line1Color}`}>
        {line1Prefix}{formatValue(line1)}{line1Suffix}
      </span>
      <span className={`text-[9px] md:text-xs ${line2Color}`}>
        {line2Prefix}{formatValue(line2)}{line2Suffix}
      </span>
    </div>
  );
}
