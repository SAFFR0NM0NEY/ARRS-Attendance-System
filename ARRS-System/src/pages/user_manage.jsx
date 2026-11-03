import {useState, useEffect} from 'react';
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function UserManager() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

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

      {profiles.length === 0 ?
      (
        <section className='content-card'>
          <label>{loading ? 'Loading...' : 'No Users Found'}</label>
        </section>
      ) : (
        <>
          {profiles.map((profile) => (
            <>
              <section key={profile.id} className='content-card'>
                <h4>{profile.name} {profile.surname}</h4>
                <label className='full-field'>
                  {profile.role} <br/>
                  {profile.email} <br/>
                </label>
                {profile.role === 'Student' ? (
                  <>
                    <label>
                      {profile.student_nr} <br/>
                      {profile.groups}
                    </label>
                  </>
                ) : profile.role === 'Faculty' ? (
                  <>
                    <label>
                      {profile.title} <br/>
                      {profile.status}
                    </label>
                  </>
                ) : (
                  <>
                  </>
                )}
              </section>
              <br/>
            </>
          ))}
        </> 
      )}
    </Layout>
  )
}
