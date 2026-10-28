
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";

const dashboardData = {
  student: {
    title: "Student Dashboard",
    greeting: "Welcome back, Student!",
    description: "Here is an overview of your academic activity.",
    stats: [
      ["My Classes", "0", "▦"],
      ["Attendance Rate", "0%", "✓"],
      ["Upcoming Classes", "0", "◷"],
    ],
    actions: [
       ["Log Attendance", "/check-in"],
       ["My Attendance", "/student/attendance"],
       ["View Timetable", "/student/timetable"],
       ["My Enrolment", "/student/enrolment"],
       ["View Reports", "/student/reports"],
       ["Notifications", "/student/notifications"],
       ["My Profile", "/student/profile"],
       ["Settings", "/student/settings"],
    ],
  },
  trainer: {
    title: "Trainer Dashboard",
    greeting: "Good morning, Trainer!",
    description: "Manage classes and monitor attendance.",
    stats: [
      ["My Classes", "0", "▦"],
      ["Total Students", "0", "♙"],
      ["Attendance Today", "—", "✓"],
      ["Pending Flags", "—", "⚑"],
    ],
    actions: [
      ["Manage Classes", "/trainer/classes"],
      ["Record Attendance", "/trainer/attendance"],
      ["View Students", "/trainer/students"],
      ["View Timetable", "/trainer/timetable"],
    ],
  },
  faculty: {
    title: "Faculty Dashboard",
    greeting: "Welcome to Faculty Services!",
    description: "Review academic information and enrolment activity.",
    stats: [
      ["Enrolment Requests", "—", "▤"],
      ["Programmes", "—", "▦"],
      ["Reports", "Available", "▥"],
    ],
    actions: [
      ["Review Enrolments", "/faculty/enrolment"],
      ["View Timetable", "/faculty/timetable"],
      ["View Reports", "/faculty/reports"],
      ["My Profile", "/faculty/profile"],
    ],
  },
  admin: {
    title: "Admin Dashboard",
    greeting: "Welcome, Administrator!",
    description: "Manage users, classes and campus attendance settings.",
    stats: [
      ["Student Accounts", "—", "♙"],
      ["Staff Accounts", "—", "♧"],
      ["Classes & Modules", "—", "▦"],
      ["Pending Requests", "—", "⚑"],
    ],
    actions: [
      ["User Management", "/admin/users"],
      ["Manage Classes", "/admin/classes"],
      ["View Attendance", "/admin/attendance"],
      ["Generate Reports", "/admin/reports"],
    ],
  },
};

export default function Dashboard({ role = "student" }) {
  const data = dashboardData[role] || dashboardData.student;

  return (
    <Layout role={role} title={data.title}>
      <section className="page-heading">
        <div>
          <span className="eyebrow">YOUR ITCA WORKSPACE</span>
          <h2>{data.greeting}</h2>
          <p>{data.description}</p>
        </div>

        <span className="date-chip">
          {new Date().toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </section>

      <section className="stats-grid" aria-label="Dashboard summary">
        {data.stats.map(([label, value, icon], index) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon stat-icon-${(index % 4) + 1}`}>
              {icon}
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-lower-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Open a section to continue.</p>
            </div>
          </div>

          <div className="quick-action-grid">
            {data.actions.map(([label, path]) => (
              <Link className="quick-action" to={path} key={label}>
                <span>{label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="content-card dashboard-message">
          <span className="message-icon">✦</span>
          <h3>Stay connected</h3>
          <p>
            Check your timetable, review notifications and keep
            your academic information up to date.
          </p>
          <Link className="text-link" to={`/${role}/notifications`}>
            View notifications →
          </Link>
        </article>
      </section>
    </Layout>
  );
}
