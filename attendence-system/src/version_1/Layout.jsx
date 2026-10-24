import { NavLink, useNavigate } from "react-router-dom";
import {supabase} from '../supabase'

// Each role receives its own navigation menu.
const navigation = {
  student: [
    { label: "Overview", path: "/student/dashboard", icon: "⌂" },
    { label: "My Attendance", path: "/student/attendance", icon: "✓" },
    { label: "My Timetable", path: "/student/timetable", icon: "▦" },
    { label: "My Enrolment", path: "/student/enrolment", icon: "▤" },
    { label: "Reports", path: "/student/reports", icon: "▥" },
    { label: "Notifications", path: "/student/notifications", icon: "♧" },
    { label: "My Profile", path: "/student/profile", icon: "○" },
    { label: "Settings", path: "/student/settings", icon: "⚙" }
  ],
  trainer: [
    { label: "Overview", path: "/trainer/dashboard", icon: "⌂" },
    { label: "Attendance Register", path: "/trainer/attendance", icon: "✓" },
    { label: "My Classes", path: "/trainer/classes", icon: "▤" },
    { label: "Class Timetables", path: "/trainer/timetable", icon: "▦" },
    { label: "Reports", path: "/trainer/reports", icon: "▥" },
    { label: "Notifications", path: "/trainer/notifications", icon: "♧" },
    { label: "My Profile", path: "/trainer/profile", icon: "○" }
  ],
  faculty: [
    { label: "Overview", path: "/faculty/dashboard", icon: "⌂" },
    { label: "Programmes", path: "/faculty/programmes", icon: "▤" },
    { label: "Timetables", path: "/faculty/timetable", icon: "▦" },
    { label: "Attendance Reports", path: "/faculty/reports", icon: "▥" },
    { label: "Notifications", path: "/faculty/notifications", icon: "♧" },
    { label: "My Profile", path: "/faculty/profile", icon: "○" }
  ],
  admin: [
    { label: "Overview", path: "/admin/dashboard", icon: "⌂" },
    { label: "User Management", path: "/admin/users", icon: "♙" },
    { label: "Enrolment", path: "/admin/enrolment", icon: "▤" },
    { label: "Programmes & Classes", path: "/admin/programmes", icon: "▦" },
    { label: "Timetable Manager", path: "/admin/timetable", icon: "▦" },
    { label: "Attendance", path: "/admin/attendance", icon: "✓" },
    { label: "Reports", path: "/admin/reports", icon: "▥" },
    { label: "Notifications", path: "/admin/notifications", icon: "♧" },
    { label: "System Settings", path: "/admin/settings", icon: "⚙" }
  ]
};

const roleLabels = {
  student: "Student Portal",
  trainer: "Trainer Portal",
  faculty: "Faculty Portal",
  admin: "Administration Portal"
};

export default function Layout({ role, children }) {
  const navigate = useNavigate();
  const menu = navigation[role] || [];

  const logout = async() => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      {/* Sidebar links change according to the current role. */}
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">I</span>
          <span>
            <strong>ITCA</strong>
            <small>Attendance Register</small>
          </span>
        </NavLink>

        <p className="sidebar-label">{roleLabels[role]}</p>

        <nav className="side-nav">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}/dashboard`}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p>Guiding Futures.<br />Inspiring Potential.<br />Empowering Success.</p>
          <button className="logout-button" onClick={logout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div>
            <span className="eyebrow">ITCA DIGITAL CAMPUS</span>
            <p className="topbar-title">{roleLabels[role]}</p>
          </div>

          {/* These are front-end notification/profile shortcuts. */}
          <div className="topbar-actions">
            <NavLink
              to={`/${role}/notifications`}
              className="icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              ♧ <span className="notification-dot" />
            </NavLink>

            <NavLink
              to={`/${role}/profile`}
              className="avatar"
              aria-label="My profile"
              title="My profile"
            >
              {role.charAt(0).toUpperCase()}
            </NavLink>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
