
import { NavLink, Link, useNavigate } from "react-router-dom";
import itcaLogo from '../assets/itca-logo.png';
import {useState, useEffect} from 'react'
import {supabase} from '../supabase'

const navigation = {
  student: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "My Attendance", path: "attendance", icon: "✓" },
    { label: "Timetable", path: "timetable", icon: "▦" },
    { label: "My Enrolment", path: "enrolment", icon: "▤" },
    //{ label: "Reports", path: "reports", icon: "▥" },
    //{ label: "Notifications", path: "notifications", icon: "♧" },
    { label: "My Profile", path: "profile", icon: "◉" },
    //{ label: "Settings", path: "settings", icon: "⚙" },
  ],
  trainer: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "My Classes", path: "classes", icon: "▦" },
    { label: "Attendance", path: "attendance", icon: "✓" },
    { label: "Students", path: "students", icon: "♙" },
    { label: "Timetable", path: "timetable", icon: "▤" },
    //{ label: "Reports", path: "reports", icon: "▥" },
    //{ label: "Notifications", path: "notifications", icon: "♧" },
    //{ label: "Settings", path: "settings", icon: "⚙" },
  ],
  faculty: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "Enrolments", path: "enrolment", icon: "▤" },
    { label: "Timetable", path: "timetable", icon: "▦" },
    //{ label: "Reports", path: "reports", icon: "▥" },
    //{ label: "Notifications", path: "notifications", icon: "♧" },
    { label: "My Profile", path: "profile", icon: "◉" },
    //{ label: "Settings", path: "settings", icon: "⚙" },
  ],
  admin: [
    { label: "Dashboard", path: "dashboard", icon: "⌂" },
    { label: "User Management", path: "users", icon: "♙" },
    { label: 'Register User', path: 'register', icon: '▦'},
    { label: "Classes & Modules", path: "classes", icon: "▦" },
    { label: "Attendance", path: "attendance", icon: "✓" },
    { label: "Timetable", path: "timetable", icon: "▤" },
    { label: "Enrolments", path: "enrolment", icon: "▧" },
    //{ label: "Reports", path: "reports", icon: "▥" },
    //{ label: "Notifications", path: "notifications", icon: "♧" },
    //{ label: "Settings", path: "settings", icon: "⚙" },
  ],
};

function formatRole(role = "student") {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Layout({ role = "student", children, title }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userLoading, setLoading] = useState(false)
  const [userError, setError] = useState(null)

  const links = navigation[role] || navigation.student;

  const loadStudent = async() => {
    setLoading(true)
    setError(null)

    const {data: {user}, error: userError} =
      await supabase.auth.getUser();

      if(userError || !user){
        setError(userError?.message ?? 'Please sign in')
        setLoading(false)
        return;
      }

      const {data: student, error: studentError} = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if(studentError){
        setError(studentError.message);
        setLoading(false)
        return;
      }

      setUser(student)
      setLoading(false)
  }

  const loadFaculty = async() => {
    setLoading(true)
    setError(null)

    const {data: {user}, error: userError} = 
      await supabase.auth.getUser();

      if(userError || !user){
        setError(userError?.message || 'Please sign in')
        setLoading(false)
        return;
      }

      const {data: faculty, error: facultyError} = await supabase
        .from('faculty_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if(facultyError){
        setError(facultyError.message)
        return;
      }

      setUser(faculty)
      setLoading(false)
  }

  useEffect(() => {
    if(role == 'student'){
      loadStudent();
    }
    else {
      loadFaculty();
    }
  }, [])

  const logout = async() => {
    await supabase.auth.signOut();
    navigate('/', {replace: true});
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

            {userLoading
            ? (
                <span className='user-details'>
                  <strong>Loading...</strong>
                </span>
              ) : (
                <span className="user-details">
                  <strong>{user?.name + ' ' + user?.surname|| `${formatRole(role)} User`}</strong>
                  {role == 'faculty' ?
                  (
                    <small>{user?.title}</small>
                  ) : (
                    <small>{formatRole(role)}</small>
                  )}
                  
                </span>
              )}
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
            <h1 className="topbar-title">
              {userLoading ?
              (
                'Loading...'
              ) :
              (
                user?.name + '\'s ' + title || "Dashboard"
              )}
              
            </h1>
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
