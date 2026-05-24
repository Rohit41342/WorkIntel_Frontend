import React from "react";
import { motion } from "framer-motion";
import Card from "./Card";

export default function MetricCard({ icon: Icon, label, value, hint, gradient = "from-brand-500/20 to-indigo-500/5" }) {
  return (
    <Card hover className={`p-6 ${gradient}`}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-100">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
      </motion.div>
    </Card>
  );
}
