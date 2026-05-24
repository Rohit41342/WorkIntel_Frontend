import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, CalendarPlus2 } from "lucide-react";

import api, {
  canManageHolidays,
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
import { FormField, Input } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";

function normalizeHoliday(item, index) {
  return {
    id: item?.id || `holiday-${index}`,
    date: item?.date || "",
    name: item?.name || "",
  };
}

function buildInitialForm() {
  return {
    date: toDateInputValue(),
    name: "",
  };
}

export default function Holiday() {
  const role = getStoredRole();
  const canEditHoliday = canManageHolidays(role);
  const [form, setForm] = useState(buildInitialForm());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [listInfo, setListInfo] = useState("");

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setListInfo("");

    try {
      const response = await api.get("/Holiday");
      setHolidays(extractCollection(response).map(normalizeHoliday));
    } catch (error) {
      setListInfo("Holiday list endpoint is not available in the current backend contract. Newly added holidays will still appear here.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.date || !form.name.trim()) {
      const message = "Please enter holiday date and name.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/Holiday", {
        date: toApiDate(form.date),
        name: form.name.trim(),
      });

      const createdHoliday = extractApiData(response);

      setHolidays((current) => {
        const nextItem =
          createdHoliday && typeof createdHoliday === "object"
            ? normalizeHoliday(createdHoliday, current.length)
            : normalizeHoliday(
                {
                  id: `local-${Date.now()}`,
                  date: toApiDate(form.date),
                  name: form.name.trim(),
                },
                current.length
              );

        return [nextItem, ...current];
      });

      toast.success("Holiday added successfully.");
      setForm(buildInitialForm());
    } catch (error) {
      const message = getErrorMessage(error, "Unable to add holiday.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title={canEditHoliday ? "Holiday management" : "Holiday calendar"}
        subtitle={canEditHoliday ? "Broadcast and review holidays in a cleaner admin surface." : "A calmer shared view of announced holidays."}
      />

      {canEditHoliday ? (
        <Card className="p-6 sm:p-7">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
                <CalendarPlus2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Add holiday</h2>
                <p className="text-sm text-slate-400">Backend email broadcast stays untouched.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Holiday Date" htmlFor="holiday-date">
                <Input
                  id="holiday-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                />
              </FormField>

              <FormField label="Holiday Name" htmlFor="holiday-name">
                <Input
                  id="holiday-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter holiday name"
                />
              </FormField>
            </div>

            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Holiday"}
            </Button>
          </form>
        </Card>
      ) : null}

      <DataTable
        title="Holiday list"
        description="Shared calendar entries available to the current role."
        loading={loading}
        rows={holidays}
        searchPlaceholder="Search by holiday name or date"
        searchAccessor={(row) => [row.date, row.name].join(" ")}
        emptyIcon={CalendarDays}
        emptyTitle="No holidays found"
        emptyDescription="When holidays are announced, they’ll appear here."
        columns={[
          { key: "date", header: "Date" },
          { key: "name", header: "Name" },
        ]}
        rightAction={listInfo ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">{listInfo}</div> : null}
        renderRow={(holiday, _index, tableState) => (
          <tr key={holiday.id} className={tableState.rowClassName}>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(holiday.date)}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm font-medium text-white">{holiday.name || "-"}</td>
          </tr>
        )}
      />
    </section>
  );
}
