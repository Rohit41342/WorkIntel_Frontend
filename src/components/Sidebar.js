import React from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import {
  canAddEffort,
  canViewDashboard,
  canViewHolidays,
  canViewNotifications,
  canViewOwnEfforts,
  canUpdateProfile,
  canViewReports,
  canManageHolidays,
  getStoredRole,
  isAdmin,
} from "../api/api";

function buildNavItems(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const isAdminUser = isAdmin(role);
  const isManagerUser = normalizedRole === "manager";
  const isLeaveApprover = isAdminUser || isManagerUser;

  const items = [];

  if (canViewDashboard(role)) {
    items.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  if (canAddEffort(role)) {
    items.push({ to: "/add", label: "Add Effort", icon: Gauge });
  }

  if (canViewOwnEfforts(role)) {
    items.push({ to: "/my", label: "My Efforts", icon: ClipboardList });
  }

  if (canViewDashboard(role) || canAddEffort(role) || canViewOwnEfforts(role) || isLeaveApprover) {
    items.push({
      to: "/leave",
      label: isLeaveApprover ? "Leave Approval" : "Apply Leave",
      icon: CalendarCheck2,
    });
  }

  if (canViewNotifications(role)) {
    items.push({ to: "/notifications", label: "Notifications", icon: Bell });
  }

  if (canUpdateProfile(role)) {
    items.push({ to: "/profile-update", label: "Profile Update", icon: UserCog });
  }

  if (canViewHolidays(role)) {
    items.push({
      to: "/holiday",
      label: canManageHolidays(role) ? "Holiday" : "Holidays",
      icon: CalendarDays,
    });
  }

  if (canViewReports(role)) {
    items.push({ to: "/reports", label: "Reports", icon: FileSpreadsheet });
  }

  if (isAdminUser) {
    items.push({ to: "/admin", label: "User Approval", icon: ShieldCheck });
    items.push({ to: "/admin?section=profiles", label: "Profile Requests", icon: Users });
  }

  return items;
}

export default function Sidebar({ collapsed, onToggle }) {
  const role = getStoredRole();
  const items = buildNavItems(role);

  return (
    <motion.aside
      animate={{ width: collapsed ? 92 : 288 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="hidden shrink-0 border-r border-white/10 bg-slate-950/75 backdrop-blur-xl lg:block"
    >
      <div className="flex h-full flex-col px-4 py-5">
        <div className="mb-8 flex items-center justify-between gap-3 px-2">
          <div className={clsx("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-500 text-sm font-semibold text-white shadow-glow">
              WI
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">WorkIntel</p>
                <p className="text-xs text-slate-500">Operations workspace</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="mb-4 px-2 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
          {!collapsed ? "Workspace" : ""}
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={`${item.to}-${item.label}`} to={item.to}>
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={clsx(
                      "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-brand-500/20 to-indigo-500/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {isActive ? (
                      <div className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand-400" />
                    ) : null}
                    <div
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all",
                        isActive
                          ? "border-brand-400/20 bg-brand-400/10 text-brand-100"
                          : "border-white/10 bg-white/[0.03] text-slate-300 group-hover:bg-white/10"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!collapsed ? <span className="truncate font-medium">{item.label}</span> : null}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
