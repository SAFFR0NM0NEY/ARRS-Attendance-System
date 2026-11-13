import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function AdminEnrolment(){

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmit] = useState(false)

  const [insertData, setInsertData] = useState({
    studentNr: '',
    target_group: '',
  })

  const year = new Date().getFullYear();

  const [groupData, setGroupData] = useState([])
  const [groupError, setGroupError] = useState(null)
  const [studentData, setStudentData] = useState([])
  const [studentError, setStudentError] = useState(null)

  const [enrolStatus, setEnrolStatus] = useState(null)

  /*
  const [removeData, setRemoveData] = useState({
    studentNr: '',
    target_group: '',
  })
  const [enrolledData, setEnrolled] = useState([])
  const [enrolledError, setEnrolledError] = useState(null)
  */

  function FormChange(e) {
    setInsertData({
      ...insertData,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    async function fetchGroups(){
      try {
        setLoading(true)
        setGroupError(null)

        const {data, error} = await supabase
          .from('group_table')
          .select('*');

        if(error) throw error

        setGroupData(data || [])
        setGroupError(!null)
      }
      catch(err){
        console.error('Error Fetching Groups: ',err.message)
        setGroupError(null)
      }
      finally{
        setLoading(false)
      }
    }

    async function fetchStudents(){
      try{
        setLoading(true)
        setStudentError(null)

        const {data, error} = await supabase
          .from('student_profiles')
          .select('*');

        if(error) throw error

        setStudentData(data || [])
        setStudentError(!null)
      }
      catch(err){
        console.error('Error Fetching Students: ', err.message)
        setStudentError(null)
      }
      finally{
        setLoading(false)
      }
    }

    fetchGroups();
    fetchStudents();
  }, [])

  const EnrolStudent = async (e) => {
    e.preventDefault();
    setSubmit(true)
    setEnrolStatus(null)

    try{
      const {error} = await supabase.rpc('insert_student',{
        target_table: insertData.target_group,
        p_year: year,
        search_student_nr: insertData.studentNr
      });

      if(error) throw error

      setEnrolStatus(`Success! Student ${insertData.studentNr} enrolled into ${insertData.target_group}`)
      setInsertData({
        studentNr: '',
        target_group: ''
      })
    }
    catch(err){
      console.error('Error enrolling student: ',err.message)
      setEnrolStatus(`Error enrolling student: ${err.message}`)
    }
    finally{
      setSubmit(false)
    }

  }

  return (
    <Layout role='admin' title='Enrolments'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage ITCA Enrolments</span>
          <h2>Enrolments</h2>
          <p>Manage and Enroll students to groups</p>
        </div>
      </section>

      {loading ? (
        <section className='content-card'>
          <h4>Loading...</h4>
        </section>
      ) : (
        <>
          <section className='content-card'>
            <h4>Enroll Student</h4>

            <form className='input-grid' onSubmit={EnrolStudent}>
              <label className='full-field'>
                Select Group: 
                <select
                  className='filter_role'
                  name='target_group'
                  value={insertData.target_group}
                  onChange={(e) => FormChange(e)}
                  required
                >
                  <option value='' disabled>--Select Group--</option>
                  {groupError === null ? (
                    <option disabled>--Error Fetching Groups--</option>
                  ) : (
                    groupData.map((group) => (
                      <option key={group.id} value={group.group_id}>
                        {group.group_id}
                      </option>
                    ))
                  )}
                  
                </select>
              </label>

              <label className='full-field'>
                Select Student:
                <select
                  className='filter_role'
                  name='studentNr'
                  value={insertData.studentNr}
                  onChange={(e) => FormChange(e)}
                  required
                >
                  <option value='' disabled>--Select Student--</option>
                  {studentError === null ? (
                    <option value='' disabled>
                      --Error Fetching Students--
                    </option>
                  ) : (
                    studentData.map((student) => (
                      <option key={student.id} value={student.student_nr}>
                        {student.name} {student.surname} {student.student_nr}
                      </option>
                    ))
                  )}
                  
                </select>
              </label>

              <button type='submit' className='button button-primary button-full' disabled={submitting}>
                {submitting ? 'Enrolling Student...' : 'Enrol Student'}
              </button>
            </form>

            {enrolStatus && (
              <p className='form-success' role='status'>{enrolStatus}</p>
            )}
          </section>
          <br/>
          {/*
          <section className='content-card'>
            <h4>Remove Student From Group</h4>

            <form className='input-grid'>
              <label className='full-field'>
                Select Group: 
                <select
                  className='filter_role'
                  name='target_group'
                  value={removeData.target_group}
                  onChange={}
                >

                </select>
              </label>
            </form>
          </section>
          */}
        </>
      )}
        
    </Layout>
  )
}