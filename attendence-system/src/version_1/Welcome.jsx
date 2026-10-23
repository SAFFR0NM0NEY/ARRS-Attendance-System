
import { Link } from "react-router-dom"
import itcaLogo from "../assets/itca-logo.png";


export default function Welcome() {
  // Format the current date for display on the welcome page.
  const today = new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div className="welcome-page">
      <header className="welcome-nav">
        <Link to="/" className="brand welcome-brand">
          <span className="brand-mark">
            <img
            src={itcaLogo}
            alt="ITCA College Logo"
            className="welcome-logo"
            />
          </span>

          <span>
            <strong>ITCA</strong>
            <small>Digital Campus</small>
          </span>
        </Link>

        <Link to="/login" className="nav-login">
          Login <span aria-hidden="true">→</span>
        </Link>
      </header>

      <main className="welcome-hero">
        <div className="welcome-copy">
          <span className="eyebrow">ITCA DIGITAL ATTENDANCE REGISTER</span>

          <h1>Welcome to your <span>digital campus.</span></h1>

          <p className="motto">
            Guiding Futures. Inspiring Potential. Empowering Success.
          </p>

          <p className="welcome-description">
            Access your academic dashboard, check your attendance,
            view timetables and stay informed about your classes.
          </p>

          <p className="date-label">{today}</p>

          <div className="welcome-actions">
            <Link to="/login" className="button button-primary">
              Login to your account
            </Link>

            <Link to="/register" className="button button-secondary">
              Create an account
            </Link>
          </div>

          {/* This link is the alternative when scanning a QR code fails. */}
          <div className="alternative-access">
            <span className="alternative-icon" aria-hidden="true">⌁</span>
            <p>
              Having trouble scanning the classroom QR code?
              <br />
              <Link to="/check-in">Open the attendance page directly</Link>
            </p>
          </div>
        </div>

        <div className="welcome-visual" aria-label="ITCA attendance portal preview">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />

          <div className="welcome-preview">
            <div className="preview-top">
              <span className="preview-logo">I</span>
              <span>ITCA PORTAL</span>
              <span className="preview-online">● Online</span>
            </div>

            <div className="preview-body">
              <span className="preview-label">YOUR ACADEMIC SPACE</span>
              <h2>Everything you need, in one place.</h2>

              <div className="preview-stat-grid">
                <div className="preview-stat">
                  <span>Attendance</span>
                  <strong>Track it</strong>
                </div>
                <div className="preview-stat">
                  <span>Timetable</span>
                  <strong>View it</strong>
                </div>
                <div className="preview-stat">
                  <span>Notifications</span>
                  <strong>Stay informed</strong>
                </div>
                <div className="preview-stat">
                  <span>Reports</span>
                  <strong>Review them</strong>
                </div>
              </div>
            </div>

            <div className="preview-footer">
              <span className="preview-check">✓</span>
              Your campus. Your progress. One portal.
            </div>
          </div>
        </div>
      </main>

      <footer className="welcome-footer">
        <span>© {new Date().getFullYear()} ITCA</span>
        <span>Guiding Futures. Inspiring Potential. Empowering Success.</span>
      </footer>
    </div>
  );
}
