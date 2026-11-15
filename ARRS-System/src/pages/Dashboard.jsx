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
      ["Present Today", "—", "✓"],
      ['Absent Today', '—', '✕'],
      ['Other Today','—', '…'],
      ["Pending Flags", "—", "⚑"],
    ],
    actions: [
      ["Manage Classes", "/trainer/classes"],
      ["Record Attendance", "/trainer/attendance"],
      ["View Students", "/trainer/students"],
      ["View Timetable", "/trainer/timetable"],
      ['Register Student','/trainer/register'],
      ['Attendance Register','/trainer/attendance-register'],
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
      ["Groups", "—", "▦"],
      ["Pending Requests", "—", "⚑"],
    ],
    actions: [
      ["User Management", "/admin/users"],
      ['Register User Account','/admin/register'],
      ["Group Management", "/admin/classes"],
      ["View Attendance", "/admin/attendance"],
      ['Enroll Student','/admin/enrolment'],
      ['View Timetable','/admin/timetable'],
      //["Generate Reports", "/admin/reports"],
    ],
  },
};

export default function Dashboard({ role = "student" }) {
  const BaseData = dashboardData[role] || dashboardData.student;

  //Profile Data constants
  const date = new Date()

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,'0');

  const FDate = `${year}-${month}-${day}`

  const [trainerDash, setTrainerDash] = useState({
    id: null,
    DateT: FDate,
  })

  const [trainerCounts, setTrainerCounts] = useState({
    classes: 0,
    students: 0,
    attandance: 0,
    abesent: 0,
    other: 0,
    flags: 0
  })

  const [DBData, setDBData] = useState(null)
  const [DBLoading, setDBLoading] = useState(true)
  const [DBError, setDBError] = useState(null)

  //Admin Constants
  const [counts, setCounts] = useState({students: 0, faculty: 0, groups: 0, flags: 0})
  const [countsLoading, setCountsLoading] = useState(true);

  const data = role == 'student' && BaseData && DBData
    ? {
      ...BaseData,
      greeting: `Welcome Back, ${DBData.profile.name}`,
      description: `${BaseData.description} -- ${DBData.profile.email}`,
      stats:[
        ["My Classes", `${DBData.classes.length}`, "▦"],
        ["Attendance Rate", "--", "✓"],
        ["Upcoming Class", "--", "◷"],
      ],
    }
    : role == 'admin' && BaseData && DBData ? {
      ...BaseData,
      greeting: `Welcome Back ${DBData.profile.title}, ${DBData.profile.name} ${DBData.profile.surname}`,
      description: `${BaseData.description} -- ${DBData.profile.email}`,
      stats: [
        ["Student Accounts", `${countsLoading ? 'Loading...' : counts.students}`, "♙"],
        ["Staff Accounts", `${countsLoading ? 'Loading...' : counts.faculty}`, "♧"],
        ["Groups", `${countsLoading ? 'Loading...' : counts.groups}`, "▦"],
        ["Pending Requests", `${countsLoading ? 'Loading' : counts.flags}`, "⚑"],
      ],
    } 
    : role == 'trainer' && BaseData && DBData ? {
      ...BaseData,
      greeting: `Welcome Back ${DBData.profile.title}, ${DBData.profile.name} ${DBData.profile.surname}`,
      description: `${BaseData.description} -- ${DBData.profile.email}`,
      stats: [
        ["My Classes", `${countsLoading ? 'Loading...' : trainerCounts.classes}`, "▦"],
        ["Total Students", `${countsLoading ? 'Loading...' : trainerCounts.students}`, "♙"],
        ["Present Today", `${countsLoading ? 'Loading...' : trainerCounts.attandance}`, "✓"],
        ['Absent Today', `${countsLoading ? 'Loading...' : trainerCounts.abesent}`, '✕'],
        ['Other Today', `${countsLoading ? 'Loading...' : trainerCounts.other}`, '…'],
        ["Pending Flags", `${countsLoading ? 'Loading...' : trainerCounts.flags}`, "⚑"],
      ],
    }
    : BaseData;
    
  const loadStudentData = async() => {
    setDBLoading(true)
    setDBError(null)

    try{
      const {data: {user}, error: userError} = 
      await supabase.auth.getUser();

      if(userError) throw userError
      if(!user) throw new Error('Please sign in to view your dashboard')

      const {data: attendence, error: attendenceError} = await supabase
        .from('student_profiles')
        .select('name, student_nr, email')
        .eq('id', user.id)
        .single();

      if(attendenceError) throw attendenceError

      const {data: classes, error: classError} = await supabase.rpc('get_student_classes',{
        p_year: new Date().getFullYear()
      })

      if(classError) throw classError;

      setDBData({
        profile: attendence,
        classes: Array.isArray(classes) ? classes : [],
      });
    }
    catch (err){
      setDBError(err.message)
    }
    finally{
      setDBLoading(false)
    }
  }
    

  const loadFacultyData = async () => {
    setDBLoading(true)
    setDBError(null)

    try{
      const {data: {user}, error: userError} =
      await supabase.auth.getUser();

      if(userError) throw userError
      if(!user) throw new Error('Please sign in to view your dashboard')
      
      setTrainerDash({
        ...trainerDash,
        id: user.id
      })

      const {data: facultyData, error: facultyError} = await supabase
        .from('faculty_profiles')
        .select('name, surname, email, title')
        .eq('id', user.id)
        .single()

      if(facultyError) throw facultyError

      setDBData({
        profile: facultyData,
      })
    }
    catch(err){
      setDBError(err.message)
    }
    finally {
      setDBLoading(false)
    }
  }

  useEffect(() => {
    if(role == 'student'){
      loadStudentData();
    }
    else {
      loadFacultyData();
    }
  }, []);

  useEffect(() => {
    if(role !== 'trainer' && role !== 'admin') return
    if(!trainerDash.id) return

    async function fetchCounts(){
      try{
        const {data: facultyData, error:facultyError} = await supabase
          .from('profiles')
          .select('*')
          .eq('id', trainerDash.id)
          .single();

        if(facultyError) throw facultyError
        
        const title = facultyData?.role

        if(title === 'admin'){
          const {data, error} = await supabase.rpc('get_user_counts');

          if(error){
            console.error('Error fetching counts:',error);
          }
          else{
            setCounts(data);
          }
        }
        else if(title === 'trainer'){
          try {
            const {data: trainerDashData, error:trainerDashError} = await supabase.rpc('get_trainer_dash_data',{
              trainer_id: trainerDash.id,
              today_date: trainerDash.DateT,
            })

            if(trainerDashError) throw trainerDashError

            setTrainerCounts(trainerDashData)
          }
          catch(err){
            console.error(`Error Counting Trainer Dash: ${err.message}`)
            setDBError(`Trainer Dash ${err.message}`)
          }
        }
      }
      catch(err){
        console.error(`Error Counting: ${err.message}`)
        setDBError(err.message)
      }
      finally {
        setCountsLoading(false);
      }
      
    }
    fetchCounts();
  }, [role, trainerDash.id, trainerDash.DateT])

  {/*
  const [StudentClass, setStudentClass] = useState([])
  const [classLoading, setClassloading] = useState(true)
  const [classError, setClasserror] = useState(null)

  const year = new Date().getFullYear();

  const fetchStudentData = async () => {
    try {
      setClassloading(true)
      setClasserror(null)

      if(!year){
        setClasserror('Something went wrong with the year')
        setClassloading(false)
        return
      }

      const {data, error} = await supabase.rpc('get_student_classes', {
        p_year: year,
      });

      if(error) throw error

      setStudentClass(data || [])
    }
    catch(err){
      console.error('Error fetching description:',err.message)
      setClasserror(err.message)
    }
    finally{
      setClassloading(false)
    }
  }

  useEffect(() => {
    fetchStudentData();
  }, [])

  const fetchTrainerData = async () => {

  }

  const fetchFacultyData = async () => {
    
  }
  */}

  


  if(!data){
    return <p>Dashboard Unavailable</p>
  }

  {DBLoading && <p role='status'>Loading dashboard data...</p>}
  {DBError && <p role='alert'>Unable to load dashboard data: {DBError}</p>}

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
