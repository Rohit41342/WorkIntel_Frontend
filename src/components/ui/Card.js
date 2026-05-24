import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

export default function Card({ children, className, hover = false }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl",
        "shadow-card",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
