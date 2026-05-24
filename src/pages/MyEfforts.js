import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Pencil, Save, Trash2, X } from "lucide-react";

import api, {
  emitDataChanged,
  extractCollection,
  formatDate,
  formatHoursFromMinutes,
  getErrorMessage,
  toNumber,
} from "../api/api";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import { Input } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

const TICKET_TYPE_VALUES = new Set(["sr", "incident", "workorder"]);

function isTicketLikeValue(value) {
  return TICKET_TYPE_VALUES.has(String(value || "").trim().toLowerCase());
}

function normalizeEffort(item, index) {
  const minutesSpent =
    item?.minutesSpent ??
    (item?.hoursSpent !== undefined ? Math.round(toNumber(item.hoursSpent) * 60) : 0);
  const rawCategory = String(item?.effortCategory || "").trim().toLowerCase();
  const ticketType = item?.ticketType || "";
  const ticketNumber = item?.ticketNumber || "";
  const effortType = item?.effortType || "";
  const status = item?.status || "";
  const hasTicketSignals =
    Boolean(status) ||
    isTicketLikeValue(ticketType) ||
    isTicketLikeValue(ticketNumber) ||
    isTicketLikeValue(effortType);
  const inferredCategory =
    hasTicketSignals || rawCategory === "ticket" || rawCategory === "tickets"
      ? "Ticket"
      : rawCategory === "nonticket" ||
          rawCategory === "non-ticket" ||
          rawCategory === "non ticket" ||
          rawCategory === "non_ticket"
        ? "NonTicket"
        : "NonTicket";
  const normalizedType =
    inferredCategory === "Ticket"
      ? ticketType || (isTicketLikeValue(effortType) ? effortType : "") || (isTicketLikeValue(ticketNumber) ? ticketNumber : "")
      : effortType || ticketType || ticketNumber || "";
  const normalizedTarget =
    inferredCategory === "Ticket"
      ? ticketNumber && !isTicketLikeValue(ticketNumber)
        ? ticketNumber
        : "-"
      : effortType || ticketNumber || ticketType || "-";

  return {
    id: item?.id || item?.effortId || item?.effortID || `effort-${index}`,
    hasRealId: Boolean(item?.id || item?.effortId || item?.effortID),
    workDate: item?.workDate || item?.date || item?.createdAt || "",
    effortCategory: inferredCategory,
    ticketType,
    ticketNumber,
    status,
    effortType,
    normalizedType,
    normalizedTarget,
    minutesSpent,
    remarks: item?.remarks || "",
  };
}

export default function MyEfforts() {
  const [efforts, setEfforts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ minutesSpent: "", remarks: "" });
  const [workingId, setWorkingId] = useState("");

  const loadEfforts = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/Effort/my");
      setEfforts(extractCollection(response).map(normalizeEffort));
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load efforts.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEfforts();
  }, [loadEfforts]);

  const sortedEfforts = useMemo(
    () =>
      [...efforts].sort((left, right) => new Date(right.workDate).getTime() - new Date(left.workDate).getTime()),
    [efforts]
  );

  const startEdit = (effort) => {
    if (!effort.hasRealId) {
      return;
    }

    setEditingId(effort.id);
    setEditForm({
      minutesSpent: String(effort.minutesSpent || ""),
      remarks: effort.remarks || "",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm({ minutesSpent: "", remarks: "" });
  };

  const saveEdit = async (id) => {
    if (!editForm.minutesSpent || toNumber(editForm.minutesSpent) <= 0) {
      toast.error("Minutes must be greater than zero.");
      return;
    }

    setWorkingId(id);

    try {
      await api.put(`/Effort/${id}`, {
        minutesSpent: toNumber(editForm.minutesSpent),
        remarks: editForm.remarks.trim() || null,
      });

      emitDataChanged("update-effort");
      toast.success("Effort updated.");
      cancelEdit();
      await loadEfforts();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update effort."));
    } finally {
      setWorkingId("");
    }
  };

  const deleteEffort = async (effort) => {
    if (!effort.hasRealId) {
      toast.error("Delete is not available for this row.");
      return;
    }

    if (!window.confirm("Delete this effort entry?")) {
      return;
    }

    setWorkingId(effort.id);

    try {
      await api.delete(`/Effort/${effort.id}`);
      emitDataChanged("delete-effort");
      toast.success("Effort deleted.");
      await loadEfforts();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to delete effort."));
    } finally {
      setWorkingId("");
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="My efforts"
        subtitle="Search, edit, and clean up your submitted work entries in a denser, easier-to-scan table."
      />

      {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

      <DataTable
        title="Effort ledger"
        description="Recent entries, with inline edit controls preserved."
        loading={loading}
        rows={sortedEfforts}
        searchPlaceholder="Search by type, ticket number, remarks, or status"
        searchAccessor={(row) =>
          [
            row.workDate,
            row.effortCategory,
            row.ticketType,
            row.ticketNumber,
            row.effortType,
            row.normalizedType,
            row.normalizedTarget,
            row.status,
            row.remarks,
          ]
            .filter(Boolean)
            .join(" ")
        }
        emptyIcon={ClipboardList}
        emptyTitle="No efforts found"
        emptyDescription="Once you log work, it’ll appear here with edit and delete actions."
        columns={[
          { key: "date", header: "Date" },
          { key: "category", header: "Category" },
          { key: "type", header: "Type" },
          { key: "target", header: "Ticket / Effort" },
          { key: "hours", header: "Hours" },
          { key: "status", header: "Status" },
          { key: "remarks", header: "Remarks" },
          { key: "actions", header: "Actions", className: "w-[240px]" },
        ]}
        renderRow={(effort, _index, tableState) => {
          const isEditing = editingId === effort.id;
          const isWorking = workingId === effort.id;
          const normalizedStatus = effort.status || "-";

          return (
            <tr key={effort.id} className={tableState.rowClassName}>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(effort.workDate)}</td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-100">{effort.effortCategory || "-"}</td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{effort.normalizedType || "-"}</td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{effort.normalizedTarget || "-"}</td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">
                {isEditing ? (
                  <Input
                    type="number"
                    min="1"
                    value={editForm.minutesSpent}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        minutesSpent: event.target.value,
                      }))
                    }
                  />
                ) : (
                  formatHoursFromMinutes(effort.minutesSpent)
                )}
              </td>
              <td className="border-b border-white/5 px-4 py-4">
                <StatusBadge
                  value={normalizedStatus}
                  tone={
                    normalizedStatus.toLowerCase() === "resolved"
                      ? "success"
                      : normalizedStatus.toLowerCase() === "pending"
                        ? "pending"
                        : normalizedStatus.toLowerCase() === "cancelled"
                          ? "danger"
                          : "neutral"
                  }
                />
              </td>
              <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">
                {isEditing ? (
                  <Input
                    value={editForm.remarks}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        remarks: event.target.value,
                      }))
                    }
                  />
                ) : (
                  effort.remarks || "-"
                )}
              </td>
              <td className="border-b border-white/5 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button type="button" size="sm" variant="primary" icon={Save} loading={isWorking} onClick={() => saveEdit(effort.id)}>
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="secondary" icon={X} disabled={isWorking} onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={Pencil}
                        disabled={!effort.hasRealId || isWorking}
                        onClick={() => startEdit(effort)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        disabled={!effort.hasRealId || isWorking}
                        onClick={() => deleteEffort(effort)}
                      >
                        {isWorking ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        }}
      />
    </section>
  );
}
