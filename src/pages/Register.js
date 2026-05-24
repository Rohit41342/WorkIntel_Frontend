import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

import api, { getErrorMessage } from "../api/api";
import AuthLayout from "../components/ui/AuthLayout";
import Button from "../components/ui/Button";
import { FormField, Input, Select } from "../components/ui/FormField";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "Employee",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
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

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    if (!payload.fullName || !payload.email || !payload.password) {
      const message = "Please complete all fields.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (payload.password !== form.confirmPassword) {
      const message = "Password and confirm password must match.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/Auth/register", payload);
      toast.success("Registration successful. Please login.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, "Registration failed.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Request a new employee or manager workspace account. Admin approval stays untouched."
      footer={
        <div className="text-sm">
          <Link className="text-brand-300 transition hover:text-brand-200" to="/login">
            Back to login
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="register-fullName" className="sm:col-span-2">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="register-fullName"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Enter full name"
                className="pl-11"
              />
            </div>
          </FormField>

          <FormField label="Email" htmlFor="register-email" className="sm:col-span-2">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="register-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@company.com"
                className="pl-11"
              />
            </div>
          </FormField>

          <FormField label="Role" htmlFor="register-role">
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Select id="register-role" value={form.role} onChange={(event) => updateField("role", event.target.value)} className="pl-11">
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
              </Select>
            </div>
          </FormField>
        </div>

        <FormField label="Password" htmlFor="register-password">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Create password"
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

        <FormField label="Confirm Password" htmlFor="register-confirmPassword">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="register-confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Confirm password"
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
          {isSubmitting ? "Registering..." : "Register"}
        </Button>
      </form>
    </AuthLayout>
  );
}
