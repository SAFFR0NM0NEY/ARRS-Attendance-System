
import { Routes, Route, Navigate } from "react-router-dom";

import Welcome from './Welcome';
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import NotFound from "./NotFound";
import ProtectedRoute from "./ProtectedRoute";

// Main application routing.
export default function App() {
  return (
    <Routes>
      {/* Public pages: visitors can access these without logging in. */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* The QR code can point to this permanent website path. */}
      <Route
        path="/check-in"
        element={<Navigate to="/login?next=/check-in" replace />}
      />

      {/* Each dashboard is restricted to its assigned role. */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard role="student" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer/*"
        element={
          <ProtectedRoute allowedRoles={["trainer"]}>
            <Dashboard role="trainer" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <Dashboard role="faculty" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard role="admin" />
          </ProtectedRoute>
        }
      />

      {/* Redirect unknown addresses to a friendly error page. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
