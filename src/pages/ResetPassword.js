import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import api, { getErrorMessage } from "../api/api";
import AuthLayout from "../components/ui/AuthLayout";
import Button from "../components/ui/Button";
import { FormField, Input } from "../components/ui/FormField";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialToken = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!initialToken.trim()) {
      const message = "Reset token is missing or invalid.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!form.newPassword || !form.confirmPassword) {
      const message = "Please complete all fields.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      const message = "Password and confirm password must match.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/Auth/reset-password", {
        token: initialToken.trim(),
        newPassword: form.newPassword,
      });

      toast.success("Password reset successful. Please login.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, "Unable to reset password.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Create a new password to complete your secure recovery flow."
      footer={
        <Link className="text-sm text-brand-300 transition hover:text-brand-200" to="/login">
          Back to login
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

        <FormField label="New Password" htmlFor="reset-new-password">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="reset-new-password"
              type={showPassword ? "text" : "password"}
              value={form.newPassword}
              onChange={(event) => updateField("newPassword", event.target.value)}
              placeholder="Enter new password"
              className="pl-11 pr-14"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm Password" htmlFor="reset-confirm-password">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Confirm new password"
              className="pl-11 pr-14"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white"
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <Button type="submit" loading={isSubmitting} className="w-full justify-center">
          {isSubmitting ? "Updating..." : "Reset Password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
