import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function AdminAttendance(){
  const [loading, setLoading] = useState(false)

  const [profiles, setProfiles] = useState([])
  const [profilesError, setProfilesError] = useState(null)

  const [groups, setGroups] = useState([])
  const [groupsError, setGroupsError] = useState(null)

  const [attendence, setAttendence] = useState([])
  const [attendenceLoad, setAttendenceLoad] = useState(false)
  const [attendenceStatus, setAttendenceStatus] = useState(null)

  const [filter, setFilter] = useState({
    value: '',
    group: 'All',
  })

  useEffect(() => {
    async function fetchGroups(){
      try {
        setLoading(true)
        setGroupsError(null)
        const {data, error} = await supabase
          .from('group_table')
          .select('*');

        if(error) throw error

        setGroups(data || [])
        setGroupsError(!null)
      }
      catch(err){
        console.error(`Error Fetching Groups: ${err.message}`)
        setGroupsError(null)
      }
      finally{
        setLoading(false)
      }
    }

    async function fetchProfiles(){
      try {
        setLoading(true)
        setProfilesError(null)

        if(filter.group === 'All'){
          const {data, error} = await supabase
            .from('student_profiles')
            .select('*');

          if(error) throw error

          setProfiles(data || [])
          setProfilesError(!null)
        }
        else {
          const {data, error} = await supabase
            .from('student_profiles')
            .select('*')
            .in('groups', filter.group)

          if(error) throw error

          setProfiles(data || [])
          setProfilesError(!null)
        }
      }
      catch(err){
        console.error(`Error Fetching Students: ${err.message}`)
        setProfilesError(null)
      }
      finally{
        setLoading(false)
      }
    }

    async function fetchData(){
      try {
        setAttendenceLoad(true)
        setAttendenceStatus(null)

        const {data: tables, error: funcError} = await supabase.rpc('get_matching_tables', {
          table_pattern: '%_student'
        });

        if(funcError) throw funcError
        if(!tables || tables.length === 0){
          setAttendence([])
          setAttendenceLoad(false)
          setAttendenceStatus(null)
          return
        }

        const promises = tables.map(async (row) => {
          const tableName = row.table_name;
          const {data, error} = await supabase
            .from(tableName)
            .select('*');

          if(error) {
            console.error(`Error Getting ${tableName} data: ${error.message}`)
            setAttendenceStatus(null)
            return [];
          }

          return data.map(record => ({
            ...record,
            source_table: tableName
          }));
        });

        const results = await Promise.all(promises);

        const combined = results.flat();
        setAttendence(combined)
        setAttendenceStatus(!null)
      }
      catch(err){
        console.error(`Error: ${err.message}`)
        setAttendenceStatus(null)
      }
      finally{
        setAttendenceLoad(false)
      }
    }

    fetchData();
    fetchGroups();
    fetchProfiles();
  }, [])

  function filterChange(e) {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    })
  }

  const filteredAttendance = attendence.filter((record) => {
    const matchesStudent = 
      filter.value === '' ||
      (record.student_nr) === filter.value;
    
    const matchesGroup =
      filter.group === 'All' ||
      record.source_table === `${filter.group}_student`;

    return matchesStudent && matchesGroup
  })

  function FormatTableName(tableName) {
    return tableName
      .replace('_student','')
      .replace(/-/g, ' ')
  }

  return (
    <Layout role='admin' title='Attendance'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Admin Attendance Management</span>
          <h2>Attendance</h2>
          <p>View and Manage Attendance for All Groups and Students</p>
        </div>
      </section>

      {loading ? (
        <section className='content-card'>
          <h4>Loading...</h4>
        </section>
      ) : (
        <>
          <section className='content-card'>
            <div className='filter_block'>
              <label>
                Filter By:
                <select
                  className='filter_role'
                  name='value'
                  value={filter.value}
                  onChange={filterChange}
                >
                  <option value=''>All Students</option>
                  {profilesError === null ? (
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
              <br/> 
              <label>
                Filter By Group:
                <select
                  className='filter_role'
                  name='group'
                  value={filter.group}
                  onChange={filterChange}
                >
                  <option value='All'>All Groups</option>
                  {groupsError === null ? (
                    <option disabled>--Error Fetching Groups--</option>
                  ) : (
                    groups.map((group) => (
                      <option key={group.id} value={group.group_id}>
                        {group.group_id}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
          </section>
          <br/>

          {filteredAttendance.length === 0 ? (
            <section className='content-card'>
              <label>{attendenceLoad ? 'Loading...' : 'No Students Found'}</label>
            </section>
          ) : (
            <>
              {filteredAttendance.map((record, index) => (
                <>
                  <section key={index} className='content-card'>
                    <label className='full-field'>
                      Group: {FormatTableName(record.source_table)} <br/>
                      Name: {record.student_name} <br/>
                      Student Number: {record.student_nr} <br/>
                      Days Present: {record.days_present} <br/>
                      Days Absent: {record.days_absent} <br/>
                      <strong>
                        Attendence Average: {record.average_attendence}
                      </strong>
                    </label>
                  </section>
                  <br/>
                </>
              ))}
            </>
          )}
        </>
        
      )}
    </Layout>
  )
}