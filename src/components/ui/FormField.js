import React from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";

export function FormField({ label, htmlFor, helper, error, children, className }) {
  return (
    <div className={clsx("space-y-2", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium tracking-wide text-slate-200">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <div className="flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      ) : helper ? (
        <p className="text-xs text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        "field-ui w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500",
        "transition duration-200 focus:border-brand-400/60 focus:bg-slate-950/90 focus:outline-none focus:ring-4 focus:ring-brand-400/10",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        "field-ui w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-50",
        "transition duration-200 focus:border-brand-400/60 focus:bg-slate-950/90 focus:outline-none focus:ring-4 focus:ring-brand-400/10",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx(
        "field-ui min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500",
        "transition duration-200 focus:border-brand-400/60 focus:bg-slate-950/90 focus:outline-none focus:ring-4 focus:ring-brand-400/10",
        className
      )}
      {...props}
    />
  );
}
