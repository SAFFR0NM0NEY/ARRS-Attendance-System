
import { Link } from "react-router-dom";
import itcaLogo from "../assets/itca-logo.png";

export default function Welcome() {
  const today = new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="welcome-page">
      <header className="welcome-nav">
        <Link to="/" className="brand">
          <img src={itcaLogo} alt="ITCA campus logo" />
          <span>
            <b>Information Technology Certification Academy</b>
            <small>Digital Campus</small>
          </span>
        </Link>

        <span className="nav-tag">ATTENDANCE PORTAL</span>
      </header>

      <main className="welcome-hero">
        <section className="welcome-copy">
          <span className="eyebrow">
            ITCA DIGITAL ATTENDANCE REGISTER
          </span>

          <h1>
            Welcome to your <span>digital campus.</span>
          </h1>

          <p className="motto">
            Guiding Futures. Inspiring Potential. Empowering Success.
          </p>

          <p className="welcome-description">
            Access your academic space, check your attendance,
            view timetables and stay connected with your college
            community.
          </p>

          <p className="date-label"> &nbsp; {today}</p>

          <div className="welcome-actions">
            <Link to="/login" className="button button-primary">
              Login to your account <span>→</span>
            </Link>

            <Link to="/check-in" className="button button-light">
              ✓ &nbsp; Log Attendance
            </Link>
          </div>

          <p className="welcome-note">
            Students can submit attendance details without logging
            into their accounts.
          </p>
        </section>

        <section className="welcome-visual">
          <div className="welcome-preview">
            <div className="preview-top">
              <img src={itcaLogo} alt="ITCA logo" />

              <div>
                <b>ITCA</b>
                <small>Digital Campus</small>
              </div>

              <span className="preview-online">
                ● Portal ready
              </span>
            </div>

            <div className="preview-body">
              <span className="preview-label">
                YOUR ACADEMIC SPACE
              </span>

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
              ✓ &nbsp; Your campus. Your progress. One portal.
            </div>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <span>© {new Date().getFullYear()} ITCA Digital Campus</span>
        <span>
          Guiding Futures. Inspiring Potential. Empowering Success.
        </span>
      </footer>
    </div>
  );
}
