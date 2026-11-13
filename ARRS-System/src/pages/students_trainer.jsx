import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function StudentsTrainer() {
  const [students, setStudents] = useState([])
  const [studentsStatus, setStudentStatus] = useState(null)

  const [trainerData, setTrainerData] = useState([])
  const [trainerStatus, setTrainerStatus] = useState(null)

  const [groupData, setGroupData] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)

  const [loading, setLoading] = useState(true)

  const [editingID, setEditingID] = useState(null)
  const [editingField, setEditingField] = useState(null)

  const [editFormS, setEditFormS] = useState({
    name: '',
    surname: '',
    student_nr: '',
    id_nr: '',
    contact: '',
    spon_name: '',
    spon_surname: '',
    spon_email: '',
    spon_contact: '',
  })

  const [filter, setFilter] = useState({
    value: '',
    group: 'All'
  })

  function filterChange(e){
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    async function fetchTrainerGroups() {
      setLoading(true)
      setTrainerStatus(null)
      setGroupStatus(null)
      setStudentStatus(null)

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
          const {data: students, error: studentError} = await supabase
            .from('student_profiles')
            .select('*')
            .overlaps('groups', assignedGroups);

          if(studentError) throw studentError

          setStudents(students || [])
          setStudentStatus(!null)
        }
        catch(err){
          console.error(`Error Fetching Students: ${err.message}`)
          setStudentStatus(null)
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
  }, [])

  const filteredData = students.filter((student) => {
    const value = filter.value.toLowerCase();

    const matchValue = 
      (student.name?.toLowerCase() || '').includes(value) ||
      (student.surname?.toLowerCase() || '').includes(value) ||
      (student.email?.toLowerCase() || '').includes(value) ||
      (student.student_nr || '').includes(value) ||
      (student.groups?.some((group) => group.toLowerCase().includes(value)));

    const matchGroup = 
      filter.group === 'All' ||
      student.groups?.some((group) => group === filter.group);

    return matchValue && matchGroup
  })

  return (
    <Layout role='trainer' title='Students'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage Students</span>
          <h2>Student Accounts</h2>
          <p>Manage ITCA Students</p>
        </div>
      </section>

      <section className='content-card'>
        <div className='filter_block'>
          <label>
            Filter By:
            <input 
              type='text'
              name='value'
              value={filter.value}
              onChange={filterChange}
              placeholder='Name, Surname, or etc'
            />
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
              <option value='All'>All Students</option>
              {groupStatus === null ? (
                <option disabled>--Error Loading Students--</option>
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
      ) : (
        <>
          {filteredData.length === 0 ? (
            <section className='content-card'>
              <label>No Students Found</label>
            </section>
          ) : (
            <>
              {filteredData.map((profile) => {
                const isEditing = editingID === profile.id;

                return (
                  <>
                    <section key={profile.id} className='content-card'>
                      <h4>{profile.name} {profile.surname}</h4>
                      <label>
                        Email: {profile.email} <br/>
                        Student Number: {profile.student_nr} <br/>
                        Student ID Number: {profile.id_nr} <br/>
                        Student Contact: {profile.contact_nr} <br/>
                        Sponsor: {profile.sponsor_name} {profile.sponsor_surname} <br/>
                        Sponsor Email: {profile.sponsor_email} <br/>
                        Sponsor Contact: {profile.sponsor_contact} <br/>
                        Groups: {profile.groups === null ? ('No Enrolled Groups') : (profile.groups.length === 0 ? 'No Enrolled Groups' : profile.groups.map((group) => group + ' ') )} <br/> 
                        Student Status: {profile.student_status ? 'Active' : 'Not Active'} <br/>
                      </label>
                    </section>
                    <br/>
                  </>
                )
              })}
            </>
          )}
        </>
      )}
    </Layout>
  )
}