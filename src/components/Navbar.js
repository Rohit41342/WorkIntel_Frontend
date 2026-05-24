import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LogOut, Menu, MoonStar, Sparkles, SunMedium } from "lucide-react";

import { clearAuthStorage, getStoredRole, getStoredUser } from "../api/api";
import Button from "./ui/Button";
import { useTheme } from "./ui/ThemeProvider";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/add": "Add Effort",
  "/my": "My Efforts",
  "/leave": "Leave Management",
  "/notifications": "Notifications",
  "/profile-update": "Profile Update",
  "/holiday": "Holiday Calendar",
  "/reports": "Reports",
  "/admin": "Admin Workspace",
};

function getInitials(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getStoredRole();
  const user = getStoredUser();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    clearAuthStorage();
    toast.success("Logged out");
    navigate("/login");
  };

  const title = routeTitles[location.pathname] || "Workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-975/70 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Workspace
            </div>
            <h1 className="truncate text-xl font-semibold text-white">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/80 to-indigo-500/80 text-sm font-semibold text-white">
              {getInitials(user?.fullName || user?.email || "WI")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.fullName || "WorkIntel User"}</p>
              <p className="truncate text-xs text-slate-400">
                {role || "Member"} · {user?.email || "Logged in"}
              </p>
            </div>
          </div>

          <Button variant="secondary" size="sm" icon={LogOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
