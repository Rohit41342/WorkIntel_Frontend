import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { getAccessToken, getHomeRouteForRole, getStoredRole, hasAnyRole } from "../api/api";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getAccessToken();
  const role = getStoredRole();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length && !hasAnyRole(allowedRoles, role)) {
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return (
    <div className="min-h-screen bg-auth-gradient text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((current) => !current)} />

        <AnimatePresence>
          {mobileSidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                onClick={(event) => event.stopPropagation()}
                className="h-full w-[300px] border-r border-white/10 bg-slate-950/95"
              >
                <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26 }}
            className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-7xl">{children}</div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
