import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck2, Check, Mail, ShieldAlert, X } from "lucide-react";

import api, {
  canApproveLeave,
  emitDataChanged,
  extractApiData,
  extractCollection,
  formatDate,
  getErrorMessage,
  getStoredRole,
  toApiDate,
  toDateInputValue,
} from "../api/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DataTable from "../components/ui/DataTable";
import { FormField, Input, Textarea } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

function normalizeLeave(item, index) {
  return {
    id: item?.id || `leave-${index}`,
    employeeId: item?.employeeId || "",
    employeeName: item?.employee?.fullName || item?.employeeName || item?.fullName || "",
    employeeEmail: item?.employee?.email || item?.employeeEmail || item?.email || "",
    fromDate: item?.fromDate || "",
    toDate: item?.toDate || "",
    reason: item?.reason || "",
    isApproved: Boolean(item?.isApproved),
    status: item?.status || (item?.isApproved ? "Approved" : "Pending"),
  };
}

function datesOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return (
    new Date(leftStart).getTime() <= new Date(rightEnd).getTime() &&
    new Date(rightStart).getTime() <= new Date(leftEnd).getTime()
  );
}

function buildInitialForm() {
  return {
    fromDate: toDateInputValue(),
    toDate: toDateInputValue(),
    reason: "",
  };
}

function createGuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `leave-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitials(name = "", email = "") {
  const source = name || email || "U";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Leave() {
  const role = getStoredRole();
  const canApprove = canApproveLeave(role);
  const [form, setForm] = useState(buildInitialForm());
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workingLeaveAction, setWorkingLeaveAction] = useState({ id: "", type: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [listWarning, setListWarning] = useState("");

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setListWarning("");

    try {
      if (!canApprove) {
        const response = await api.get("/Leave/my");
        setLeaves(extractCollection(response).map(normalizeLeave));
        return;
      }

      const response = await api.get("/Leave");
      setLeaves(extractCollection(response).map(normalizeLeave));
    } catch (error) {
      if (!canApprove && (error?.response?.status === 403 || error?.response?.status === 404)) {
        setLeaves([]);
        setErrorMessage("");
        setListWarning("Unable to load your leave history right now.");
        return;
      }

      const message = getErrorMessage(error, "Unable to load leave data.");
      setErrorMessage(message);
      setListWarning("");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [canApprove]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const hasOverlap = useMemo(
    () => leaves.some((leave) => datesOverlap(form.fromDate, form.toDate, leave.fromDate, leave.toDate)),
    [leaves, form.fromDate, form.toDate]
  );

  const handleApply = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.fromDate || !form.toDate || !form.reason.trim()) {
      const message = "Please complete the leave form.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (new Date(form.toDate).getTime() < new Date(form.fromDate).getTime()) {
      const message = "To date must be on or after from date.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (hasOverlap) {
      const message = "Leave already exists for the selected dates.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/Leave/apply", {
        fromDate: toApiDate(form.fromDate),
        toDate: toApiDate(form.toDate),
        reason: form.reason.trim(),
      });
      const createdLeave = extractApiData(response);
      const fallbackLeave = {
        id: createdLeave?.id || createGuid(),
        fromDate: toApiDate(form.fromDate),
        toDate: toApiDate(form.toDate),
        reason: form.reason.trim(),
        isApproved: false,
        status: "Pending",
      };

      setLeaves((current) => [normalizeLeave(createdLeave || fallbackLeave, current.length), ...current]);

      emitDataChanged("apply-leave");
      toast.success("Leave applied successfully.");
      setForm(buildInitialForm());
      await loadLeaves();
    } catch (error) {
      const message = getErrorMessage(error, "Unable to apply leave.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (leave) => {
    setWorkingLeaveAction({ id: leave.id, type: "approve" });

    try {
      await api.post(`/Leave/approve/${leave.id}`);
      emitDataChanged("approve-leave");
      toast.success("Leave approved successfully.");
      await loadLeaves();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to approve leave."));
    } finally {
      setWorkingLeaveAction({ id: "", type: "" });
    }
  };

  const handleReject = async (leave) => {
    setWorkingLeaveAction({ id: leave.id, type: "reject" });

    try {
      await api.post(`/Leave/reject/${leave.id}`);
      emitDataChanged("reject-leave");
      toast.success("Leave rejected successfully.");
      await loadLeaves();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to reject leave."));
    } finally {
      setWorkingLeaveAction({ id: "", type: "" });
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow={canApprove ? "Approvals" : "Time off"}
        title={canApprove ? "Leave approval queue" : "Apply leave"}
        subtitle={
          canApprove
            ? "Review pending leave requests with clearer identity, status, and actions."
            : "Submit leave requests and track the latest decision state from the backend."
        }
      />

      {!canApprove ? (
        <Card className="p-6 sm:p-7">
          <form className="space-y-5" onSubmit={handleApply}>
            {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}
            {listWarning ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{listWarning}</div> : null}
            {hasOverlap ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Leave already exists for the selected dates.</div> : null}

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
                    <CalendarCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Leave window</h2>
                    <p className="text-sm text-slate-400">Choose the exact dates for your absence.</p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="From Date" htmlFor="leave-from-date">
                    <Input
                      id="leave-from-date"
                      type="date"
                      value={form.fromDate}
                      onChange={(event) => setForm((current) => ({ ...current, fromDate: event.target.value }))}
                    />
                  </FormField>

                  <FormField label="To Date" htmlFor="leave-to-date">
                    <Input
                      id="leave-to-date"
                      type="date"
                      value={form.toDate}
                      onChange={(event) => setForm((current) => ({ ...current, toDate: event.target.value }))}
                    />
                  </FormField>
                </div>
              </div>

              <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-200">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Reason</h2>
                    <p className="text-sm text-slate-400">Give approvers the context they need.</p>
                  </div>
                </div>

                <FormField label="Leave Reason" htmlFor="leave-reason">
                  <Textarea
                    id="leave-reason"
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Add leave reason"
                  />
                </FormField>
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} disabled={hasOverlap}>
              {isSubmitting ? "Submitting..." : "Apply Leave"}
            </Button>
          </form>
        </Card>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>
      ) : null}

      <DataTable
        title={canApprove ? "Leave requests" : "Your leave records"}
        description={
          canApprove
            ? "Approve and reject actions stay wired to the same backend endpoints."
            : "Everything here comes from the same leave APIs, now in a cleaner review surface."
        }
        loading={loading}
        rows={leaves}
        searchPlaceholder={canApprove ? "Search by employee, email, reason, or status" : "Search by reason or status"}
        searchAccessor={(row) =>
          [row.employeeName, row.employeeEmail, row.reason, row.status, row.fromDate, row.toDate].filter(Boolean).join(" ")
        }
        emptyIcon={CalendarCheck2}
        emptyTitle="No leave requests found"
        emptyDescription={
          canApprove ? "New employee leave requests will appear here." : "Apply a leave request and it’ll show up here."
        }
        columns={[
          ...(canApprove ? [{ key: "employee", header: "Employee" }] : []),
          { key: "from", header: "From Date" },
          { key: "to", header: "To Date" },
          { key: "reason", header: "Reason" },
          { key: "status", header: "Status" },
          ...(canApprove ? [{ key: "action", header: "Action", className: "w-[250px]" }] : []),
        ]}
        renderRow={(leave, _index, tableState) => {
          const isApproving = workingLeaveAction.id === leave.id && workingLeaveAction.type === "approve";
          const isRejecting = workingLeaveAction.id === leave.id && workingLeaveAction.type === "reject";
          const normalizedStatus = String(leave.status || (leave.isApproved ? "Approved" : "Pending"));
          const lowerStatus = normalizedStatus.toLowerCase();
          const isFinalized = lowerStatus === "approved" || lowerStatus === "rejected";

          return (
            <tr key={leave.id} className={tableState.rowClassName}>
              {canApprove ? (
                <td className="border-b border-white/5 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/80 to-indigo-500/80 text-sm font-semibold text-white">
                      {getInitials(leave.employeeName, leave.employeeEmail)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{leave.employeeName || "-"}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{leave.employeeEmail || leave.employeeId || "-"}</span>
                      </div>
                    </div>
                  </div>
                </td>
              ) : null}
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(leave.fromDate)}</td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(leave.toDate)}</td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-100">{leave.reason || "-"}</td>
              <td className="border-b border-white/5 px-4 py-4">
                <StatusBadge
                  value={normalizedStatus}
                  tone={lowerStatus === "approved" ? "success" : lowerStatus === "rejected" ? "danger" : "pending"}
                />
              </td>
              {canApprove ? (
                <td className="border-b border-white/5 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      icon={Check}
                      disabled={isFinalized || isApproving || isRejecting}
                      loading={isApproving}
                      onClick={() => handleApprove(leave)}
                    >
                      {lowerStatus === "approved" ? "Approved" : "Approve"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      icon={X}
                      disabled={isFinalized || isApproving || isRejecting}
                      loading={isRejecting}
                      onClick={() => handleReject(leave)}
                    >
                      {lowerStatus === "rejected" ? "Rejected" : "Reject"}
                    </Button>
                  </div>
                </td>
              ) : null}
            </tr>
          );
        }}
      />
    </section>
  );
}
