
import { Navigate, useLocation } from "react-router-dom";

const validRoles = ["student", "trainer", "faculty", "admin"];

export default function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const location = useLocation();

  // Read the development preview session.
  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("itcaUser") || "null"
    );
  } catch {
    user = null;
  }

  // Require a valid preview session and role.
  if (
    !user ||
    typeof user.role !== "string" ||
    !validRoles.includes(user.role)
  ) {
    localStorage.removeItem("itcaUser");

    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Only allow the role assigned to this route.
  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={`/${user.role}/dashboard`}
        replace
      />
    );
  }

  return children;
}
