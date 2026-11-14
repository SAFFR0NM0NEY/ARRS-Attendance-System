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

  const role_config = {
    Student: {
      table: 'student_profiles',
      statusColumn: 'student_status',
    }
  }

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

  const handleEditS = (profile) => {
    setEditingID(profile.id)
    setEditFormS({
      name: profile.name || '',
      surname: profile.surname || '',
      student_nr: profile.student_nr || '',
      id_nr: profile.id_nr || '',
      contact: profile.contact_nr || '',
    })
  }

  const editSChange = (e) => {
    setEditFormS({
      ...editFormS,
      [e.target.name]: e.target.value,
    })
  }

  const handleEditSS = (profile) => {
    setEditingID(profile.id);
    setEditFormS({
      spon_name: profile.sponsor_name || '',
      spon_surname: profile.sponsor_surname || '',
      spon_email: profile.sponsor_email || '',
      spon_contact: profile.sponsor_contact || '',
    })
  }

  const statusChange = async (profile) => {
    try {
      const config = role_config['Student'];
      const currentStatus = profile.student_status
      
      const newStatus = !currentStatus

      const stat_col = {
        [config.statusColumn]: newStatus,
      }

      const {error: statusError} = await supabase
        .from('student_profiles')
        .update(stat_col)
        .eq('id', profile.id);

      if(statusError) throw statusError

      setStudents((prevStudents) => (
        prevStudents.map((s) =>
          s.id === profile.id ? {...s, status: newStatus, [config.statusColumn]: newStatus} : s
        )
      ))
    }
    catch(err){
      console.error(`Error Updating Status: ${err.message}`)
    }
  }

  const saveEditS = async (profile) => {
    try {
      const {error: updateError} = await supabase
        .from('student_profiles')
        .update({
          name: editFormS.name,
          surname: editFormS.surname,
          student_nr: editFormS.student_nr,
          id_nr: editFormS.id_nr,
          contact_nr: editFormS.contact
        })
        .eq('id', profile.id);

      if(updateError) throw updateError

      setStudents(prevStudents => 
        prevStudents.map(s => (s.id === profile.id ? {...s,
          name: editFormS.name,
          surname: editFormS.surname,
          student_nr: editFormS.student_nr,
          id_nr: editFormS.id_nr,
          contact_nr: editFormS.contact
        } : s))
      )

      setEditingID(null)
      setEditingField(null)
      setEditFormS({
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
    }
    catch(err){
      console.error(`Error Updating User: ${err.message}`)
    }
  }

  const saveEditSS = async (profile) => {
    try {
      const {error: updateError} = await supabase
        .from('student_profiles')
        .update({
          sponsor_name: editFormS.spon_name,
          sponsor_surname: editFormS.spon_surname,
          sponsor_email: editFormS.spon_email,
          sponsor_contact: editFormS.spon_contact
        })
        .eq('id', profile.id);
      
      if(updateError) throw updateError

      setStudents(prevStudents => 
        prevStudents.map(s => (s.id === profile.id ? {...s,
          sponsor_name: editFormS.spon_name,
          sponsor_surname: editFormS.spon_surname,
          sponsor_email: editFormS.spon_email,
          sponsor_contact: editFormS.spon_contact
        } : s))
      )

      setEditingID(null)
      setEditingField(null)
      setEditFormS({
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
    }
    catch(err){
      console.error(`Error Updating Sponsor Details: ${err.message}`)
    }
  }

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
                      <div className='dashboard-button-block'>
                        <button className='button button-primary dashboard-button' onClick={() => statusChange(profile)}>
                          Change Status
                        </button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleEditS(profile); setEditingField('Student')}}>
                          Edit Student Details
                        </button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleEditSS(profile); setEditingField('Sponsor')}}>
                          Edit Sponsor Details
                        </button>
                      </div>
                      <br/>

                      {isEditing ? (
                        <>
                          {editingField === 'Student' ? (
                            <>
                              <label className='full-field'>
                                Enter Name:
                                <input
                                  type='text'
                                  name='name'
                                  value={editFormS.name}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Enter Name Here'
                                />
                              </label>
                              <br/>
                              <label className='full-field'>
                                Enter Surname:
                                <input
                                  type='text'
                                  name='surname'
                                  value={editFormS.surname}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Enter Surname Here'
                                />
                              </label>
                              <br/>
                              <label className='full-field'>
                                Enter Student Nr:
                                <input
                                  type='text'
                                  name='student_nr'
                                  value={editFormS.student_nr}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Enter Student Nr Here'
                                />
                              </label>
                              <br/>
                              <label className='full-field'>
                                Enter ID Number:
                                <input
                                  type='text'
                                  name='id_nr'
                                  value={editFormS.id_nr}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Enter ID Number Here'
                                />
                              </label>
                              <br/>
                              <label className='full-field'>
                                Enter Contact Nr:
                                <input
                                  type='text'
                                  name='contact'
                                  value={editFormS.contact}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Enter Contact Number Here'
                                />
                              </label>
                              <br/>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => {saveEditS(profile); setEditingField(null)}}>
                                  Save
                                </button>
                                <button className='button button-primary dashboard-button' onClick={() => {setEditingID(null); setEditingField(null)}}>
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : editingField === 'Sponsor' ? (
                            <>
                              <label ClassName='full-field'>
                                Enter Sponsor Name:
                                <input
                                  type='text'
                                  name='spon_name'
                                  value={editFormS.spon_name}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Sponsor Name Here'
                                />
                              </label>
                              <br/>
                              <label ClassName='full-field'>
                                Enter Sponsor Surname:
                                <input
                                  type='text'
                                  name='spon_surname'
                                  value={editFormS.spon_surname}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Sponsor Surname Here'
                                />
                              </label>
                              <br/>
                              <label ClassName='full-field'>
                                Enter Sponsor Email:
                                <input
                                  type='text'
                                  name='spon_email'
                                  value={editFormS.spon_email}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Sponsor Email Here'
                                />
                              </label>
                              <br/>
                              <label ClassName='full-field'>
                                Enter Sponsor Contact Nr:
                                <input
                                  type='text'
                                  name='spon_contact'
                                  value={editFormS.spon_contact}
                                  onChange={(e) => editSChange(e)}
                                  placeholder='Sponsor Contact Nr Here'
                                />
                              </label>
                              <br/>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => {saveEditSS(profile); setEditingField(null)}}>
                                  Save
                                </button>
                                <button className='button button-primary dashboard-button' onClick={() => {setEditingID(null); setEditingField(null)}}>
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                        </>
                      )}
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