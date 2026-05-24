import React from "react";
import { motion } from "framer-motion";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-auth-gradient">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5%] top-[10%] h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-[10%] right-[-4%] h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:38px_38px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-xl space-y-8"
          >
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              WorkIntel
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                Employee effort, leave, report, and approval tracking in one place.
              </h1>
              <p className="text-base leading-8 text-slate-400">
                This application is built to manage daily work logs, leave requests, reporting, and role-based approvals for teams.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Track employee efforts",
                "Manage leave approvals",
                "Generate work reports",
                "Handle role-based workflows",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300 backdrop-blur-xl">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-card backdrop-blur-2xl sm:p-10"
        >
          <div className="mb-8 space-y-3">
            <div className="inline-flex rounded-full border border-brand-400/20 bg-brand-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-brand-200">
              WorkIntel
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
              <p className="text-sm leading-6 text-slate-400">{subtitle}</p>
            </div>
          </div>

          {children}
          {footer ? <div className="mt-8">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  );
}
