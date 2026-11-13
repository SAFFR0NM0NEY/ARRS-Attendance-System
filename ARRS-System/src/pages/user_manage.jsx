import {useState, useEffect} from 'react';
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function UserManager() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)

  const [filterValue, setFilterValue] = useState('');
  const [filterRole, setFilterRole] = useState('all')

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

  const [editFormF, setEditFormF] = useState({
    name: '',
    surname: '',
    title: '',
    contact: ''
  })

  const role_config = {
    Student: {
      table: 'student_profiles',
      statusColumn: 'student_status',
    },
    Faculty: {
      table: 'faculty_profiles',
      statusColumn: 'status',
      titleColumn: 'title'
    },
  }

  useEffect(() => {
    async function fetchProfiles(){
      try {
        setLoading(true)
        setErrorMessage(null)

        const {data: {user}, error: authError} = await supabase.auth.getUser();

        if(authError) throw authError

        const currentUserId = user?.id;

        const [studentResults, facultyResults] = await Promise.all([
          supabase
            .from('student_profiles')
            .select('*')
            .neq('id', currentUserId),
          supabase
            .from('faculty_profiles')
            .select('*')
            .neq('id',currentUserId)
        ])

        if(studentResults.error) throw studentResults.error

        if(facultyResults.error) throw facultyResults.error

        const combinedProfiles = [
          ...(studentResults.data || []).map(p => ({...p, role: 'Student'})),
          ...(facultyResults.data || []).map(p => ({...p, role: 'Faculty'}))
        ];

        setProfiles(combinedProfiles);
      }
      catch(err){
        console.error('Error fetching profiles:', err.message)
        setErrorMessage(err.message)
      }
      finally {
        setLoading(false)
      }
    }
    fetchProfiles();
  }, [])

  const filteredProfiles = profiles.filter((profile) => {
    const value = filterValue.toLowerCase();

    const matchValue = 
      (profile.name?.toLowerCase() || '').includes(value) ||
      (profile.surname?.toLowerCase() || '').includes(value) ||
      (profile.email?.toLowerCase() || '').includes(value) ||
      (profile.groups?.some((group) => group.toLowerCase().includes(value)) || '') ||
      (profile.title?.toLowerCase() || '').includes(value);

    const matchRole = filterRole === 'all' || profile.role === filterRole;

    return matchValue && matchRole
  })

  const handleEditS = (profile) => {
    setEditingID(profile.id);
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

  const handleEditF = (profile) => {
    setEditingID(profile.id);
    setEditFormF({
      name: profile.name || '',
      surname: profile.surname || '',
      title: profile.title || '',
      contact: profile.contact || '',
    })
  }

  const editFChange = (e) => {
    setEditFormF({
      ...editFormF,
      [e.target.name]: e.target.value,
    })
  }

  const saveEditS = async (profile) => {
    try {
      const table = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles';

      const {error: updateError} = await supabase
        .from(table)
        .update({
          name: editFormS.name,
          surname: editFormS.surname,
          student_nr: editFormS.student_nr,
          id_nr: editFormS.id_nr,
          contact_nr: editFormS.contact
        })
        .eq('id',profile.id);

      if(updateError) throw updateError

      setProfiles(prevProfiles => 
        prevProfiles.map(p => (p.id === profile.id ? {...p, 
          name: editFormS.name,
          surname: editFormS.surname,
          student_nr: editFormS.student_nr,
          id_nr: editFormS.id_nr,
          contact_nr: editFormS.contact
        } : p))
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
      console.error('Error updating User:',err.message)
      setErrorMessage(err.message)
    }
  }

  const saveEditSS = async (profile) => {
    try{
      const table = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles'

      const {error: updateError} = await supabase
        .from(table)
        .update({
          sponsor_name: editFormS.spon_name,
          sponsor_surname: editFormS.spon_surname,
          sponsor_email: editFormS.spon_email,
          sponsor_contact: editFormS.spon_contact
        })
        .eq('id',profile.id)

      if(updateError) throw updateError

      setProfiles(prevProfiles => 
        prevProfiles.map(p => (p.id === profile.id ? {...p, 
          sponsor_name: editFormS.spon_name,
          sponsor_surname: editFormS.spon_surname,
          sponsor_email: editFormS.spon_email,
          sponsor_contact: editFormS.spon_contact
        }: p))
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
      console.error('Somethin went wrong updating user:',err.message)
      setErrorMessage(err.message)
    }
  }

  const saveEditF = async (profile) => {
    try {
      const table = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles';

      const {error: updateError} = await supabase
        .from(table)
        .update({
          name: editFormF.name,
          surname: editFormF.surname,
          title: editFormF.title,
          contact: editFormF.contact,
        })
        .eq('id', profile.id)

      if(updateError) throw updateError

      setProfiles(prevProfiles =>
        prevProfiles.map(p => (p.id === profile.id ? {...p,
          name: editFormF.name,
          surname: editFormF.surname,
          title: editFormF.title,
          contact: editFormF.contact,
        } : p))
      )

      setEditingID(null)
      setEditingField(null)
      setEditFormF({
        name: '',
        surname: '',
        title: '',
        contact: '',
      })
    }
    catch(err){
      console.error('Something went wrong updating user:', err.message)
      setErrorMessage(err.message)
    }
  }

  const statusChange = async (profile) => {
    try {
      const table = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles';
      const config = role_config[profile.role];

      if(!config){
        throw new Error(`Unknown profile role: ${profile.role}`)
      }

      if(table === 'faculty_profiles'){
        const currStat = profile.status

        const newStatus = currStat === 'Active' ? 'Not Active' : 'Active'

        const status_col = {
          [config.statusColumn]: newStatus,
        }

        const {error: statusError} = await supabase
          .from(table)
          .update(status_col)
          .eq('id', profile.id);

        if(statusError) throw statusError

        setProfiles((prevProfiles) => (
          prevProfiles.map((p) =>
            p.id === profile.id ? {...p, status: newStatus, [config.statusColumn]: newStatus} : p
          )
        ))
      }
      else {
        const currentStatus = profile.student_status

        const newStat = !currentStatus

        const stat_col = {
          [config.statusColumn]: newStat,
        }

        const {error: statusError} = await supabase
          .from(table)
          .update(stat_col)
          .eq('id', profile.id);

        if(statusError) throw statusError

        setProfiles((prevProfiles) => (
          prevProfiles.map((p) =>
            p.id === profile.id ? {...p, status: newStat, [config.statusColumn]: newStat} : p
          )
        ))
      }
    }
    catch(err){
      console.error('Error Updating status:',err.message)
    }
  }


  if(!errorMessage) {
    <p>{errorMessage}</p>
  }

  return (
    <Layout role='admin' title='User Management'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage ITCA Accounts</span>
          <h2>User Accounts</h2>
          <p>Manage ITCA Student, Faculty, and Trainer accounts</p>
        </div>
      </section>

      <section className='content-card'>
        <div className='filter_block'>
          <label>
            Filter By:
            <input
              className='filter_value'
              type='text'
              value={filterValue}
              placeholder='Name, Email, Group, or Title'
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </label>
          <br/>
          <label>
            Filter By Role: 
            <select
              className='filter_role'
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value='all'>All Accounts</option>
              <option value='Student'>Student Accounts</option>
              <option value='Faculty'>Faculty Accounts</option>
            </select>
          </label>
        </div>
      </section>
      <br/>

      {filteredProfiles.length === 0 ?
      (
        <section className='content-card'>
          <label>{loading ? 'Loading...' : 'No Users Found'}</label>
        </section>
      ) : (
        <>
          {filteredProfiles.map((profile) => {
            const isEditing = editingID === profile.id;

            return (
              <>
                <section key={profile.id} className='content-card'>
                  <h4>{profile.name} {profile.surname}</h4>
                  <label className='full-field'>
                    Role: {profile.role} <br/>
                    Email: {profile.email} <br/>
                  </label>
                  {profile.role === 'Student' ? (
                    <>
                      <label>
                        Student Number: {profile.student_nr} <br/>
                        Student ID Number: {profile.id_nr} <br/>
                        Student Contact: {profile.contact_nr} <br/>
                        Sponsor: {profile.sponsor_name} {profile.sponsor_surname} <br/>
                        Sponsor Email: {profile.sponsor_email} <br/>
                        Sponsor Contact: {profile.sponsor_contact} <br/>
                        Groups: {profile.groups === null ? ('No Enrolled Groups') : (profile.groups.length === 0 ? 'No Enrolled Groups' : profile.groups.map((group) => group + ' '))} <br/> 
                        Student Status: {profile.student_status ? 'Active' : 'Not Active'} <br/>
                      </label>
                      <div className='dashboard-button-block'>
                        <button className='button button-primary dashboard-button' onClick={() => statusChange(profile)}>Change Status</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleEditS(profile); setEditingField('StudentDetails')}}>Edit Student Details</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleEditSS(profile); setEditingField('SponsorDetails')}}>Edit Sponsor Details</button> 
                      </div>
                      <br/>
                      
                      {isEditing ? (
                        <>
                          {editingField === 'StudentDetails' ? (
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
                          ): editingField === 'SponsorDetails' ? (
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
                    </>
                  ) : profile.role === 'Faculty' ? (
                    <>
                      <label>
                        Title: {profile.title} <br/>
                        Contact: {profile.contact} <br/>
                        Groups: {profile.assigned_groups === null ? 'No Assigned Groups' : profile.assigned_groups} <br/>
                        Status: {profile.status} <br/>
                      </label>
                      <div className='dashboard-button-block'>
                        <button className='button button-primary dashboard-button' onClick={() => statusChange(profile)}>Change Status</button>
                        <button className='button button-primary dashboard-button' onClick={() => handleEditF(profile)}>Edit User</button>
                      </div>
                      <br/>

                      {isEditing ? (
                        <>
                          <label className='full-field'>
                            Enter Name:
                            <input
                              type='text'
                              name='name'
                              value={editFormF.name}
                              onChange={(e) => editFChange(e)}
                              placeholder='Enter name here'
                            />
                          </label>
                          <br/>
                          <label className='full-field'>
                            Enter Surname:
                            <input
                              type='text'
                              name='surname'
                              value={editFormF.surname}
                              onChange={(e) => editFChange(e)}
                              placeholder='Enter surname here'
                            />
                          </label>
                          <br/>
                          <label className='full-field'>
                            Enter Title:
                            <input
                              type='text'
                              name='title'
                              value={editFormF.title}
                              onChange={(e) => editFChange(e)}
                              placeholder='Enter title here'
                            />
                          </label>
                          <br/>
                          <label className='full-field'>
                            Enter Contact:
                            <input
                              type='text'
                              name='contact'
                              value={editFormF.contact}
                              onChange={(e) => editFChange(e)}
                              placeholder='Enter contact here'
                            />
                          </label>
                          <br/>

                          <div className='dashboard-button-block'>
                            <button className='button button-primary dashboard-button' onClick={() => saveEditF(profile)}>
                              Save
                            </button>
                            <button className='button button-primary dashboard-button' onClick={() => setEditingID(null)}>
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
    </Layout>
  )
}
