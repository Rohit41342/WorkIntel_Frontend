import React from "react";
import { motion } from "framer-motion";

export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="space-y-2">
        {eyebrow ? (
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {eyebrow}
          </div>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-sm text-slate-400 sm:text-base">{subtitle}</p> : null}
        </div>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </motion.div>
  );
}
