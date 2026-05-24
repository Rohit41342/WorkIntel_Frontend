import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "Data will appear here when it becomes available.",
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="max-w-md text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}
