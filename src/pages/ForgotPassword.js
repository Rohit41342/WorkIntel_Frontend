import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Send } from "lucide-react";

import api, { getErrorMessage } from "../api/api";
import AuthLayout from "../components/ui/AuthLayout";
import Button from "../components/ui/Button";
import { FormField, Input } from "../components/ui/FormField";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      const message = "Please enter email.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/Auth/forgot-password", { email: trimmedEmail });
      toast.success("Reset link request submitted successfully.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, "Unable to request password reset.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Start the password reset flow by submitting the email associated with your account."
      footer={
        <Link className="text-sm text-brand-300 transition hover:text-brand-200" to="/login">
          Back to login
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

        <FormField label="Email" htmlFor="forgot-password-email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="pl-11"
            />
          </div>
        </FormField>

        <Button type="submit" loading={isSubmitting} icon={Send} className="w-full justify-center">
          {isSubmitting ? "Submitting..." : "Send Reset Request"}
        </Button>
      </form>
    </AuthLayout>
  );
}
