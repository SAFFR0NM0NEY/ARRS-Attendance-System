import {useState} from 'react'
import { supabase } from './supabase'
import Faculty_Dashboard from './pages/faculty_dashboard'

export default function Faculty_Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dashboard, setDashboard] = useState(false)

  const [loading, setLoading] = useState(false)

  /*
  const handleSubmit = (e) => {
    e.preventDefault();

    if(facultyEmail === 'testEmail' && facultyPass === 'testPass'){
      setDashboard(true)
    }
    else {
      alert('Something went wrong')
    }
  }
  */
  const handleLogInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)

    const {error} = await supabase.auth.signInWithPassword({email, password});
    if(error){
      alert(error.message)
    }
    else {
      setDashboard(true);
    }
    setLoading(false)
  } 

  const handleReturn = () => {
    window.location.href = '/'
  }

  if(dashboard){
    return <Faculty_Dashboard />
  }

  return (
    <div className='page_style'>
      <div className='faculty_signin_body'>
        <form className='faculty_signin_form' onSubmit={handleLogInSubmit}>
          <h1>Faculty Log In</h1>
          <div className='input_field'>
            <label className='input_label'>
              ITCA Email:
            </label>
            <input
              type='text'
              placeholder='Enter ITCA Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />  
          </div>
          <div className='input_field'>
            <label className='input_label'>
              Password:
            </label>
            <input
              type='password'
              placeholder='Enter Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className='input_button'>
            <input
              type='submit'
              value={loading ? 'Logging In...' : 'Log In'}
            />
            <input
              type='button'
              value='Return'
              onClick={handleReturn}
            />
          </div>
        </form>
      </div>
    </div>
  )
}