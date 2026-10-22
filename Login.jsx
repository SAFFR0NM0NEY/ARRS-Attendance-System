import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const demoRoles = ["student", "trainer", "faculty", "admin"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Basic front-end checks. These do not verify a real account.
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email address and password.");
      return;
    }

    // DEVELOPMENT ONLY: simulate a successful login.
    // Never use a role selected by the user as real authorisation.
    const demoSession = {
      email,
      role,
      name: email.split("@")[0] || "ITCA User"
    };

    localStorage.setItem(
      "itca-demo-session",
      JSON.stringify(demoSession)
    );

    // Return to the requested page only if it belongs to this role.
    const requestedPath = location.state?.from?.pathname;
    const safeDefault = `/${role}/dashboard`;

    const safeDestination =
      requestedPath?.startsWith(`/${role}/`) &&
      !requestedPath.includes("..")
        ? requestedPath
        : safeDefault;

    // A check-in request can continue to the check-in interface.
    const queryNext = new URLSearchParams(location.search).get("next");
    const destination =
      queryNext === "/check-in" ? `/${role}/check-in` : safeDestination;

    navigate(destination, { replace: true });
  }

  return (
    <div className="auth-page">
      <Link to="/" className="brand auth-brand">
        <span className="brand-mark">I</span>
        <span>
          <strong>ITCA</strong>
          <small>Digital Attendance Register</small>
        </span>
      </Link>

      <div className="auth-card">
        <div className="auth-heading">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Sign in to ITCA</h1>
          <p>Access your dashboard and academic information.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {/* Demo-only selector. Remove it when real authentication is connected. */}
          <label htmlFor="demo-role">Preview dashboard role (demo only)</label>
          <select
            id="demo-role"
            value={role}
            onChange={(event) => {
              const nextRole = event.target.value;
              if (demoRoles.includes(nextRole)) setRole(nextRole);
            }}
          >
            <option value="student">Student</option>
            <option value="trainer">Trainer</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="button button-primary button-full">
            Sign in <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

        <p className="demo-note">
          Front-end demo: any non-empty email and password will work.
          This does not authenticate a real ITCA account.
        </p>
      </div>

      <Link to="/" className="back-home">← Back to welcome page</Link>
    </div>
  );
}
