import React, { useState } from "react";
import toast from "react-hot-toast";
import { Mail, UserRound, UserRoundCog } from "lucide-react";

import api, { getEmployeeIdFromToken, getErrorMessage, getStoredRole, getStoredUser } from "../api/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { FormField, Input } from "../components/ui/FormField";
import PageHeader from "../components/ui/PageHeader";

export default function ProfileUpdate() {
  const currentUser = getStoredUser();
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const fullName = form.fullName.trim();
    const email = form.email.trim();

    if (!fullName || !email) {
      const message = "Please enter full name and email.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/Profile/request-update", {
        employeeId: getEmployeeIdFromToken() || currentUser?.employeeId || null,
        newFullName: fullName,
        newEmail: email,
        newRole: getStoredRole() || null,
        isApproved: false,
        createdAt: new Date().toISOString(),
      });

      toast.success("Profile update request submitted.");
    } catch (error) {
      const message = getErrorMessage(error, "Unable to submit profile update request.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Identity"
        title="Profile update"
        subtitle="Submit a polished update request for admin approval without changing the payload your backend expects."
      />

      <Card className="p-6 sm:p-7">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-200">
              <UserRoundCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Request profile changes</h2>
              <p className="text-sm text-slate-400">Name and email changes will still flow through admin approval.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Full Name" htmlFor="profile-full-name">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="profile-full-name"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Enter full name"
                  className="pl-11"
                />
              </div>
            </FormField>

            <FormField label="Email" htmlFor="profile-email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Enter email"
                  className="pl-11"
                />
              </div>
            </FormField>
          </div>

          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Update Request"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
