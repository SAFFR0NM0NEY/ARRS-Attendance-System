import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {supabase} from '../supabase'

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true)
    setError(null);

    const {data: authData, error:authError} = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if(authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user.id

    const {data: account, error:accountError} = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if(accountError || !account){
      setError('Login successful, but could not load account role.')
      setLoading(false)
      return
    }

    // Return to the requested page only if it belongs to this role.
    const requestedPath = location.state?.from?.pathname;
    const safeDefault = `/${account.role}/dashboard`;

    const safeDestination =
      requestedPath?.startsWith(`/${account.role}/`) &&
      !requestedPath.includes("..")
        ? requestedPath
        : safeDefault;

    // A check-in request can continue to the check-in interface.
    const queryNext = new URLSearchParams(location.search).get("next");
    const destination =
      queryNext === "/check-in" ? `/${account.role}/check-in` : safeDestination;

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

        <form className='input-grid' onSubmit={handleSubmit}>
          <label className='full-field' htmlFor="email">
            Email address
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className='full-field' htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              autoComplete="off"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" className="button button-primary button-full full-field" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'} <span aria-hidden="true">→</span>
          </button>

          {error && <p className="form-error" role="alert">{error}</p>}
        </form>

        <p className="auth-switch">
          Don't have an account? Contact Your Trainer
        </p>
      </div>

      <Link to="/" className="back-home">← Back to welcome page</Link>
    </div>
  );
}