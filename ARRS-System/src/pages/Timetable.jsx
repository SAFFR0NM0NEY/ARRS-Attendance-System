
import { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout.jsx";
import { supabase } from "../supabase.js";

const isWeekDay = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6
}

const getWeekDayRange = (baseDate = new Date()) => {
  const start = new Date(baseDate);
  while (!isWeekDay(start)) {
    start.setDate(start.getDate() + 1)
  }

  const end = new Date(start);
  let weekDaysCount = 1;
  while (weekDaysCount < 5) {
    end.setDate(end.getDate() + 1);
    if(isWeekDay(end)) {
      weekDaysCount++;
    }
  }

  return {start, end}
}

export default function Timetable() {
  {/*
  const [classes] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itca_timetable") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredClasses = classes.filter((item) => {
    const searchable = [
      item.module,
      item.trainer,
      item.venue,
      item.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(search.toLowerCase()) &&
      (!dateFilter || item.date === dateFilter)
    );
  });
  */}
  const getMonday = (date) => {
    const monday = new Date(date);
    monday.setDate(monday.getDate() - ((monday.getDate() + 6) %7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
  const [selectedWeek, setSelectedWeek] = useState('0')

  const [dateRange, setDateRange] = useState(() => getWeekDayRange(getMonday(new Date)));
  const {start, end} = dateRange;

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const WeekChange = (e) => {
    const offSet = Number(e.target.value)
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + offSet * 7);

    setSelectedWeek(e.target.value)
    setDateRange(getWeekDayRange(monday))
  }

  const weekOptions = [-1, 0, 1].map((offSet) => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + offSet * 7);

    const {start, end} = getWeekDayRange(monday);

    return {
      value: String(offSet),
      label: `${formatter.format(start)} - ${formatter.format(end)}`,
    }
  })

  const toDateOnly = (date) => 
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

  const dateRangeLabel = `${formatter.format(start)} To ${formatter.format(end)}`;

  const [loading, setLoading] = useState(true)
  
  const [studentData, setStudentData] = useState([])
  const [studentStatus, setStudentStatus] = useState(null)

  const date = new Date()

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,'0');

  const [groups, setGroups] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)

  const [schedule, setSchedul] = useState([])
  const [scheduleStatus, setScheduleStatus] = useState(null)

  const [selectMonth, setSelectMonth] = useState(true)

  const [selectedMonth, setSelectedMonth] = useState(month)

  const [displayData, setDisplayData] = useState({
    trainer: null,
    classes: null,
    classTime: null,
    description: null
  })

  useEffect(() => {
    

    async function fetchTimetableData(){
      setLoading(true)
      setScheduleStatus(null)
      setGroupStatus(null)
      setStudentStatus(null)

      try {
        const {data: {user}, error: userError} = await supabase.auth.getUser()
        
        if(userError || !user?.id) throw new Error('Please Sign in to view Timetable')

        const {data: student, error: studentError} = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', user.id);

        if(studentError) throw studentError

        setStudentData(student || [])
        setStudentStatus(!null)

      }
      catch(err){

      }
      finally{
        setLoading(false)
      }

    }
  })

  return (
    <Layout role="student" title="Timetable">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC SCHEDULE</span>
          <h2>My Timetable</h2>
          <h2>Current Date</h2>
          <p>View your scheduled classes and practical sessions.</p>
          
        </div>
      </section>

      <section className='content-card'>
        <div className='filter_block'>
          <button
            className='button button-primary'
            type='button'
            onClick={() => setSelectMonth(!selectMonth)}
          >
            {selectMonth ? 'Month' : 'Week'}
          </button>
          
          {selectMonth ? (
            <>
              <label>
                Select Month:
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value='01'>Janaury</option>
                  <option value='02'>Febuary</option>
                  <option value='03'>March</option>
                  <opiton value='04'>April</opiton>
                  <option value='05'>May</option>
                  <option value='06'>June</option>
                  <option value='07'>July</option>
                  <option value='08'>August</option>
                  <option value='09'>September</option>
                  <option value='10'>October</option>
                  <option value='11'>November</option>
                  <option value='12'>December</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                Select Week:

                <select
                  value={selectedWeek}
                  onChange={WeekChange}
                >
                  {weekOptions.map(({value, label}) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        {start.toDateString()} <br/>
        {end.toDateString()} <br/>
        {toDateOnly(start)} <br/>
        {toDateOnly(end)}
      </section>

      <br/>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Scheduled Classes for current month</p>
          <strong>--</strong>
        </article>

        <article className='stat-card'>
          <p>Trainer</p>
          <strong>--</strong>
        </article>

        <article className='stat-card'>
          <p>Class Time</p>
          <strong>--</strong>
        </article>

        <article className='stat-card'>
          <p>Description</p>
          <strong>--</strong>
        </article>
      </section>

      {/*
      <section className="content-card">
        <h3>Class Schedule</h3>
        <p>Use the filters to find a scheduled session.</p>

        <div className="form-grid">
          <label>
            Search classes
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Module, trainer, venue..."
            />
          </label>

          <label>
            Filter by date
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Module</th>
                <th>Trainer</th>
                <th>Venue</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.date || "—"}</td>
                  <td>
                    {item.startTime || "—"} – {item.endTime || "—"}
                  </td>
                  <td>{item.module || "—"}</td>
                  <td>{item.trainer || "—"}</td>
                  <td>{item.venue || "—"}</td>
                  <td>{item.type || "Class"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClasses.length === 0 && (
          <p role="status">
            No timetable entries are available yet.
          </p>
        )}
      </section>
      */}
    </Layout>
  );
}