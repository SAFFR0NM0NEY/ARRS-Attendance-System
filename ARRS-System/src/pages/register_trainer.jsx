import { useState } from "react";
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function TrainerRegister(){
  const [formData, setFormData] = useState({
    email: '',
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
      options: {data: {role: 'student'}}
    })

    if(error){
      setErrorMess('Something went wrong:',error.message)
    }
    else {
      setMessage('Account Registered')
      setForm({
        email: '',
        password: ''
      })
      setLoading(false)
    }
  }

  return (
    <Layout role='trainer' title='Register Account'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Register ITCA Account</span>
          <h2>Account Details</h2>
          <p>Register an Account for a ITCA student</p>
        </div>
      </section>

      <section className='content-card'>
        <h3>Register Student Form</h3>

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

          <label className='full-field' htmlFor="registerPassword">
            Create password (temp):
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