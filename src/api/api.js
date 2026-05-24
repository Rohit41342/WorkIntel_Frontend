import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";
const TOKEN_KEY = "accessToken";
const LEGACY_TOKEN_KEY = "token";
const ROLE_KEY = "userRole";
const USER_KEY = "authUser";
const DATA_CHANGED_EVENT = "workintel:data-changed";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || "";
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) || "";
}

export function normalizeRole(role = "") {
  return String(role).trim().toLowerCase();
}

export function hasAnyRole(allowedRoles = [], role = getStoredRole()) {
  if (!allowedRoles.length) {
    return true;
  }

  const normalizedRole = normalizeRole(role);

  return allowedRoles.some((allowedRole) => normalizedRole === normalizeRole(allowedRole));
}

export function canAddEffort(role = getStoredRole()) {
  return hasAnyRole(["employee"], role);
}

export function canViewOwnEfforts(role = getStoredRole()) {
  return hasAnyRole(["employee"], role);
}

export function canViewDashboard(role = getStoredRole()) {
  return hasAnyRole(["employee"], role);
}

export function canViewNotifications(role = getStoredRole()) {
  return hasAnyRole(["employee"], role);
}

export function canUpdateProfile(role = getStoredRole()) {
  return hasAnyRole(["employee", "manager"], role);
}

export function canViewReports(role = getStoredRole()) {
  return hasAnyRole(["manager", "admin"], role);
}

export function canManageHolidays(role = getStoredRole()) {
  return hasAnyRole(["manager", "admin"], role);
}

export function canViewHolidays(role = getStoredRole()) {
  return hasAnyRole(["employee", "manager", "admin"], role);
}

export function canApproveLeave(role = getStoredRole()) {
  return hasAnyRole(["manager", "admin"], role);
}

export function isAdmin(role = getStoredRole()) {
  return hasAnyRole(["admin"], role);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

export function decodeJwt(token) {
  if (!token || !token.includes(".")) {
    return {};
  }

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    const json = decodeURIComponent(
      decoded
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function getRoleFromToken(token) {
  const payload = decodeJwt(token);

  return (
    payload.role ||
    payload.roles?.[0] ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"] ||
    ""
  );
}

export function getEmployeeIdFromToken(token = getAccessToken()) {
  const payload = decodeJwt(token);

  return (
    payload.employeeId ||
    payload.EmployeeId ||
    payload.sub ||
    payload.nameid ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    ""
  );
}

export function getEmailFromToken(token = getAccessToken()) {
  const payload = decodeJwt(token);

  return (
    payload.email ||
    payload.upn ||
    payload.preferred_username ||
    payload.unique_name ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    ""
  );
}

export function getFullNameFromToken(token = getAccessToken()) {
  const payload = decodeJwt(token);

  return (
    payload.name ||
    payload.unique_name ||
    payload.given_name ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    ""
  );
}

export function getHomeRouteForRole(role) {
  if (isAdmin(role)) {
    return "/admin";
  }

  if (hasAnyRole(["manager"], role)) {
    return "/leave";
  }

  return "/dashboard";
}

export function storeAuthSession(responsePayload, fallbackUser = {}) {
  const responseData = responsePayload?.data ?? responsePayload;
  const token =
    responseData?.accessToken ||
    responseData?.token ||
    responseData?.data?.accessToken ||
    responseData?.data?.token;

  if (!token) {
    throw new Error("Access token not found in login response.");
  }

  clearAuthStorage();

  const role =
    responseData?.role ||
    responseData?.data?.role ||
    responseData?.user?.role ||
    responseData?.data?.user?.role ||
    fallbackUser?.role ||
    getRoleFromToken(token);

  const jwtPayload = decodeJwt(token);
  const user =
    responseData?.user ||
    responseData?.data?.user ||
    {
      email:
        responseData?.email ||
        responseData?.data?.email ||
        fallbackUser?.email ||
        getEmailFromToken(token) ||
        jwtPayload.email ||
        "",
      fullName:
        responseData?.fullName ||
        responseData?.data?.fullName ||
        responseData?.user?.fullName ||
        responseData?.data?.user?.fullName ||
        fallbackUser?.fullName ||
        getFullNameFromToken(token) ||
        jwtPayload.unique_name ||
        "",
      role,
      employeeId: fallbackUser?.employeeId || getEmployeeIdFromToken(token),
    };

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);

  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { token, role, user };
}

export function extractApiData(responsePayload) {
  const responseData = responsePayload?.data ?? responsePayload;

  if (responseData && typeof responseData === "object") {
    if (responseData.data !== undefined) {
      return responseData.data;
    }

    if (responseData.result !== undefined) {
      return responseData.result;
    }

    if (responseData.value !== undefined) {
      return responseData.value;
    }
  }

  return responseData;
}

export function extractCollection(responsePayload) {
  const data = extractApiData(responsePayload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

export function getErrorMessage(error, fallback = "Something went wrong.") {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (Array.isArray(responseData?.errors)) {
    return responseData.errors.join(", ");
  }

  if (responseData?.errors && typeof responseData.errors === "object") {
    return Object.values(responseData.errors)
      .flat()
      .join(", ");
  }

  return responseData?.message || responseData?.detail || responseData?.title || responseData?.error || error?.message || fallback;
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toDateInputValue(value = new Date()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toApiDate(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  return new Date(`${dateValue}T00:00:00`).toISOString();
}

export function getMonthStartInputValue(value = new Date()) {
  const date = new Date(value);
  date.setDate(1);
  return toDateInputValue(date);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

export function formatHoursValue(item) {
  if (item?.hoursSpent !== undefined && item?.hoursSpent !== null) {
    return Number(toNumber(item.hoursSpent)).toFixed(2);
  }

  if (item?.minutesSpent !== undefined && item?.minutesSpent !== null) {
    return (toNumber(item.minutesSpent) / 60).toFixed(2);
  }

  return "0.00";
}

export function formatHoursFromMinutes(minutes) {
  return (toNumber(minutes) / 60).toFixed(2);
}

export function emitDataChanged(source = "unknown") {
  window.dispatchEvent(
    new CustomEvent(DATA_CHANGED_EVENT, {
      detail: { source, at: new Date().toISOString() },
    })
  );
}

export function getDataChangedEventName() {
  return DATA_CHANGED_EVENT;
}

export default api;
