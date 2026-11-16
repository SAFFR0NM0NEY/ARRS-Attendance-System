import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function TrainerAttendanceRegister(){
  const [loading, setLoading] = useState(false)

  const [profiles, setProfiles] = useState([])
  const [profilesStatus, setProfilesStatus] = useState(null)

  const [trainerGroups, setTrainerGroups] = useState([])
  const [groups, setGroups] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)
  const [Gdescription, setDescription] = useState('')
  
  const [selectDate, setSelectDate] = useState(false)

  const date = new Date()

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2,'0');

  const FDate = `${year}-${month}-${day}`

  useEffect(() => {
    if(!selectDate){
      setSelectedDate(FDate)
      setFilter({
        ...filter,
        date: FDate,
      })
    } 
  },[selectDate])

  const [selectedDate, setSelectedDate] = useState(FDate)
  
  function FormatDisplayDate(inputdate){
    const [year, month, day] = inputdate.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    }).format(localDate);
  }

  const displayDate = FormatDisplayDate(selectedDate)

  useEffect(() => {
    async function fetchTrainerGroups(){
      setLoading(true)
      setGroupStatus(null)
      
      try {
        const {data: {user}, error: userError} = await supabase.auth.getUser();

        if(userError) throw userError

        const {data: trainer, error: trainerError} = await supabase
          .from('faculty_profiles')
          .select('*')
          .eq('id', user.id);

        if(trainerError) throw trainerError

        const AGroups = trainer?.[0]?.assigned_groups
        if(!Array.isArray(AGroups) || AGroups.length === 0){
          setGroups([])
          setGroupStatus(!null)
          return
        }

        setTrainerGroups(AGroups)

        try {
          const {data: groups, error: groupError} = await supabase
            .from('group_table')
            .select('*')
            .in('group_id', AGroups)

          if(groupError) throw groupError

          setGroups(groups || [])
          setGroupStatus(!null)
        }
        catch(err){
          console.error(`Error Fetching Groups: ${err.message}`)
          setGroupStatus(null)
        }

      }
      catch(err){
        console.error(`Error Fetching Trainer: ${err.message}`)
      }
      finally{
        setLoading(false)
      }
    }

    fetchTrainerGroups();
  },[])

  const [session, setSession] = useState([])
  const [sessionStatus, setSessionStatus] = useState(null)

  const [attendance, setAttendance] = useState([])
  const [attendanceStatus, setAttendanceStatus] = useState(null)

  const [students, setStudents] = useState([])
  const [studentStatus, setStudentStatus] = useState(null)

  const [passcode_session, setPasscode_session] = useState(null)
  const [passcodeGen, setPasscodeGen] = useState(false)
  const [passcodeStatus, setPasscodeStatus] = useState(null)

  const [flagStudent, setFlagStudent] = useState({
    studentNr: '',
    studentName: '',
    sessionID: '',
    group_name: '',
    year_value: '',
  })

  const [filter, setFilter] = useState({
    group: '',
    date: selectedDate,
  })

  function filterChange(e){
    if(e.target.name === 'group'){
      const groupValue = groups.find((g) => g.group_id === e.target.value)

      const groupDes = groupValue ? groupValue.group_description : '';

      setDescription(groupDes)
    }

    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    async function fetchProfiles(){
      setProfilesStatus(null)
      try {
        const {data, error} = await supabase
          .from('student_profiles')
          .select('*')
          .overlaps('groups', trainerGroups);

        if(error) throw error

        setProfiles(data || [])
        setProfilesStatus(!null)
      }
      catch(err){
        console.error(`Error Fetching Students: ${err.message}`)
        setProfilesStatus(null)
      }
    }

    fetchProfiles();
  }, [])

  useEffect(() => {
    if(filter.group !== ''){
      async function fetchData(){
        setAttendanceStatus(null)
        setSessionStatus(null)
        setStudentStatus(null)
        try {
          const table1 = `${filter.group}_schedule`
          const table2 = `${filter.group}_attendence`
          const table3 = `${filter.group}_student`

          const {data: schedule, error: scheduleError} = await supabase
            .from(table1)
            .select('*')
            .eq('calendar_date', filter.date);

          if(scheduleError) throw scheduleError

          setSession(schedule || [])
          setSessionStatus(!null)

          const sessionID = schedule?.[0].session_id
          const sessionPasscode = schedule?.[0].passcode_id

          setPasscode_session(sessionID)
          if(sessionPasscode !== null){
            setPasscodeStatus(!null)
          }
          else{
            GeneratePasscode();
          }
          
          const {data: attendance, error: attendanceError} = await supabase
            .from(table2)
            .select('*')
            .eq('session_id', sessionID);

          if(attendanceError) throw attendanceError

          setAttendance(attendance || [])
          setAttendanceStatus(!null)

          const {data: students, error: studentError} = await supabase
            .from(table3)
            .select('*');

          if(studentError) throw studentError

          setStudents(students || [])
          setStudentStatus(!null)
        }
        catch(err){
          console.error(`Error Fetching Data: ${err.message}`)
          setSessionStatus(null)
          setAttendanceStatus(null)
          setStudentStatus(null)
        }
      }
      fetchData();
    }
  },[filter.group, filter.date])

  const GeneratePasscode = async() => {
    setPasscodeGen(true)
    setPasscodeStatus(null)

    if(filter.group === '' || filter.date !== FDate){
      setPasscodeStatus(null)
      setPasscodeGen(false)
      return;
    }

    try {
      const table = `${filter.group}_schedule`

      if(passcode_session === null){
        throw new Error(`Error With Session ID`)
      }

      const {error} = await supabase.rpc('generate_passcode_for_session', {
        target_table: table,
        target_session_id: passcode_session
      });

      if(error) throw error

      const {data: updatedSchedule, error: refreshError} = await supabase
        .from(table)
        .select('*')
        .eq('calendar_date', filter.date);

      if(refreshError) throw refreshError

      setSession(updatedSchedule || [])
      setPasscodeStatus(!null)
    }
    catch(err){
      console.error(`Error Generating Passcode: ${err.message}`)
      setPasscodeStatus(null)
    }
    finally{
      setPasscodeGen(false)
    }
  }

  useEffect(() => {
    if(selectedDate === FDate){
      const TSession = session.find((r) => r.calendar_date === FDate)

      const Class = TSession ? TSession.category : '';
      const passcode = TSession ? TSession.passcode_id : null;

      if(Class === 'Class' && passcode === null){
        GeneratePasscode();
      }
    }
  },[selectedDate, session])

  return (
    <Layout role='trainer' title='Attendance Register'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>View & Manage Class Attendance</span>
          <h2>Class Attendance Register</h2>
          <p>Manage ITCA Student Attendance For Session</p>
        </div>
      </section>

      <section className='content-card'>
        <div className='filter_block'>
          <strong>Current Date: {displayDate}</strong>
          <label>
            Select Day: 
            <input
              type='checkbox'
              checked={selectDate}
              onChange={(e) => setSelectDate(e.target.checked)}
            />
          </label>
          {selectDate  && (
            <>
              <label>
                Select Date: 
                <input
                  type='date'
                  name='date'
                  value={selectedDate}
                  onChange={(e) => {setSelectedDate(e.target.value); filterChange(e)}}
                />
              </label>
              <br/>
            </>
          )}
          <label>
            Select Group: 
            <select
              name='group'
              value={filter.group}
              onChange={filterChange}
            >
              <option value='' disabled>--Select Group--</option>
              {groupStatus === null ? (
                <option disabled>--Error Loading Groups--</option>
              ) : (
                <>
                  {groups.map((group) => (
                    <option key={group.id} value={group.group_id}>
                      {group.group_description} -- {group.group_year}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>
      </section>
      <br/>

      {loading ? (
        <section className='content-card'>
          <h4>Loading...</h4>
        </section>
      ) : profilesStatus === null ? (
        <section className='content-card'>
          <h4>Something Went Wrong With Getting Students</h4>
        </section>
      ) : filter.group === '' ? (
        <section className='content-card'>
          <h4>Select a Group To View Attendance</h4>
        </section>
      ) : attendanceStatus === null || sessionStatus === null || studentStatus === null ? (
        <section className='content-card'>
          <h4>Something Went Wrong With Getting Data</h4>
        </section>
        /*
        <section className='content-card'>
          {attendanceStatus === null && (
            <h4>Something Went Wrong With Getting Attendance Data</h4>
          )}
          {sessionStatus === null && (
            <h4>Something Went Wrong With Getting Session Data</h4>
          )}
          {studentStatus === null && (
            <h4>Something Went Wrong With Getting Student Data</h4>
          )}
        </section>
        */
      ) : (
        <>
          {session.map((record) => (
            <>
              {record.clock_time === 'Whole Day' || record.clock_time === 'Afternoon' || record.clock_time === 'Morning' ? (
                <>
                  <section className='content-card'>
                    <h1>Group: {Gdescription === '' ? filter.group : Gdescription}</h1>
                    {passcodeStatus === null ?(
                      <>
                        <h4>Passcode Can Only be Viewed On The Day</h4>
                      </>
                    ) : (
                      <>
                        {passcodeGen ? (
                          <h1>Generating Passcode...</h1>
                        ) : (
                          <h1>Passcode: {record.passcode_id === null ? 'No Passcode Generated' : record.passcode_id}</h1>
                        )}
                        {record.passcode_id === null && record.calendar_date === FDate ? (
                          <button 
                            className='button button-primary dashboard-button'
                            type='button'
                            onClick={() => GeneratePasscode()}
                            disabled={passcodeGen}
                          >
                            {passcodeGen ? 'Generating...' : 'Generate Passcode'}
                          </button>
                        ): (
                          <>
                          </>
                        )}
                      </>
                    )}
                    {/*<h4>(temp) Session ID: {record.session_id}</h4>*/}
                    <h4>Number of Students: {students.length}</h4>
                    <h4>Session Time: {record.clock_time}</h4>
                    {record.clock_time === 'Whole Day' ? (
                      <p>
                        Class Time: 09:00 -- 16:00 <br/>
                        Late Time: 09:15
                      </p>
                    ) : record.clock_time === 'Morning' ? (
                      <p>
                        Class Time: 09:00 -- 12:00 <br/>
                        Late Time: 09:15
                      </p>
                    ) : record.clock_time === 'Afternoon' && (
                      <p>
                        Class Time: 13:00 -- 16:00 <br/>
                        Late Time: 13:15
                      </p>
                    )}
                  </section>
                  <br/>
                  {attendance.length === 0 ? (
                    <section className='content-card'>
                      <h4>No Students have marked present</h4>
                    </section>
                  ) : (
                    <>
                      {attendance.map((record) => (
                        <section className='content-card'>
                          <h2>{record.student_name} -- {record.student_nr}</h2>
                          <h4>Status: {record.attend_status}</h4>
                          {record.attend_status === 'Present' ? (
                            <>
                              <h4>Arrival Time: {record.arrival_time || 'Error'}</h4>
                            </>
                          ) : record.attend_status === 'Late' ? (
                            <>
                             <h4>Arrival Time: {record.arrival_time || 'Error'}</h4>
                            </>
                          ) : record.attend_status === 'Absent' || record.attend_status !== null && (
                            <>
                            </>
                          )}
                        </section>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <section className='content-card'>
                  <h2>No Class Today</h2>
                </section>
              )}
              
            </>
          ))}
        </>
      )}
    </Layout>
  )
}