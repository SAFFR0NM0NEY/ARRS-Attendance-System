import { Link, useLocation } from "react-router-dom";
import Layout from './Layout';
import {useState, useEffect} from 'react'
import {supabase} from '../supabase'
import Faculty_Dashboard from '../pages/faculty_dashboard'


const dashboardData = {
  student: {
    title: "My Dashboard",
    subtitle: "Your academic progress at a glance.",
    stats: [
      { label: "Attendance rate", value: "92%", note: "Sample figure" },
      { label: "Registered modules", value: "6", note: "Sample figure" },
      { label: "Upcoming classes", value: "3", note: "This week" },
      { label: "Notifications", value: "2", note: "Unread demo alerts" }
    ],
    heading: "Your upcoming classes",
    rows: [
      ["Cybersecurity Fundamentals", "09:00", "Computer Lab", "Scheduled"],
      ["Software Development", "11:00", "Room 204", "Scheduled"],
      ["Network Security Practical", "13:00", "Computer Lab", "Scheduled"]
    ],
    columns: ["Module", "Start time", "Venue", "Status"]
  },
  trainer: {
    title: "Trainer Dashboard",
    subtitle: "Manage your assigned classes and attendance.",
    stats: [
      { label: "Assigned classes", value: "4", note: "Sample figure" },
      { label: "Students enrolled", value: "86", note: "Sample figure" },
      { label: "Sessions today", value: "3", note: "Sample figure" },
      { label: "Reports to review", value: "2", note: "Sample figure" }
    ],
    heading: "Today's classes",
    rows: [
      ["Cybersecurity Fundamentals", "09:00", "Computer Lab", "Scheduled"],
      ["Network Security", "11:00", "Room 204", "Scheduled"],
      ["Software Development", "13:00", "Room 105", "Scheduled"]
    ],
    columns: ["Class", "Start time", "Venue", "Status"]
  },
  faculty: {
    title: "Faculty Dashboard",
    subtitle: "Review authorised academic activity and performance.",
    stats: [
      { label: "Programmes", value: "3", note: "Sample figure" },
      { label: "Class groups", value: "12", note: "Sample figure" },
      { label: "Attendance average", value: "88%", note: "Sample figure" },
      { label: "Reports", value: "5", note: "Sample figure" }
    ],
    heading: "Academic overview",
    rows: [
      ["Cybersecurity", "6", "89%", "Active"],
      ["Software Development", "4", "87%", "Active"],
      ["Specialist Programme", "2", "90%", "Active"]
    ],
    columns: ["Programme", "Class groups", "Attendance", "Status"]
  },
  admin: {
    title: "Admin Dashboard",
    subtitle: "Manage ITCA's academic portal and system activity.",
    stats: [
      { label: "Student accounts", value: "450", note: "Sample figure" },
      { label: "Staff accounts", value: "28", note: "Sample figure" },
      { label: "Active programmes", value: "3", note: "Sample figure" },
      { label: "Pending reviews", value: "7", note: "Sample figure" }
    ],
    heading: "Programme overview",
    rows: [
      ["Cybersecurity", "Active", "Student enrolment", "View"],
      ["Software Development", "Active", "Student enrolment", "View"],
      ["Specialist Programme", "Active", "Student enrolment", "View"]
    ],
    columns: ["Programme", "Status", "Management", "Action"]
  }
};

// These labels help the prototype display a different title for each page.
const pageTitles = {
  attendance: "Attendance",
  timetable: "Timetable",
  enrolment: "Enrolment Management",
  reports: "Reports and Analytics",
  notifications: "Notifications",
  profile: "My Profile",
  settings: "Settings",
  classes: "My Classes",
  programmes: "Programmes and Class Groups",
  users: "User Management",
  "check-in": "Attendance Check-in"
};

export default function Dashboard({ role }) {
  const location = useLocation();
  const data = dashboardData[role];

  const [DB_Data, setDB_Data] = useState(null)
  const [DB_Loading, setDB_Loading] = useState(true)
  const [DB_Error, setDB_Error] = useState(null)

  useEffect(() => {
    async function loadDashboard() {
      setDB_Loading(true);
      setDB_Error(null);

      const {data: {user}, error: userError} =
        await supabase.auth.getUser();

      if (userError || !user){
        setDB_Error(userError?.message ?? 'Please sign in to view your dashboard.')
        setDB_Loading(false)
        return;
      }
      
    }
  })

  // Determine which page the user opened from the URL.
  const lastSegment = location.pathname.split("/").filter(Boolean).pop();
  const isDashboard = lastSegment === "dashboard" || !lastSegment;
  const pageTitle = pageTitles[lastSegment];

  // Prevent invalid role configuration from breaking the page.
  if (!data) {
    return <p>Dashboard configuration unavailable.</p>;
  }

  return (
    <Layout role={role}>
      {isDashboard ? (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">OVERVIEW</span>
              <h1>{data.title}</h1>
              <p>{data.subtitle}</p>
            </div>
            <span className="date-chip">
              {new Intl.DateTimeFormat("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }).format(new Date())}
            </span>
          </div>

          {/* Summary cards show role-specific sample statistics. */}
          <section className="stats-grid">
            {data.stats.map((stat, index) => (
              <article className="stat-card" key={stat.label}>
                <div className={`stat-icon stat-icon-${index + 1}`}>
                  {["◷", "▦", "✓", "♧"][index]}
                </div>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </article>
            ))}
          </section>

          <section className="content-card">
            <div className="card-heading">
              <div>
                <h2>{data.heading}</h2>
                <p>Example information for the interface preview.</p>
              </div>
              <Link
                to={`/${role}/${role === "student" ? "timetable" : "classes"}`}
                className="text-link"
              >
                View details →
              </Link>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {data.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`}>
                          {cellIndex === row.length - 1 ? (
                            <span className="status-pill">{cell}</span>
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="quick-actions">
            <h2>Quick access</h2>
            <div className="quick-action-grid">
              <Link to={`/${role}/attendance`} className="quick-action">
                <span>✓</span>
                <strong>Attendance</strong>
                <small>Open attendance records</small>
              </Link>
              <Link to={`/${role}/timetable`} className="quick-action">
                <span>▦</span>
                <strong>Timetable</strong>
                <small>View scheduled activities</small>
              </Link>
              <Link to={`/${role}/reports`} className="quick-action">
                <span>▥</span>
                <strong>Reports</strong>
                <small>Review available reports</small>
              </Link>
            </div>
          </section>
        </>
      ) : (
        // This placeholder allows the shared navigation to be tested.
        // We will replace each placeholder with its real page in later stages.
        <section className="content-card placeholder-page">
          <span className="eyebrow">{role.toUpperCase()} PORTAL</span>
          <h1>{pageTitle || "Page preview"}</h1>
          <Faculty_Dashboard />
          <Link to={`/${role}/dashboard`} className="button button-primary">
            Return to dashboard
          </Link>
        </section>
      )}
    </Layout>
  );
}
