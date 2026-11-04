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
  const [editValue, setEditValue] = useState('');

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
      (profile.groups?.toLowerCase() || '').includes(value) ||
      (profile.title?.toLowerCase() || '').includes(value);

    const matchRole = filterRole === 'all' || profile.role === filterRole;

    return matchValue && matchRole
  })

  const handleEdit = (profile) => {
    setEditingID(profile.id);
    setEditValue(profile.name || '');
  }

  const handleSurname = (profile) => {
    setEditingID(profile.id);
    setEditValue(profile.surname || '');
  }

  const handleRT = (profile) => {
    setEditingID(profile.id);
    if(profile.role === 'Student'){
      setEditValue(profile.role)
    }
    else{
      setEditValue(profile.title)
    }
  }

  const saveEdit = async (profile) => {
    try {
      const tableName = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles';

      const {error: updateError} = await supabase
        .from(tableName)
        .update({name: editValue})
        .eq('id', profile.id);

      if(updateError) throw updateError

      setProfiles(prevProfiles => 
        prevProfiles.map(p => (p.id === profile.id ? {...p, name: editValue} : p))
      );

      setEditingID(null)
      setEditingField(null)
      setEditValue('')
    }
    catch(err){
      console.error('Error Updating User:', err.message);
      setErrorMessage(err.message)
    }
  }

  const saveSurname = async (profile) => {
    try {
      const table = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles';

      const {error: updateError} = await supabase
        .from(table)
        .update({surname: editValue})
        .eq('id', profile.id);

      if(updateError) throw updateError

      setProfiles(prevProfiles =>
        prevProfiles.map(p => (p.id === profile.id ? {...p, surname: editValue} : p))
      )

      setEditingID(null)
      setEditingField(null)
      setEditValue('')
    }
    catch(err){
      console.error('Error Updating User:', err.message)
      setErrorMessage(err.message)
    }
  }

  const saveRT = async (profile) => {
    try {
      const table = profile.role === 'Student' ? 'student_profiles' : 'faculty_profiles';
      const config = role_config[profile.role];

      if(!config){
        throw new Error(`Unknown profile role: ${profile.role}`)
      }

      const update = {
        [config.titleColumn]: editValue,
      }
      
      const {error: updateError} = await supabase
        .from(table)
        .update(update)
        .eq('id', profile.id)

      if(updateError) throw updateError

      setProfiles(prevProfiles => 
        prevProfiles.map((p) => (p.id === profile.id ? {...p, [config.titleColumn]:editValue} : p))
      )

      setEditingID(null)
      setEditingField(null)
      setEditValue('')
    }
    catch(err){
      console.error('Error updating User:', err.message)
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
                        Groups: {profile.groups} <br/> 
                        Student Status: {profile.student_status ? 'Active' : 'Not Active'} <br/>
                      </label>
                      <div className='dashboard-button-block'>
                        <button className='button button-primary dashboard-button' onClick={() => statusChange(profile)}>Change Status</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleEdit(profile); setEditingField('Name')}}>Edit Name</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleSurname(profile); setEditingField('Surname')}}>Edit Surname</button>
                        <button className='button button-primary dashboard-button'>Edit Sponsor Details</button> 
                      </div>
                      <br/>
                      
                      {isEditing ? (
                        <>
                          {editingField === 'Name' ? (
                            <>
                              <label className='full-field'>
                                Enter Name: 
                                <input
                                  type='text'
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder='Enter name here'
                                />
                              </label>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => {saveEdit(profile); setEditingField(null)}}>
                                  Save
                                </button>
                                <button className='button button-primary dashboard-button' onClick={() => {setEditingID(null); setEditingField(null)}}>
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : editingField === 'Surname' ? (
                            <>
                              <label className='full-field'>
                                Enter Surname:
                                <input
                                  type='text'
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder='Enter surname here'
                                />
                              </label>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => {saveSurname(profile); setEditingField(null)}}>
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
                        Status: {profile.status} <br/>
                      </label>
                      <div className='dashboard-button-block'>
                        <button className='button button-primary dashboard-button' onClick={() => statusChange(profile)}>Change Status</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleEdit(profile); setEditingField('Name')}}>Edit Name</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleSurname(profile); setEditingField('Surname')}}>Edit Surname</button>
                        <button className='button button-primary dashboard-button' onClick={() => {handleRT(profile); setEditingField('Title')}}>Edit Title</button>
                      </div>
                      <br/>

                      {isEditing ? (
                        <>
                          {editingField === 'Name' ? (
                            <>
                              <label className='full-field'>
                                Enter Name: 
                                <input
                                type='text'
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder='Enter name here'
                                />
                              </label>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => saveEdit(profile)}>
                                  Save
                                </button>
                                <button className='button button-primary dashboard-button' onClick={() => setEditingID(null)}>
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : editingField === 'Surname' ? (
                            <>
                              <label className='full-field'>
                                Enter Surname:
                                <input
                                  type='text'
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder='Enter surname here'
                                />
                              </label>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => {saveSurname(profile); setEditingField(null)}}>
                                  Save
                                </button>
                                <button className='button button-primary dashboard-button' onClick={() => {setEditingID(null); setEditingField(null)}}>
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : editingField === 'Title' ? (
                            <>
                              <label className='full-field'>
                                Enter Title:
                                <input
                                  type='text'
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder='Enter title here'
                                />
                              </label>
                              <div className='dashboard-button-block'>
                                <button className='button button-primary dashboard-button' onClick={() => {saveRT(profile); setEditingField(null)}}>
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
