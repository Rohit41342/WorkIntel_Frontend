import React from "react";
import clsx from "clsx";

export function Skeleton({ className }) {
  return <div className={clsx("animate-pulse rounded-2xl bg-white/10", className)} />;
}

export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`skeleton-row-${rowIndex}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton key={`skeleton-cell-${rowIndex}-${columnIndex}`} className="h-12" />
          ))}
        </div>
      ))}
    </div>
  );
}
