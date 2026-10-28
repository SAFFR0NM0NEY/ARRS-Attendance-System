
import { useState } from "react";
import { Link } from "react-router-dom";
import itcaLogo from "../assets/itca-logo.png";

export default function CheckIn() {
  // Store only the two values required to log attendance.
  const [form, setForm] = useState({
    studentNumber: "",
    passcode: "",
  });

  // Store feedback returned by the attendance process.
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update the relevant input when the student types.
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear previous feedback when the student edits their details.
    setMessage("");
  }

  // Submit the attendance credentials.
  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      /*
       * BACKEND INTEGRATION:
       * Replace the placeholder URL with the API endpoint
       * provided by your backend teammate.
       *
       * The backend must validate the student number and
       * passcode before recording attendance.
       */
      const response = await fetch(
        "/api/attendance/check-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentNumber: form.studentNumber.trim(),
            passcode: form.passcode.trim(),
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Attendance could not be verified. Check your details and try again."
        );
      }

      setMessage(
        result.message || "Your attendance has been recorded successfully."
      );
      setMessageType("success");

      // Clear the inputs after a successful response.
      setForm({
        studentNumber: "",
        passcode: "",
      });
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to connect to the attendance service. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkin-page">
      <header className="simple-header">
        <Link to="/" className="brand">
          <img src={itcaLogo} alt="ITCA campus logo" />
          <span>
            <b>Information Technology Certification Academy</b>
            <small>Digital Campus</small>
          </span>
        </Link>

        <Link to="/login" className="button button-quiet">
          Staff login
        </Link>
      </header>

      <main className="checkin-layout">
        <section className="checkin-intro">
          <span className="eyebrow">ITCA DIGITAL CAMPUS</span>

          <h1>Log your attendance</h1>

          <p>
            Enter your student number and the attendance
            passcode provided to you to verify your attendance.
          </p>

          <div className="info-panel">
            <strong>Before submitting</strong>
            <p>
              Ensure your student number is correct and use
              the valid passcode issued for your class.
            </p>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-heading">
            <div>
              <h2>Attendance verification</h2>
              <p>Enter both required details.</p>
            </div>

            <img src={itcaLogo} alt="ITCA logo" />
          </div>

          <form className="input-grid" onSubmit={handleSubmit}>
            <label className="full-field">
              Student number *
              <input
                type="text"
                name="studentNumber"
                value={form.studentNumber}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Enter your student number"
              />
            </label>

            <label className="full-field">
              Attendance passcode *
              <input
                type="password"
                name="passcode"
                value={form.passcode}
                onChange={handleChange}
                required
                autoComplete="off"
                placeholder="Enter your attendance passcode"
              />
            </label>

            <button
              className="button button-primary button-full full-field"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Verifying attendance..."
                : "Log attendance →"}
            </button>

            {message && (
              <p
                className={`full-field ${
                  messageType === "success"
                    ? "success-message"
                    : "error-message"
                }`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}
          </form>

          <p className="welcome-note">
            Your attendance details will be verified by the
            attendance service.
          </p>
        </section>
      </main>

      <footer className="welcome-footer">
        <span>
          © {new Date().getFullYear()} ITCA Digital Campus
        </span>
        <span>
          Guiding Futures. Inspiring Potential. Empowering Success.
        </span>
      </footer>
    </div>
  );
}
