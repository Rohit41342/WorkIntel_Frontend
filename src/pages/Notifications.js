import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BellRing } from "lucide-react";

import api, { extractCollection, formatDateTime, getErrorMessage } from "../api/api";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

function normalizeNotification(item, index) {
  return {
    id: item?.id || `notification-${index}`,
    message: item?.message || "-",
    createdAt: item?.createdAt || "",
    isRead: Boolean(item?.isRead),
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get("/Notification/my");
        setNotifications(extractCollection(response).map(normalizeNotification));
      } catch (error) {
        const message = getErrorMessage(error, "Unable to load notifications.");
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle="Backend reminders and nudges, restyled into a more readable activity feed."
      />

      {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

      <DataTable
        title="Recent reminders"
        description="Employee-only notifications with search, sticky headers, and cleaner status treatment."
        loading={loading}
        rows={notifications}
        searchPlaceholder="Search notifications"
        searchAccessor={(row) => [row.createdAt, row.message, row.isRead ? "read" : "unread"].join(" ")}
        emptyIcon={BellRing}
        emptyTitle="No notifications found"
        emptyDescription="When reminders are generated, they’ll appear here."
        columns={[
          { key: "date", header: "Date" },
          { key: "message", header: "Message" },
          { key: "status", header: "Status" },
        ]}
        renderRow={(notification, _index, tableState) => (
          <tr key={notification.id} className={tableState.rowClassName}>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDateTime(notification.createdAt)}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-100">{notification.message}</td>
            <td className="border-b border-white/5 px-4 py-4">
              <StatusBadge value={notification.isRead ? "Read" : "Unread"} tone={notification.isRead ? "neutral" : "pending"} />
            </td>
          </tr>
        )}
      />
    </section>
  );
}
