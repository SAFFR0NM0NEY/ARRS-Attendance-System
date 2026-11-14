import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

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

export default function TrainerGroupManager(){

  const [dateRange, setDateRange] = useState(() => getWeekDayRange());
  const {start, end} = dateRange;

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const dateRangeLabel = `${formatter.format(start)} To ${formatter.format(end)}`;

  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(null)

  const [trainerData, setTrainerData] = useState([])
  const [trainerStatus, setTrainerStatus] = useState(null)

  const [groupData, setGroupData] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)

  const [sessionData, setSessionData] = useState([])
  const [sessionStatus, setSessionStatus] = useState(null)
  const [sessionLoad, setSessionLoad] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState('')

  useEffect(() => {
    async function fetchTrainerGroups() {
      setLoading(true)
      setTrainerStatus(null)
      setGroupStatus(null)
      setSessionStatus(null)

      try {
        const {data: {user}, error: userError} = await supabase.auth.getUser();

        if(userError) throw userError

        const {data: trainer, error: trainerError} = await supabase
          .from('faculty_profiles')
          .select('*')
          .eq('id', user.id);

        if(trainerError) throw trainerError

        setTrainerData(trainer || [])
        setTrainerStatus(!null)

        const assignedGroups = trainer?.[0].assigned_groups

        if(!Array.isArray(assignedGroups) || assignedGroups.length === 0){
          setGroupData([])
          setGroupStatus(!null)
          return
        }

        try {
          const {data: groups, error: groupError} = await supabase
            .from('group_table')
            .select('*')
            .in('group_id', assignedGroups);

          if(groupError) throw groupError

          setGroupData(groups || [])
          setGroupStatus(!null)
        }
        catch(err){
          console.error(`Error Fetching Groups: ${err.message}`)
          setGroupStatus(null)
        }
      }
      catch(err){
        console.error(`Error Fetching Trainer: ${err.message}`)
        setTrainerStatus(null)
      }
      finally{
        setLoading(false)
      }
    }

    fetchTrainerGroups();
  },[])

  useEffect(() => {
    if(selectedGroup !== ''){
      async function fetchSession(){
        setSessionLoad(true)
        const table = `${selectedGroup}_schedule`

        const startString = start instanceof Date ? start.toISOString() : start;
        const endString = end instanceof Date ? end.toISOString() : end;

        try {
          const {data: session, error: sessionError} = await supabase
            .from(table)
            .select('*')
            .gte('calendar_date', startString)
            .lte('calendar_date', endString);

          if(sessionError) throw sessionError

          setSessionData(session)
          setSessionStatus(!null)
        }
        catch(err) {
          console.error(`Error Getting Classes: ${err.message}`)
          setSessionStatus(null)
        }
        finally {
          setSessionLoad(false)
        }
        
      }

      fetchSession();
    }
  }, [selectedGroup])

  return (
    <Layout role='trainer' title='Classes'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage Classes</span>
          <h2>Classes {dateRangeLabel}</h2>
          <p>Manage Your ITCA Classes</p>
          <div>
            <p>Start: {start.toDateString()} <br/> End: {end.toDateString()}</p>
          </div>
        </div>
      </section>

      <section className='content-card'>
        <div className='filter_block'>
          <label>
            Select Group:
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value='' disabled>Select Group</option>
              {groupStatus === null ? (
                <option disabled>--Error Loading Groups--</option>
              ) : (
                <>
                  {groupData.map((group) => (
                    <option key={group.id} value={group.group_id}>
                      {group.group_id}
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
      ) : trainerStatus === null ? (
        <section className='content-card'>
          <h4>Something Went Wrong Getting Your Data</h4>
        </section>
      ) : selectedGroup === '' ? (
        <section className='content-card'>
          <h4>Select A Group To View Classes</h4>
        </section>
      ) : selectedGroup !== '' ? (
        <>
          {sessionLoad ? (
            <section className='content-card'>
              <h4>Loading Data...</h4>
            </section>
          ) : sessionStatus === null || sessionData.length === 0 ? (
            <section className='content-card'>
              <h4>Something Went Wrong Loading Data</h4>
            </section>
          ) : (
            <>
              {sessionData.map((session) => (
                <>
                  <section key={session.id} className='content-card'>
                    <h2>
                      {new Intl.DateTimeFormat('en-US', {
                        weekday: 'long',
                        timeZone: 'UTC',
                      }).format(new Date(session.calendar_date))}
                    </h2>
                    <h2>Date: {session.calendar_date}</h2>
                    <label>
                      Summary: {session.summary} <br/>
                      Session Time: {session.clock_time} <br/>
                      Session ID: {session.session_id} <br/>
                      Category: {session.category} <br/>
                      Passcode: {session.passcode_id === null ? 'No Passcode Generated' : session.passcode_id}
                    </label>
                  </section>
                  <br/>
                </>
              ))}
            </>
          )}
        </>
      ) : (
        <section className='content-card'>
          <h4>Something Went Wrong</h4>
        </section>
      )}
    </Layout>
  )
}