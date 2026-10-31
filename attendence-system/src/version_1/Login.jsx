import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from '../supabase';
import { isAppRole } from './roles';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Sign-in did not return a user. Please try again.');
        return;
      }

      const { data: account, error: accountError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (accountError || !isAppRole(account?.role)) {
        const { error: signOutError } = await supabase.auth.signOut();
        setError(
          signOutError
            ? 'Your account access could not be verified. Sign out from this device and contact an administrator.'
            : 'Your account access could not be verified. Contact an administrator.',
        );
        return;
      }

      const requestedPath = location.state?.from?.pathname;
      const safeDefault = `/${account.role}/dashboard`;

      const safeDestination =
        typeof requestedPath === 'string' &&
        requestedPath.startsWith(`/${account.role}/`) &&
        !requestedPath.includes('..') &&
        !requestedPath.includes('\\')
          ? requestedPath
          : safeDefault;

      const queryNext = new URLSearchParams(location.search).get("next");
      const destination =
        queryNext === "/check-in" ? `/${account.role}/check-in` : safeDestination;

      navigate(destination, { replace: true });
    } catch {
      setError('Unable to complete sign-in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

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

          {error && <p className="form-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="button button-primary button-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : (
              <>
                Sign in <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

      </div>

      <Link to="/" className="back-home">← Back to welcome page</Link>
    </div>
  );
}
