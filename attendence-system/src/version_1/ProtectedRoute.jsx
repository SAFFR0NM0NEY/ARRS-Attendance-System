import { Navigate, useLocation } from "react-router-dom";

// Protect pages that should only be visible to particular roles.
export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();

  // Demo-only session stored by the mock login page.
  const session = JSON.parse(
    localStorage.getItem("itca-demo-session") || "null"
  );

  // If no one is logged in, send the visitor to the login page.
  if (!session) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // If the user's role is not allowed, send them to their own dashboard.
  if (!allowedRoles.includes(session.role)) {
    return <Navigate to={`/${session.role}/dashboard`} replace />;
  }

  // Render the requested page only if the role is permitted.
  return children;
}
