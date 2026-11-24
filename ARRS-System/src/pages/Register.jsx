import { useState } from "react";
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    role: '',
    password: ""
  });

  const [studentInfo, setStudentInfo] = useState({
    name: '',
    surname: '',
    student_nr: '',
    id_nr: '',
    contact: '',
    spon_name: '',
    spon_surname: '',
    spon_email: '',
    spon_contact: ''
  });

  const [facultyInfo, setFacultyInfo] = useState({
    name: '',
    surname: '',
    contact: '',
    title: '',
    status: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(null)

  // Update only the field that the user changes.
  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
    setMessage("");
  }

  function handleOtherChange(e) {
    if(form.role === 'student'){
      setStudentInfo({
        ...studentInfo,
        [e.target.name]: e.target.value
      })
    }
    else if(form.role === 'trainer' || form.role === 'faculty' || form.role === 'admin'){
      setFacultyInfo({
        ...facultyInfo,
        [e.target.name]: e.target.value
      })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true)
    setErrorMessage(null)

    const {error} = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {data: {role: form.role}}
    })

    if(error){
      setErrorMessage('Something went wrong:',error.message)
      setLoading(false)
    }
    else {
      if(form.role === 'student'){
        const {studentInsertError} = await supabase.rpc('insert_student_profile',{
          p_name: studentInfo.name,
          p_surname: studentInfo.surname,
          p_student_nr: studentInfo.student_nr,
          p_id_nr: studentInfo.id_nr,
          p_email: form.email,
          p_contact: studentInfo.contact,
          p_spon_name: studentInfo.spon_name,
          p_spon_surname: studentInfo.spon_surname,
          p_spon_email: studentInfo.spon_email,
          p_spon_contact: studentInfo.spon_contact
        })

        if(studentInsertError){
          setErrorMessage('Something went wrong inserting student', studentInsertError.message)
          setLoading(false)
        }
        else {
          setStudentInfo({
            name: '',
            surname: '',
            student_nr: '',
            id_nr: '',
            contact: '',
            spon_name: '',
            spon_surname: '',
            spon_email: '',
            spon_contact: ''
          })
        }
      }
      else if(form.role === 'trainer' || form.role === 'faculty' || form.role === 'admin'){
        const {facultyInsertError} = await supabase.rpc('insert_faculty_profile', {
          f_email: form.email,
          f_name: facultyInfo.name,
          f_surname: facultyInfo.surname,
          f_contact: facultyInfo.contact,
          f_title: facultyInfo.title,
          f_status: facultyInfo.status
        })

        if(facultyInsertError){
          setErrorMessage('Something went wrong inserting faculty', facultyInsertError.message)
        }
        else {
          setFacultyInfo({
            name: '',
            surname: '',
            contact: '',
            title: '',
            status: ''
          })
        }
      }
      setMessage('Account Registered')
      setForm({
        email: '',
        role: '',
        password: ''
      })
      setLoading(false)
    }
  }

  return (
    <Layout role='admin' title='Register Account'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Register ITCA Account</span>
          <h2>Account Details</h2>
          <p>Register an Account for a ITCA student or faculty</p>
        </div>
      </section>

      <section className='content-card'>
        <h3>Register User Form</h3>

        <form className='input-grid' onSubmit={handleSubmit}>
          <label className='full-field' htmlFor="registerEmail">
            User Email address:
            <input
              id="registerEmail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className='full-field' htmlFor="registerPassword">
            Create Temp password:
            <input
              id="registerPassword"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className='full-field' htmlFor='registerRole'>
            User Role:
            <select
              id='userRole'
              name='role'
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value='' disabled>--Select Role--</option>
              <option value='student'>Student</option>
              <option value='faculty'>Faculty</option>
              <option value='trainer'>Trainer</option>
              <option value='admin'>Admin</option>
            </select>
          </label>

          {form.role === 'student'
          ? (
            <>
              <label className='full-field' htmlFor='registerName'>
                Student Name:
                <input 
                  name='name'
                  type='text'
                  value={studentInfo.name}
                  onChange={handleOtherChange}
                  required
                /> 
              </label>

              <label className='full-field' htmlFor='registerSurname'>
                Student Last Name:
                <input
                  type='text'
                  name='surname'
                  value={studentInfo.surname}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerStudentNr'>
                Student Number:
                <input
                  type='text'
                  name='student_nr'
                  value={studentInfo.student_nr}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerIdNr'>
                Student ID Number:
                <input
                  type='text'
                  name='id_nr'
                  value={studentInfo.id_nr}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerContact'>
                Student Contact:
                <input
                  type='text'
                  name='contact'
                  value={studentInfo.contact}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSponsorName'>
                Sponsor Name:
                <input
                  type='text'
                  name='spon_name'
                  value={studentInfo.spon_name}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSponsorSurname'>
                Sponsor Last Name:
                <input
                  type='text'
                  name='spon_surname'
                  value={studentInfo.spon_surname}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSponsorEmail'>
                Sponsor Email:
                <input
                  type='email'
                  name='spon_email'
                  value={studentInfo.spon_email}
                  onChange={handleOtherChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSponsorContact'>
                Sponsor Contact:
                <input
                  type='text'
                  name='spon_contact'
                  value={studentInfo.spon_contact}
                  onChange={handleOtherChange}
                  required
                />
              </label>
            </>
          ) : form.role === 'trainer' ? (
            <>
              <label className='full-field' htmlFor='registerName'>
                Trainer Name:
                <input
                  type='text'
                  name='name'
                  value={facultyInfo.name}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSurname'>
                Trainer Surname:
                <input
                  type='text'
                  name='surname'
                  value={facultyInfo.surname}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerContact'>
                Trainer Contact:
                <input
                  type='text'
                  name='contact'
                  value={facultyInfo.contact}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerTitle'>
                Trainer Title:
                <input
                  type='text'
                  name='title'
                  value={facultyInfo.title}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerStatus'>
                Trainer Status:
                <select
                  name='status'
                  value={facultyInfo.status}
                  onChange={handleOtherChange}
                >
                  <option value='' disabled>--Select Status--</option>
                  <option value='Active'>Active</option>
                  <option value='Not-Active'>Not Active</option>
                </select>
              </label>
            </>
          ) : form.role === 'faculty' ? (
            <>
              <label className='full-field' htmlFor='registerName'>
                Faculty Name:
                <input
                  type='text'
                  name='name'
                  value={facultyInfo.name}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSurname'>
                Faculty Surname:
                <input
                  type='text'
                  name='surname'
                  value={facultyInfo.surname}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerContact'>
                Faculty Contact:
                <input
                  type='text'
                  name='contact'
                  value={facultyInfo.contact}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerTitle'>
                Faculty Title:
                <input
                  type='text'
                  name='title'
                  value={facultyInfo.title}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerStatus'>
                Faculty Status:
                <select
                  name='status'
                  value={facultyInfo.status}
                  onChange={handleOtherChange}
                >
                  <option value='' disabled>--Select Status--</option>
                  <option value='Active'>Active</option>
                  <option value='Not-Active'>Not Active</option>
                </select>
              </label>
            </>
          ) : form.role === 'admin' ? (
            <>
              <label className='full-field' htmlFor='registerName'>
                Administrator Name:
                <input
                  type='text'
                  name='name'
                  value={facultyInfo.name}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerSurname'>
                Administrator Surname:
                <input
                  type='text'
                  name='surname'
                  value={facultyInfo.surname}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerContact'>
                Administrator Contact:
                <input
                  type='text'
                  name='contact'
                  value={facultyInfo.contact}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerTitle'>
                Administrator Title:
                <input
                  type='text'
                  name='title'
                  value={facultyInfo.title}
                  onChange={handleOtherChange}
                  required
                />
              </label>

              <label className='full-field' htmlFor='registerStatus'>
                Administrator Status:
                <select
                  name='status'
                  value={facultyInfo.status}
                  onChange={handleOtherChange}
                >
                  <option value='' disabled>--Select Status--</option>
                  <option value='Active'>Active</option>
                  <option value='Not-Active'>Not Active</option>
                </select>
              </label>
            </>
          ) : (
            <>
            </>
          )}

          <button type="submit" className="button button-primary button-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        {message && (
          <p className="form-success" role="status">{message}</p>
        )}
        {errorMessage && (
          <p style={{color:'red',marginTop:'1rem'}} role='status'>{errorMessage}</p>
        )}
      </section>
    </Layout>
  );
}