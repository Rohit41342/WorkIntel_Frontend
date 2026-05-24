import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { getAccessToken, getHomeRouteForRole, getStoredRole } from "./api/api";
import ProtectedRoute from "./components/ProtectedRoute";
import AddEffort from "./pages/AddEffort";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Holiday from "./pages/Holiday";
import Leave from "./pages/Leave";
import Login from "./pages/Login";
import MyEfforts from "./pages/MyEfforts";
import Notifications from "./pages/Notifications";
import ProfileUpdate from "./pages/ProfileUpdate";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import ResetPassword from "./pages/ResetPassword";

function RootRedirect() {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRouteForRole(getStoredRole())} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "18px",
            background: "rgba(15, 23, 42, 0.92)",
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            boxShadow: "0 20px 60px rgba(2, 6, 23, 0.45)",
            backdropFilter: "blur(18px)",
          },
          success: {
            iconTheme: {
              primary: "#34d399",
              secondary: "#04120b",
            },
          },
          error: {
            iconTheme: {
              primary: "#fb7185",
              secondary: "#1b0a0f",
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <AddEffort />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <MyEfforts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute allowedRoles={["Employee", "Manager", "Admin"]}>
              <Leave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile-update"
          element={
            <ProtectedRoute allowedRoles={["Employee", "Manager"]}>
              <ProfileUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/holiday"
          element={
            <ProtectedRoute allowedRoles={["Employee", "Manager", "Admin"]}>
              <Holiday />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
