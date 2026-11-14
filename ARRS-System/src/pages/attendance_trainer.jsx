import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function TrainerAttendanceManager(){
  const [loading, setLoading] = useState(false)

  const [trainer, setTrainer] = useState([])
  const [trainerStatus, setTrainerStatus] = useState(null)
  const [trainerGroups, setTrainerGroups] = useState(null)

  const [profiles, setProfiles] = useState([])
  const [profileStatus, setProfileStatus] = useState(null)

  const [groups, setGroups] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState('')

  const [attendance, setAttendance] = useState([])
  const [attendanceLoad, setAttendLoad] = useState(false)
  const [attendanceStatus, setAttendStat] = useState(null)

  const [filter, setFilter] = useState({
    value: '',
  })

  function filterChange(e){
    setFilter({
      ...filter,
      [e.target.name]:e.target.value,
    })
  }

  useEffect(() => {
    async function fetchTrainerGroups(){
      setLoading(true)
      setTrainerStatus(null)
      setGroupStatus(null)

      try {
        const {data: {user}, error: userError} = await supabase.auth.getUser();

        if(userError) throw userError

        const {data: trainer, error: trainerError} = await supabase
          .from('faculty_profiles')
          .select('*')
          .eq('id', user.id);

        if(trainerError) throw trainerError

        setTrainer(trainer || []);
        setTrainerStatus(!null)

        const Agroups = trainer?.[0].assigned_groups
        setTrainerGroups(Agroups)

        if(!Array.isArray(Agroups) || Agroups.length === 0){
          setGroups([])
          setGroupStatus(!null)
          return
        }

        try {
          const {data: groups, error: groupError} = await supabase
            .from('group_table')
            .select('*')
            .in('group_id', Agroups)

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
        setTrainerStatus(null)
      }
      finally{
        setLoading(false)
      }
    }

    fetchTrainerGroups();
  }, [])

  useEffect(() => {
    if(selectedGroup !== ''){
      async function fetchData(){
        setAttendLoad(true)
        setAttendStat(null)
        setProfileStatus(null)

        try {
          const {data, error} = await supabase
            .from('student_profiles')
            .select('*')
            .overlaps('groups', trainerGroups)

          if(error) throw error

          setProfiles(data || [])
          setProfileStatus(!null)

          const table = `${selectedGroup}_student`

          try {
            const {data, error} = await supabase
              .from(table)
              .select('*');

            if(error) throw error

            setAttendance(data)
            setAttendStat(!null)
          }
          catch(err){
            console.error(`Error Getting ${selectedGroup} student table: ${err.message}`)
            setAttendStat(null)
          }
        }
        catch(err){
          console.error(`Error Fetching Students: ${err.message}`)
          setProfileStatus(null)
        }
        finally {
          setAttendLoad(false)
        }
      }

      fetchData();
    }

  },[selectedGroup])

  const filteredAttendance = attendance.filter((record) => {
    const matchesStudent =
      filter.value === '' ||
      (record.student_nr) === filter.value

    return matchesStudent
  })

  return (
    <Layout role='trainer' title='Attendance'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage Student Attendance</span>
          <h2>Student Attendance</h2>
          <p>Manage ITCA Student Attendance</p>
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
              <option value='' disabled>--Select Group--</option>
              {groupStatus === null ? (
                <option disabled>--Error Loading Groups--</option>
              ) : (
                <>
                  {groups.map((group) => (
                    <option key={group.id} value={group.group_id}>
                      {group.group_id}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
          <br/>
          {selectedGroup === '' ? (
            <>
            </>
          ) : (
            <label>
              Filter By: 
              <select
                name='value'
                value={filter.value}
                onChange={filterChange}
              >
                <option value=''>All Students</option>
                {profileStatus === null ? (
                  <option disabled>--Error Fetching Students</option>
                ) : (
                  profiles.map((profile) => (
                    <option key={profile.id} value={profile.student_nr}>
                      {profile.name} {profile.surname} {profile.student_nr}
                    </option>
                  ))
                )}
              </select>
            </label>
          )}
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
          <h4>Select A Group To View Students</h4>
        </section>
      ) : selectedGroup !== '' ? (
        <>
          {filteredAttendance.length === 0 ? (
            <section className='content-card'>
              <label>{attendanceLoad ? 'Loading...' : 'No Students Found'}</label>
            </section>
          ) : (
            <>
              {filteredAttendance.map((record) => (
                <>
                  <section key={record.id} className='content-card'>
                    <label className='full-field'>
                      Name: {record.student_name} <br/>
                      Student Number: {record.student_nr} <br/>
                      Days Present: {record.days_present} <br/>
                      Days Absent: {record.days_absent} <br/>
                      <strong>
                        Attendence Average: {record.average_attendence === 0 ? '100%' : record.average_attendence} <br/>
                        Flagged Sessions: {record.flagged_session?.length || 0}
                      </strong>
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