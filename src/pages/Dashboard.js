import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, BellRing, CircleGauge, Clock3, RefreshCw, Ticket } from "lucide-react";

import api, {
  extractApiData,
  extractCollection,
  formatDateTime,
  getDataChangedEventName,
  getErrorMessage,
  toNumber,
} from "../api/api";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { Skeleton } from "../components/ui/Skeleton";

const chartColors = ["#5f8cff", "#8b5cf6", "#14b8a6", "#f59e0b", "#f97316", "#ef4444"];
const TICKET_TYPE_VALUES = new Set(["sr", "incident", "workorder"]);

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isTicketLikeValue(value) {
  return TICKET_TYPE_VALUES.has(String(value || "").trim().toLowerCase());
}

function summarizePieData(summary) {
  const source =
    [summary?.effortTypeSummary, summary?.effortTypeBreakdown, summary?.effortTypes, summary?.categoryBreakdown]
      .map(ensureArray)
      .find((items) => items.length > 0) || [];

  return source
    .map((item, index) => ({
      label: item?.effortType || item?.type || item?.name || item?.label || `Type ${index + 1}`,
      value: toNumber(item?.hoursSpent ?? item?.hours ?? item?.totalHours ?? item?.value ?? item?.count),
      color: chartColors[index % chartColors.length],
    }))
    .filter((item) => item.value > 0);
}

function summarizeLineData(summary) {
  const source = [summary?.dailyWork, summary?.dailySummary, summary?.dailyHours, summary?.workByDate]
    .map(ensureArray)
    .find((items) => items.length > 0) || [];

  return source
    .map((item, index) => ({
      label: item?.date || item?.workDate || item?.day || `Day ${index + 1}`,
      value: toNumber(item?.hoursSpent ?? item?.hours ?? item?.totalHours ?? item?.value),
    }))
    .filter((item) => item.label)
    .sort((left, right) => new Date(left.label).getTime() - new Date(right.label).getTime());
}

function normalizeEffort(item, index) {
  const minutesSpent =
    item?.minutesSpent ??
    (item?.hoursSpent !== undefined ? Math.round(toNumber(item.hoursSpent) * 60) : 0);
  const ticketType = item?.ticketType || "";
  const ticketNumber = item?.ticketNumber || "";
  const effortType = item?.effortType || "";
  const status = item?.status || "";
  const hasTicketSignals =
    Boolean(status) ||
    isTicketLikeValue(ticketType) ||
    isTicketLikeValue(ticketNumber) ||
    isTicketLikeValue(effortType);
  const rawCategory = String(item?.effortCategory || "").trim().toLowerCase();

  return {
    id: item?.id || item?.effortId || item?.effortID || `dashboard-effort-${index}`,
    workDate: item?.workDate || item?.date || item?.createdAt || "",
    effortCategory:
      hasTicketSignals || rawCategory === "ticket" || rawCategory === "tickets" ? "Ticket" : "NonTicket",
    ticketType,
    ticketNumber,
    status,
    effortType,
    minutesSpent,
  };
}

function summarizePieDataFromEfforts(efforts) {
  const grouped = efforts.reduce((accumulator, effort) => {
    const key =
      effort.effortCategory === "Ticket"
        ? effort.ticketType || (isTicketLikeValue(effort.ticketNumber) ? effort.ticketNumber : "") || "Ticket"
        : effort.effortType || effort.ticketNumber || effort.ticketType || "NonTicket";

    accumulator[key] = (accumulator[key] || 0) + toNumber(effort.minutesSpent) / 60;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([label, value], index) => ({
      label,
      value: toNumber(value),
      color: chartColors[index % chartColors.length],
    }))
    .filter((item) => item.value > 0);
}

function summarizeLineDataFromEfforts(efforts) {
  const grouped = efforts.reduce((accumulator, effort) => {
    const label = effort.workDate ? new Date(effort.workDate).toISOString() : "";

    if (!label) {
      return accumulator;
    }

    accumulator[label] = (accumulator[label] || 0) + toNumber(effort.minutesSpent) / 60;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({
      label,
      value: toNumber(value),
    }))
    .sort((left, right) => new Date(left.label).getTime() - new Date(right.label).getTime());
}

function normalizeNotification(item, index) {
  return {
    id: item?.id || `notification-${index}`,
    message: item?.message || "-",
    createdAt: item?.createdAt || "",
    isRead: Boolean(item?.isRead),
  };
}

function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 70;
  const center = 90;

  if (!data.length || total <= 0) {
    return (
      <EmptyState
        icon={CircleGauge}
        title="No effort distribution yet"
        description="Effort type data will surface here as soon as entries are available."
      />
    );
  }

  let currentAngle = -Math.PI / 2;

  const arcs = data.map((item) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const startX = center + radius * Math.cos(currentAngle);
    const startY = center + radius * Math.sin(currentAngle);
    const endAngle = currentAngle + sliceAngle;
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const path = [
      `M ${center} ${center}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      "Z",
    ].join(" ");

    currentAngle = endAngle;

    return { ...item, path };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
      <div className="mx-auto w-full max-w-[220px]">
        <svg viewBox="0 0 180 180" width="100%" height="180" aria-label="Effort type pie chart">
          {arcs.map((arc) => (
            <path key={arc.label} d={arc.path} fill={arc.color} className="transition-opacity duration-200 hover:opacity-90" />
          ))}
          <circle cx="90" cy="90" r="32" fill="#050816" />
          <text x="90" y="85" textAnchor="middle" className="fill-slate-400 text-[10px] uppercase tracking-[0.22em]">
            Total
          </text>
          <text x="90" y="102" textAnchor="middle" className="fill-white text-[18px] font-semibold">
            {total.toFixed(1)}
          </text>
        </svg>
      </div>

      <div className="grid gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-200">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-white">{item.value.toFixed(2)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }) {
  if (!data.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No daily trend available"
        description="As soon as work gets logged over multiple days, the chart will animate here."
      />
    );
  }

  const width = 620;
  const height = 240;
  const padding = 30;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data
    .map((item, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (item.value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="240" aria-label="Daily work line chart">
        <defs>
          <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#5f8cff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(148,163,184,0.28)" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(148,163,184,0.28)" />
        <polyline fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />

        {data.map((item, index) => {
          const x = padding + index * xStep;
          const y = height - padding - (item.value / maxValue) * (height - padding * 2);

          return (
            <g key={`${item.label}-${index}`}>
              <circle cx={x} cy={y} r="5" fill="#5f8cff" />
              <text x={x} y={height - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {new Date(item.label).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [efforts, setEfforts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [summaryResult, notificationResult, effortResult] = await Promise.allSettled([
        api.get("/Effort/summary"),
        api.get("/Notification/my"),
        api.get("/Effort/my"),
      ]);

      if (summaryResult.status === "fulfilled") {
        setSummary(extractApiData(summaryResult.value) || {});
        setLastUpdatedAt(new Date().toISOString());
        setErrorMessage("");
      } else {
        const message = getErrorMessage(summaryResult.reason, "Unable to load dashboard summary.");
        setErrorMessage(message);

        if (!isSilent) {
          toast.error(message);
        }
      }

      if (notificationResult.status === "fulfilled") {
        setNotifications(extractCollection(notificationResult.value).map(normalizeNotification));
      }

      if (effortResult.status === "fulfilled") {
        setEfforts(extractCollection(effortResult.value).map(normalizeEffort));
      }
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load dashboard summary.");
      setErrorMessage(message);
      if (!isSilent) {
        toast.error(message);
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const eventName = getDataChangedEventName();
    const handleRefresh = () => {
      loadDashboard(true);
    };
    const handleWindowFocus = () => {
      loadDashboard(true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboard(true);
      }
    };

    window.addEventListener(eventName, handleRefresh);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(() => {
      loadDashboard(true);
    }, 10000);

    return () => {
      window.removeEventListener(eventName, handleRefresh);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  const totalHours = useMemo(
    () => toNumber(summary?.totalHours ?? summary?.hoursSpent ?? summary?.hours ?? summary?.totalWorkedHours),
    [summary]
  );

  const totalTickets = useMemo(
    () => {
      const rawTotal = toNumber(
        summary?.totalTickets ??
          summary?.ticketCount ??
          summary?.totalEntries ??
          summary?.totalEfforts ??
          summary?.totalTicketCount ??
          summary?.ticketsCount
      );

      if (rawTotal > 0) {
        return rawTotal;
      }

      return efforts.filter((item) => item.effortCategory === "Ticket").length;
    },
    [summary, efforts]
  );

  const pieData = useMemo(() => {
    const summaryPieData = summarizePieData(summary);
    return summaryPieData.length > 0 ? summaryPieData : summarizePieDataFromEfforts(efforts);
  }, [summary, efforts]);

  const lineData = useMemo(() => {
    const summaryLineData = summarizeLineData(summary);
    return summaryLineData.length > 0 ? summaryLineData : summarizeLineDataFromEfforts(efforts);
  }, [summary, efforts]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Command center"
        subtitle="A polished view of your hours, tickets, trends, and reminders with live refresh every 10 seconds."
        actions={
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : "animate-spin [animation-duration:6s]"}`} />
            {isRefreshing ? "Refreshing..." : `Last synced ${lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "just now"}`}
          </div>
        }
      />

      {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`metric-skeleton-${index}`} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Clock3} label="Total Hours" value={totalHours.toFixed(2)} hint="Tracked across current summary window" />
            <MetricCard
              icon={Ticket}
              label="Total Tickets"
              value={String(totalTickets)}
              hint="Tickets and entries processed"
              gradient="from-violet-500/20 to-fuchsia-500/5"
            />
            <MetricCard
              icon={BellRing}
              label="Unread Alerts"
              value={String(notifications.filter((item) => !item.isRead).length)}
              hint="Reminders that still need attention"
              gradient="from-cyan-500/20 to-sky-500/5"
            />
            <MetricCard
              icon={Activity}
              label="Effort Types"
              value={String(pieData.length)}
              hint="Categories represented in the current summary"
              gradient="from-amber-500/20 to-orange-500/5"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.05fr_1.2fr]">
            <Card className="p-6">
              <div className="mb-5 space-y-1">
                <h2 className="text-xl font-semibold text-white">Effort by type</h2>
                <p className="text-sm text-slate-400">A cleaner distribution view of how time is being spent.</p>
              </div>
              <PieChart data={pieData} />
            </Card>

            <Card className="p-6">
              <div className="mb-5 space-y-1">
                <h2 className="text-xl font-semibold text-white">Daily work trend</h2>
                <p className="text-sm text-slate-400">Hours across days, refreshed automatically and after every action.</p>
              </div>
              <LineChart data={lineData} />
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Recent notifications</h2>
                <p className="text-sm text-slate-400">Latest backend reminders surfaced in a calmer layout.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400">
                {notifications.length} total
              </div>
            </div>

            {notifications.length === 0 ? (
              <EmptyState
                icon={BellRing}
                title="No notifications yet"
                description="When the backend sends reminders, they’ll appear here with clean status badges."
              />
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50">
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                      <tr>
                        <th className="border-b border-white/10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Date</th>
                        <th className="border-b border-white/10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Message</th>
                        <th className="border-b border-white/10 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.slice(0, 10).map((notification, index) => (
                        <tr
                          key={notification.id}
                          className={index % 2 === 0 ? "bg-white/[0.02] hover:bg-white/[0.05]" : "hover:bg-white/[0.05]"}
                        >
                          <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDateTime(notification.createdAt)}</td>
                          <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-100">{notification.message}</td>
                          <td className="border-b border-white/5 px-4 py-4">
                            <StatusBadge value={notification.isRead ? "Read" : "Unread"} tone={notification.isRead ? "neutral" : "pending"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </section>
  );
}
