import React from "react";
import clsx from "clsx";

const toneClasses = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  neutral: "border-white/10 bg-white/5 text-slate-300",
};

export default function StatusBadge({ value, tone = "neutral" }) {
  return (
    <span
      className={clsx(
        "inline-flex min-h-[30px] items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        toneClasses[tone] || toneClasses.neutral
      )}
    >
      {value}
    </span>
  );
}
