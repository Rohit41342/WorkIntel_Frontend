import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Download, FileSpreadsheet, Filter, UsersRound } from "lucide-react";

import api, {
  extractCollection,
  formatDate,
  formatHoursFromMinutes,
  getErrorMessage,
  getMonthStartInputValue,
  toApiDate,
  toDateInputValue,
  toNumber,
} from "../api/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import { FormField, Input } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

function normalizeReportRow(item, index) {
  const minutesSpent =
    item?.minutesSpent ??
    (item?.hoursSpent !== undefined ? Math.round(toNumber(item.hoursSpent) * 60) : 0);

  return {
    id: item?.id || item?.effortId || item?.reportId || `report-${index}`,
    employeeId: item?.employeeId || item?.employee?.id || "",
    employeeName: item?.employee?.fullName || item?.employeeName || item?.fullName || "",
    employeeEmail: item?.employee?.email || item?.employeeEmail || item?.email || "",
    workDate: item?.workDate || item?.date || "",
    effortCategory: item?.effortCategory || "",
    ticketType: item?.ticketType || "",
    ticketNumber: item?.ticketNumber || "",
    effortType: item?.effortType || "",
    status: item?.status || "",
    minutesSpent,
    remarks: item?.remarks || "",
  };
}

function buildOptionKey(item) {
  return item.employeeId || item.employeeEmail || item.employeeName;
}

function normalizeEmployeeOption(item, index) {
  return {
    id: item?.id || `employee-${index}`,
    fullName: item?.fullName || "",
    email: item?.email || "",
  };
}

export default function Reports() {
  const [filters, setFilters] = useState({
    fromDate: getMonthStartInputValue(),
    toDate: toDateInputValue(),
    employeeIds: [],
  });
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const employeeMenuRef = useRef(null);

  const employeeOptions = useMemo(() => {
    const optionMap = new Map();
    employees.forEach((employee) => {
      const key = employee.id || employee.email;

      if (!key || optionMap.has(key)) {
        return;
      }

      optionMap.set(key, {
        value: employee.id || "",
        label: [employee.fullName, employee.email].filter(Boolean).join(" - ") || employee.email || "Employee",
      });
    });

    rows.forEach((row) => {
      const key = buildOptionKey(row);

      if (!key || optionMap.has(key)) {
        return;
      }

      optionMap.set(key, {
        value: row.employeeId || "",
        label:
          [row.employeeName, row.employeeEmail].filter(Boolean).join(" - ") ||
          row.employeeId ||
          row.employeeEmail ||
          "Employee",
      });
    });

    return Array.from(optionMap.values());
  }, [employees, rows]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employeeMenuRef.current && !employeeMenuRef.current.contains(event.target)) {
        setEmployeeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateField = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleEmployeeSelection = (employeeId) => {
    setFilters((current) => ({
      ...current,
      employeeIds: current.employeeIds.includes(employeeId)
        ? current.employeeIds.filter((item) => item !== employeeId)
        : [...current.employeeIds, employeeId],
    }));
  };

  const buildPayload = useCallback(
    () => ({
      fromDate: filters.fromDate ? toApiDate(filters.fromDate) : null,
      toDate: filters.toDate ? toApiDate(filters.toDate) : null,
      employeeIds: filters.employeeIds.length ? filters.employeeIds : null,
      name: null,
      email: null,
    }),
    [filters]
  );

  const loadReport = useCallback(
    async (isSilent = false) => {
      if (!isSilent) {
        setLoading(true);
      }

      try {
        const response = await api.post("/Report", buildPayload());
        setRows(extractCollection(response).map(normalizeReportRow));
        setErrorMessage("");
      } catch (error) {
        const message = getErrorMessage(error, "Unable to load report.");
        setErrorMessage(message);
        if (!isSilent) {
          toast.error(message);
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    },
    [buildPayload]
  );

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await api.get("/Employee/list");
        setEmployees(extractCollection(response).map(normalizeEmployeeOption));
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load employee list."));
      }
    };

    loadEmployees();
  }, []);

  const selectedEmployeeLabels = useMemo(() => {
    if (!filters.employeeIds.length) {
      return "All Employees";
    }

    return employeeOptions
      .filter((option) => filters.employeeIds.includes(option.value))
      .map((option) => option.label)
      .join(", ");
  }, [employeeOptions, filters.employeeIds]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadReport();
  };

  const exportExcel = async () => {
    setExporting(true);

    try {
      const response = await api.post("/ReportExport/excel", buildPayload(), {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const disposition = response.headers["content-disposition"] || "";
      const matchedName = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = matchedName?.[1] || "report.xlsx";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel exported.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to export Excel."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Filter report data with a cleaner card layout, multi-select picker, and export action that still calls the same APIs."
      />

      <Card className="p-6 sm:p-7">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Report filters</h2>
              <p className="text-sm text-slate-400">Date range and employee selectors, without touching request shape.</p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
            <FormField label="From Date" htmlFor="report-from-date">
              <Input
                id="report-from-date"
                type="date"
                value={filters.fromDate}
                onChange={(event) => updateField("fromDate", event.target.value)}
              />
            </FormField>

            <FormField label="To Date" htmlFor="report-to-date">
              <Input
                id="report-to-date"
                type="date"
                value={filters.toDate}
                onChange={(event) => updateField("toDate", event.target.value)}
              />
            </FormField>

            <FormField label="Employees" htmlFor="report-employee">
              <div ref={employeeMenuRef} className="relative">
                <button
                  id="report-employee"
                  type="button"
                  className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-100 transition hover:border-white/20"
                  onClick={() => setEmployeeMenuOpen((current) => !current)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UsersRound className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{selectedEmployeeLabels}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${employeeMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {employeeMenuOpen ? (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-card backdrop-blur-xl">
                    {employeeOptions.length === 0 ? (
                      <div className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-slate-400">No employees found.</div>
                    ) : (
                      <div className="space-y-2">
                        {employeeOptions.map((option) => (
                          <label
                            key={option.value || option.label}
                            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm text-slate-200 transition hover:border-white/10 hover:bg-white/[0.04]"
                          >
                            <input
                              type="checkbox"
                              checked={filters.employeeIds.includes(option.value)}
                              onChange={() => toggleEmployeeSelection(option.value)}
                              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-brand-500 focus:ring-brand-400"
                            />
                            <span className="leading-6">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={loading}>
              {loading ? "Loading..." : "Load Report"}
            </Button>
            <Button type="button" variant="secondary" icon={Download} loading={exporting} onClick={exportExcel}>
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        title="Report output"
        description="Searchable, paginated table with the same backend-driven rows."
        loading={loading}
        rows={rows}
        searchPlaceholder="Search employee, ticket, remarks, category, or status"
        searchAccessor={(row) =>
          [
            row.employeeName,
            row.employeeEmail,
            row.workDate,
            row.effortCategory,
            row.ticketType,
            row.ticketNumber,
            row.effortType,
            row.status,
            row.remarks,
          ]
            .filter(Boolean)
            .join(" ")
        }
        emptyIcon={FileSpreadsheet}
        emptyTitle="No report data found"
        emptyDescription="Try widening the date range or selecting different employees."
        columns={[
          { key: "date", header: "Date" },
          { key: "employee", header: "Employee" },
          { key: "category", header: "Category" },
          { key: "type", header: "Type" },
          { key: "target", header: "Ticket / Effort" },
          { key: "hours", header: "Hours" },
          { key: "status", header: "Status" },
          { key: "remarks", header: "Remarks" },
        ]}
        renderRow={(row, _index, tableState) => (
          <tr key={row.id} className={tableState.rowClassName}>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(row.workDate)}</td>
            <td className="border-b border-white/5 px-4 py-4">
              <div className="text-sm font-medium text-white">{row.employeeName || "-"}</div>
              <div className="mt-1 text-xs text-slate-400">{row.employeeEmail || row.employeeId || "-"}</div>
            </td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{row.effortCategory || "-"}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{row.ticketType || row.effortType || "-"}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-100">{row.ticketNumber || row.effortType || "-"}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatHoursFromMinutes(row.minutesSpent)}</td>
            <td className="border-b border-white/5 px-4 py-4">
              <StatusBadge
                value={row.status || "-"}
                tone={
                  row.status?.toLowerCase() === "resolved"
                    ? "success"
                    : row.status?.toLowerCase() === "pending"
                      ? "pending"
                      : row.status?.toLowerCase() === "cancelled"
                        ? "danger"
                        : "neutral"
                }
              />
            </td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{row.remarks || "-"}</td>
          </tr>
        )}
      />
    </section>
  );
}
