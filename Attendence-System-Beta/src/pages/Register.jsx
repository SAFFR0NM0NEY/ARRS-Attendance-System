import { useState } from "react";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    studentNumber: "",
    programme: "Cybersecurity",
    password: ""
  });

  const [message, setMessage] = useState("");

  // Update only the field that the user changes.
  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Demonstration only: no account is actually created.
    setMessage(
      "Demo complete. Real registration will be connected when the authentication service is available."
    );
  }

  return (
    <div className="auth-page">
      <Link to="/" className="brand auth-brand">
        <span className="brand-mark">I</span>
        <span>
          <strong>Information Technology Certification Academy</strong>
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
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <label htmlFor="registerEmail">Email address</label>
          <input
            id="registerEmail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="studentNumber">Student number</label>
          <input
            id="studentNumber"
            name="studentNumber"
            value={form.studentNumber}
            onChange={handleChange}
            placeholder="Enter your student number"
            required
          />

          <label htmlFor="programme">Programme</label>
          <select
            id="programme"
            name="programme"
            value={form.programme}
            onChange={handleChange}
          >
            <option>Cybersecurity</option>
            <option>Software Development</option>
            <option>Specialist Programme</option>
          </select>

          <label htmlFor="registerPassword">Create password</label>
          <input
            id="registerPassword"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" className="button button-primary button-full">
            Submit registration
          </button>
        </form>

        {message && (
          <p className="form-success" role="status">{message}</p>
        )}

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>

        
      </div>
    </div>
  );
}
