import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({ open, title, description, children, footer }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-card"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              {description ? <p className="text-sm text-slate-400">{description}</p> : null}
            </div>
            <div className="mt-5">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
