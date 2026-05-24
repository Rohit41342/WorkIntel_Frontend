import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarRange, FileClock, FilePlus2, MessageSquareText, RotateCcw, TimerReset } from "lucide-react";

import api, { emitDataChanged, getErrorMessage, toApiDate, toDateInputValue, toNumber } from "../api/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { FormField, Input, Select, Textarea } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";

const buildInitialForm = () => ({
  effortCategory: "Ticket",
  ticketType: "SR",
  ticketNumber: "",
  status: "Resolved",
  effortType: "Deployment",
  minutesSpent: "",
  remarks: "",
  workDate: toDateInputValue(),
});

export default function AddEffort() {
  const navigate = useNavigate();
  const [form, setForm] = useState(buildInitialForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isTicket = form.effortCategory === "Ticket";
  const hoursPreview = useMemo(() => (toNumber(form.minutesSpent) / 60).toFixed(2), [form.minutesSpent]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.workDate) {
      const message = "Please select work date.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!form.minutesSpent || toNumber(form.minutesSpent) <= 0) {
      const message = "Minutes must be greater than zero.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (isTicket && !form.ticketNumber.trim()) {
      const message = "Ticket number is required for ticket efforts.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const payload = {
      effortCategory: form.effortCategory,
      ticketNumber: isTicket ? form.ticketNumber.trim() : null,
      ticketType: isTicket ? form.ticketType : null,
      status: isTicket ? form.status : null,
      effortType: isTicket ? null : form.effortType,
      minutesSpent: toNumber(form.minutesSpent),
      remarks: form.remarks.trim() || null,
      workDate: toApiDate(form.workDate),
    };

    setIsSubmitting(true);

    try {
      await api.post("/Effort/add", payload);
      emitDataChanged("add-effort");
      toast.success("Effort added successfully.");
      setForm(buildInitialForm());
      navigate("/my");
    } catch (error) {
      const message = getErrorMessage(error, "Unable to add effort.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Create"
        title="Log new effort"
        subtitle="Capture ticket and non-ticket work with a calmer, more structured form that still uses the same backend payload."
      />

      <Card className="p-6 sm:p-7">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
                  <FilePlus2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Entry details</h2>
                  <p className="text-sm text-slate-400">Choose category, work date, and effort specifics.</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Effort Category" htmlFor="effort-category">
                  <Select
                    id="effort-category"
                    value={form.effortCategory}
                    onChange={(event) => updateField("effortCategory", event.target.value)}
                  >
                    <option value="Ticket">Ticket</option>
                    <option value="NonTicket">NonTicket</option>
                  </Select>
                </FormField>

                <FormField label="Work Date" htmlFor="work-date">
                  <div className="relative">
                    <CalendarRange className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="work-date"
                      type="date"
                      value={form.workDate}
                      onChange={(event) => updateField("workDate", event.target.value)}
                      className="pl-11"
                    />
                  </div>
                </FormField>
              </div>

              {isTicket ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Ticket Type" htmlFor="ticket-type">
                    <Select id="ticket-type" value={form.ticketType} onChange={(event) => updateField("ticketType", event.target.value)}>
                      <option value="SR">SR</option>
                      <option value="Incident">Incident</option>
                      <option value="WorkOrder">WorkOrder</option>
                    </Select>
                  </FormField>

                  <FormField label="Ticket Number" htmlFor="ticket-number">
                    <div className="relative">
                      <FileClock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="ticket-number"
                        value={form.ticketNumber}
                        onChange={(event) => updateField("ticketNumber", event.target.value)}
                        placeholder="Enter ticket number"
                        className="pl-11"
                      />
                    </div>
                  </FormField>

                  <FormField label="Status" htmlFor="ticket-status">
                    <Select id="ticket-status" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                      <option value="Resolved">Resolved</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FormField>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Effort Type" htmlFor="effort-type">
                    <Select id="effort-type" value={form.effortType} onChange={(event) => updateField("effortType", event.target.value)}>
                      <option value="Deployment">Deployment</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Sanity">Sanity</option>
                      <option value="Others">Others</option>
                    </Select>
                  </FormField>
                </div>
              )}
            </div>

            <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-200">
                  <TimerReset className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Time + context</h2>
                  <p className="text-sm text-slate-400">Add duration and a short note for future reference.</p>
                </div>
              </div>

              <FormField label="Minutes" htmlFor="minutes-spent" helper={`Hours preview: ${hoursPreview}`}>
                <Input
                  id="minutes-spent"
                  type="number"
                  min="1"
                  value={form.minutesSpent}
                  onChange={(event) => updateField("minutesSpent", event.target.value)}
                  placeholder="Enter minutes"
                />
              </FormField>

              <FormField label="Remarks" htmlFor="remarks">
                <div className="relative">
                  <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-500" />
                  <Textarea
                    id="remarks"
                    value={form.remarks}
                    onChange={(event) => updateField("remarks", event.target.value)}
                    placeholder="Add remarks"
                    className="pl-11"
                  />
                </div>
              </FormField>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
                This visual refresh doesn’t touch validation or payload shape. Your backend contract stays intact.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Saving..." : "Submit Entry"}
            </Button>
            <Button type="button" variant="secondary" icon={RotateCcw} disabled={isSubmitting} onClick={() => setForm(buildInitialForm())}>
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
