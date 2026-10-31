import { useState } from "react";
import { Link } from "react-router-dom";
import {supabase} from '../supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true)
    setErrorMessage(null)
    setMessage('')

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage(error.message)
      } else {
        setMessage('Account created. An administrator must assign your account role before you can access the portal.')
        setEmail('')
        setPassword('')
      }
    } catch {
      setErrorMessage('Unable to create your account. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
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
          <span className="eyebrow">JOIN ITCA</span>
          <h1>Create an account</h1>
          <p>Enter your details to begin the registration process.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="registerEmail">Email</label>
          <input
            id="registerEmail"
            type='email'
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User.Example@gmail.com"
            required
          />

          <label htmlFor="registerPassword">Password</label>
          <input
            id="registerPassword"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" className="button button-primary button-full" disabled={loading}>
            {loading ? 'Creating Account...': 'Create Account'}
          </button>
        </form>

        {message && (
          <p className="form-success" role="status">{message}</p>
        )}

        {errorMessage && (
          <p className="form-error" role="alert">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
