import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, UserPlus, UserRoundCog } from "lucide-react";

import api, { extractCollection, formatDate, getErrorMessage } from "../api/api";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import PageHeader from "../components/ui/PageHeader";

function normalizePendingUser(item, index) {
  return {
    id: item?.id || item?.userId || `pending-user-${index}`,
    fullName: item?.fullName || item?.name || "-",
    email: item?.email || "-",
    role: item?.role || "-",
    createdAt: item?.createdAt || item?.requestedAt || "",
  };
}

function normalizeProfileRequest(item, index) {
  return {
    id: item?.id || item?.requestId || `profile-request-${index}`,
    employeeId: item?.employeeId || "-",
    newFullName: item?.newFullName || "-",
    newEmail: item?.newEmail || "-",
    newRole: item?.newRole || "-",
    createdAt: item?.createdAt || "",
  };
}

export default function Admin() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [workingId, setWorkingId] = useState("");

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [pendingResponse, profileResponse] = await Promise.all([
        api.get("/Admin/pending-users"),
        api.get("/Admin/profile-requests"),
      ]);

      setPendingUsers(extractCollection(pendingResponse).map(normalizePendingUser));
      setProfileRequests(extractCollection(profileResponse).map(normalizeProfileRequest));
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load admin data.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const approvePendingUser = async (id) => {
    setWorkingId(id);

    try {
      await api.post(`/Admin/approve/${id}`);
      toast.success("User approved.");
      await loadAdminData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to approve user."));
    } finally {
      setWorkingId("");
    }
  };

  const approveProfileRequest = async (id) => {
    setWorkingId(id);

    try {
      await api.post(`/Admin/approve-profile/${id}`);
      toast.success("Profile request approved.");
      await loadAdminData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to approve profile request."));
    } finally {
      setWorkingId("");
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Approval workspace"
        subtitle="Review pending users and profile requests in a cleaner control surface built for repeated approval work."
      />

      {errorMessage ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div> : null}

      <DataTable
        title="Pending users"
        description="Accounts waiting for approval."
        loading={loading}
        rows={pendingUsers}
        searchPlaceholder="Search pending users"
        searchAccessor={(row) => [row.fullName, row.email, row.role, row.createdAt].join(" ")}
        emptyIcon={UserPlus}
        emptyTitle="No pending users"
        emptyDescription="New registrations needing approval will appear here."
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role" },
          { key: "requested", header: "Requested" },
          { key: "action", header: "Action", className: "w-[180px]" },
        ]}
        renderRow={(user, _index, tableState) => (
          <tr key={user.id} className={tableState.rowClassName}>
            <td className="border-b border-white/5 px-4 py-4 text-sm font-medium text-white">{user.fullName}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{user.email}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{user.role}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(user.createdAt)}</td>
            <td className="border-b border-white/5 px-4 py-4">
              <Button
                type="button"
                size="sm"
                icon={ShieldCheck}
                loading={workingId === user.id}
                onClick={() => approvePendingUser(user.id)}
              >
                Approve
              </Button>
            </td>
          </tr>
        )}
      />

      <DataTable
        title="Profile requests"
        description="Pending name, email, or role update requests."
        loading={loading}
        rows={profileRequests}
        searchPlaceholder="Search profile requests"
        searchAccessor={(row) => [row.employeeId, row.newFullName, row.newEmail, row.newRole, row.createdAt].join(" ")}
        emptyIcon={UserRoundCog}
        emptyTitle="No profile requests"
        emptyDescription="When users submit profile updates, they’ll land here."
        columns={[
          { key: "employeeId", header: "Employee Id" },
          { key: "name", header: "New Full Name" },
          { key: "email", header: "New Email" },
          { key: "role", header: "New Role" },
          { key: "requested", header: "Requested" },
          { key: "action", header: "Action", className: "w-[180px]" },
        ]}
        renderRow={(request, _index, tableState) => (
          <tr key={request.id} className={tableState.rowClassName}>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{request.employeeId}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm font-medium text-white">{request.newFullName}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{request.newEmail}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{request.newRole}</td>
            <td className="border-b border-white/5 px-4 py-4 text-sm text-slate-300">{formatDate(request.createdAt)}</td>
            <td className="border-b border-white/5 px-4 py-4">
              <Button
                type="button"
                size="sm"
                icon={ShieldCheck}
                loading={workingId === request.id}
                onClick={() => approveProfileRequest(request.id)}
              >
                Approve
              </Button>
            </td>
          </tr>
        )}
      />
    </section>
  );
}
