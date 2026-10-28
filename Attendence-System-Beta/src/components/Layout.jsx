
import { NavLink, Link, useNavigate } from "react-router-dom";
import itcaLogo from "../assets/itca-logo.png";

const navigation = {
  student: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "My Attendance", path: "attendance", icon: "✓" },
    { label: "Timetable", path: "timetable", icon: "▦" },
    { label: "My Enrolment", path: "enrolment", icon: "▤" },
    { label: "Reports", path: "reports", icon: "▥" },
    { label: "Notifications", path: "notifications", icon: "♧" },
    { label: "My Profile", path: "profile", icon: "◉" },
    { label: "Settings", path: "settings", icon: "⚙" },
  ],
  trainer: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "My Classes", path: "classes", icon: "▦" },
    { label: "Attendance", path: "attendance", icon: "✓" },
    { label: "Students", path: "students", icon: "♙" },
    { label: "Timetable", path: "timetable", icon: "▤" },
    { label: "Reports", path: "reports", icon: "▥" },
    { label: "Notifications", path: "notifications", icon: "♧" },
    { label: "Settings", path: "settings", icon: "⚙" },
  ],
  faculty: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "Enrolments", path: "enrolment", icon: "▤" },
    { label: "Timetable", path: "timetable", icon: "▦" },
    { label: "Reports", path: "reports", icon: "▥" },
    { label: "Notifications", path: "notifications", icon: "♧" },
    { label: "My Profile", path: "profile", icon: "◉" },
    { label: "Settings", path: "settings", icon: "⚙" },
  ],
  admin: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "User Management", path: "users", icon: "♙" },
    { label: "Classes & Modules", path: "classes", icon: "▦" },
    { label: "Attendance", path: "attendance", icon: "✓" },
    { label: "Timetable", path: "timetable", icon: "▤" },
    { label: "Enrolments", path: "enrolment", icon: "▧" },
    { label: "Reports", path: "reports", icon: "▥" },
    { label: "Notifications", path: "notifications", icon: "♧" },
    { label: "Settings", path: "settings", icon: "⚙" },
  ],
};

function formatRole(role = "student") {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Layout({ role = "student", children, title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("itcaUser") || "null");
  const links = navigation[role] || navigation.student;

  function logout() {
    localStorage.removeItem("itcaUser");
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Link to={`/${role}/dashboard`} className="sidebar-brand">
          <img src={itcaLogo} alt="ITCA campus logo" />
          <span>
            <strong>ITCA</strong>
            <small>Digital Campus</small>
          </span>
        </Link>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={`/${role}/${item.path}`}
              end={item.path === "dashboard"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="user-avatar">
              {(user?.name || formatRole(role)).charAt(0).toUpperCase()}
            </span>
            <span className="user-details">
              <strong>{user?.name || `${formatRole(role)} User`}</strong>
              <small>{formatRole(role)}</small>
            </span>
          </div>

          <button className="logout-button" onClick={logout}>
            ↪ &nbsp; Log out
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div>
            <p className="topbar-kicker">ITCA DIGITAL CAMPUS</p>
            <h1 className="topbar-title">{title || "Dashboard"}</h1>
          </div>

          <div className="topbar-actions">
            <span className="role-chip">{formatRole(role)}</span>
            <Link
              className="topbar-profile"
              to={`/${role}/profile`}
              aria-label="Open profile"
            >
              ◉
            </Link>
          </div>
        </header>

        <main className="page-content">{children}</main>

        <footer className="dashboard-footer">
          Guiding Futures. Inspiring Potential. Empowering Success.
        </footer>
      </div>
    </div>
  );
}
