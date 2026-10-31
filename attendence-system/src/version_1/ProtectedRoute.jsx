import { Navigate, useLocation } from "react-router-dom";
import {useState, useEffect} from 'react'
import {supabase} from '../supabase'
import { isAppRole } from './roles'

// Protect pages that should only be visible to particular roles.
export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accountLoading, setAccountLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [accountError, setAccountError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return;

        if (error) {
          setAuthError(error.message);
        } else {
          setAuthError(null);
          setSession(session);
        }

        setAuthLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setAuthError('Unable to verify your sign-in. Check your connection and retry.');
        setAuthLoading(false);
      });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthError(null)
      setAccountError(null)
      setAuthLoading(false)
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [retryCount])

  useEffect(() => {
    let active = true;

    if(!session){
      setRole(null)
      setAccountError(null)
      setAccountLoading(false);
      return () => {
        active = false
      }
    }

    async function loadRole() {
      setAccountLoading(true)
      setAccountError(null)

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setRole(null)
          setAccountError('Your account access could not be verified. Please retry or contact an administrator.')
        } else if (!isAppRole(profile?.role)) {
          setRole(null)
          setAccountError('No valid role is assigned to this account. Contact an administrator.')
        } else {
          setRole(profile.role)
        }

        setAccountLoading(false)
      } catch {
        if (!active) return;
        setRole(null)
        setAccountError('Unable to verify your account access. Check your connection and retry.')
        setAccountLoading(false)
      }
    }

    loadRole();

    return () => {
      active = false;
    }
  }, [session, retryCount])

  if(authLoading || (session && accountLoading)){
    return (
      <main className="auth-page">
        <section className="auth-card" aria-live="polite">
          <p>Verifying your account access…</p>
        </section>
      </main>
    )
  }

  if(authError){
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="form-error" role="alert">{authError}</p>
          <button
            className="button button-primary"
            onClick={() => {
              setAuthLoading(true)
              setRetryCount((count) => count + 1)
            }}
          >
            Retry
          </button>
        </section>
      </main>
    )
  }
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

  if(accountError){
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="form-error" role="alert">{accountError}</p>
          <button
            className="button button-primary"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Retry
          </button>
        </section>
      </main>
    )
  }

  if (!role) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="form-error" role="alert">
            No valid role is assigned to this account. Contact an administrator.
          </p>
        </section>
      </main>
    )
  }

  // If the user's role is not allowed, send them to their own dashboard.
  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  // Render the requested page only if the role is permitted.
  return children;
}
