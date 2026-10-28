import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import {supabase} from '../supabase.js'
import {useState, useEffect} from 'react'

const dashboardData = {
  student: {
    title: "Student Dashboard",
    greeting: "Welcome back, Student!",
    description: "Here is an overview of your academic activity.",
    stats: [
      ["My Classes", "--", "▦"],
      ["Attendance Rate", "--", "✓"],
      ["Upcoming Class", "--", "◷"],
    ],
    actions: [
       ["Log Attendance", "/check-in"],
       ["My Attendance", "/student/attendance"],
       ["View Timetable", "/student/timetable"],
       ["My Enrolment", "/student/enrolment"],
       //["View Reports", "/student/reports"],
       //["Notifications", "/student/notifications"],
       ["My Profile", "/student/profile"],
       //["Settings", "/student/settings"],
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
      ['Register User Account','/admin/register']
      ["Manage Classes", "/admin/classes"],
      ["View Attendance", "/admin/attendance"],
      ["Generate Reports", "/admin/reports"],
    ],
  },
};

export default function Dashboard({ role = "student" }) {
  const BaseData = dashboardData[role] || dashboardData.student;

  const [DBData, setDBData] = useState(null)
  const [DBLoading, setDBLoading] = useState(true)
  const [DBError, setDBError] = useState(null)

  const data = BaseData && DBData
    ? {
      ...BaseData,
      title: `Dashboard`,
      description: `${BaseData.description} -- ${DBData.email}`,
    }
    : BaseData;

  const loadStudentData = async() => {
    setDBLoading(true)
    setDBError(null)

    const {data: {user}, error: userError} = 
      await supabase.auth.getUser();

      if(userError || !user){
        setDBError(userError?.message ?? 'Please sign in to view your dashboard.')
        setDBLoading(false)
        return;
      }

      const {data: attendence, error: attendenceError} = await supabase
        .from('student_profiles')
        .select('name, student_nr, email')
        .eq('id', user.id)
        .single();

      if(attendenceError){
        setDBError(attendenceError.message);
        setDBLoading(false)
        return;
      }

      setDBData(attendence)


      setDBLoading(false)
  }

  const loadFacultyData = async () => {
    setDBLoading(true)
    setDBError(null)

    const {data: {user}, error: userError} =
      await supabase.auth.getUser();

    if(userError || !user){
      setDBError(userError?.message ?? 'Please sign in to view dashboard')
      setDBLoading(false)
      return;
    }

    const {data: facultyData, error: facultyError} = await supabase
      .from('faculty_profiles')
      .select('name, email, title')
      .eq('id', user.id)
      .single()

    if(facultyError){
      setDBError(facultyError.message)
      setDBLoading(false)
    }

    setDBData(facultyData)
    setDBLoading(false)
  }

  const fetchStudentData = async () => {

  }

  const fetchTrainerData = async () => {

  }

  const fetchFacultyData = async () => {
    
  }

  useEffect(() => {
    if(role == 'student'){
      loadStudentData();
    }
    else {
      loadFacultyData();
    }
  }, []);


  {DBLoading && <p>Loading Data...</p>}
  {DBError && <p>Something Went Wrong</p>}

  if(!data){
    return <p>Dashboard Unavailable</p>
  }

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
            Check your timetable, keep an eye on your attendence, and assure your
            details are correct.
          </p>
          {/*
          <Link className="text-link" to={`/${role}/notifications`}>
            View notifications →
          </Link>
          */}
        </article>
      </section>
    </Layout>
  );
}
