import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Card from "./Card";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import { FormField, Input } from "./FormField";
import Button from "./Button";

export default function DataTable({
  title,
  description,
  columns,
  rows,
  renderRow,
  loading = false,
  searchPlaceholder = "Search",
  searchAccessor,
  pageSize = 8,
  rightAction,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return rows;
    }

    const needle = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      if (searchAccessor) {
        return searchAccessor(row).toLowerCase().includes(needle);
      }

      return JSON.stringify(row).toLowerCase().includes(needle);
    });
  }, [rows, searchAccessor, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          {title ? <h2 className="text-xl font-semibold text-white">{title}</h2> : null}
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
          <div className="min-w-[240px]">
            <FormField>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-11"
                />
              </div>
            </FormField>
          </div>
          {rightAction}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={Math.max(columns.length, 3)} />
      ) : pageRows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50">
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`border-b border-white/10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-slate-400 ${column.className || ""}`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) =>
                    renderRow(row, index, {
                      rowClassName:
                        index % 2 === 0
                          ? "bg-white/[0.02] hover:bg-white/[0.05]"
                          : "bg-transparent hover:bg-white/[0.05]",
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, filteredRows.length)} of{" "}
              {filteredRows.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={activePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} icon={ChevronLeft}>
                Prev
              </Button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                Page {activePage} / {totalPages}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={activePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                icon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
