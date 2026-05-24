import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import api, {
  getAccessToken,
  getErrorMessage,
  getHomeRouteForRole,
  getStoredRole,
  storeAuthSession,
} from "../api/api";
import AuthLayout from "../components/ui/AuthLayout";
import Button from "../components/ui/Button";
import { FormField, Input } from "../components/ui/FormField";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (getAccessToken()) {
      navigate(getHomeRouteForRole(getStoredRole()), { replace: true });
    }
  }, [navigate]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.email || !payload.password) {
      const message = "Please enter email and password.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/Auth/login", payload);
      const { role } = storeAuthSession(response, { email: payload.email });
      const targetPath = location.state?.from || getHomeRouteForRole(role);

      toast.success("Login successful.");
      navigate(targetPath, { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, "Login failed.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your workspace and pick up where your team left off."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link className="text-slate-400 transition hover:text-white" to="/register">
            Create account
          </Link>
          <Link className="text-brand-300 transition hover:text-brand-200" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

        <FormField label="Email" htmlFor="login-email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@company.com"
              className="pl-11"
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="login-password">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Enter your password"
              className="pl-11 pr-14"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:text-white"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <Button type="submit" loading={isSubmitting} icon={ArrowRight} className="w-full justify-center">
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>
      </form>
    </AuthLayout>
  );
}
