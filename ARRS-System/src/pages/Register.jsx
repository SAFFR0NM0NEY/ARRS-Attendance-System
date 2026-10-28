import { useState } from "react";
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    role: '',
    password: ""
  });


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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true)
    setErrorMessage(null)

    const {error} = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {data: form.role}
    })

    if(error){
      setErrorMessage('Something went wrong:',error.message)
    }
    else {
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
            Email address:
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

          <label className='full-field' htmlFor='registerRole'>
            User Role:
            <select
              id='userRole'
              name='role'
              value={form.role}
              onChange={handleChange}
            >
              <option>Student</option>
              <option>Faculty</option>
              <option>Trainer</option>
              <option>Admin</option>
            </select>
          </label>

          <label className='full-field' htmlFor="registerPassword">
            Create password:
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

export function TrainerRegister(){
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)
  const [errorMess, setErrorMess] = useState(null)
  const [message, setMessage] = useState('')

  function handleChange(e) {
    setFormData({
      ...FormData,
      [e.target.name]:[e.target.value]
    })
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    setErrorMess(null)

    const {error} = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {data: formData.role}
    })

    if(error){
      setErrorMessage('Something went wrong:',error.message)
    }
    else {
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
    <Layout role='faculty' title='Register Account'>
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
            Email address:
            <input
              id="registerEmail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className='full-field' htmlFor='registerRole'>
            User Role:
            <select
              id='userRole'
              name='role'
              value={formData.role}
              onChange={handleChange}
            >
              <option>Student</option>
            </select>
          </label>

          <label className='full-field' htmlFor="registerPassword">
            Create password:
            <input
              id="registerPassword"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button type="submit" className="button button-primary button-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        {message && (
          <p className="form-success" role="status">{message}</p>
        )}
        {errorMess && (
          <p style={{color:'red',marginTop:'1rem'}} role='status'>{errorMess}</p>
        )}
      </section>
    </Layout>
  )
}