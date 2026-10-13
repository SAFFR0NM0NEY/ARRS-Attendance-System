import React,{useState} from 'react';

import Student_Dashboard from './pages/student_dashboard'
import Faculty_Dashboard from './pages/faculty_dashboard'
import Admin_Dashboard from './pages/admin_dashboard'

import itca_logo from './assets/itca_logo.png'


export default function App() {
  const [showStudent, setStudent] = useState(false);
  const [showFaculty, setFaculty] = useState(false);
  const [showAdmin, setAdmin] = useState(false);
  const [passcode, setPasscode] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault();

    if(passcode !== ''){
      if(passcode === 'student'){
        setStudent(true)
      }
      else if(passcode === 'faculty'){
        setFaculty(true)
      }
      else if(passcode === 'admin'){
        setAdmin(true)
      }
    }
  };


  if(showStudent){
    return <Student_Dashboard />
  }

  if(showFaculty){
    return <Faculty_Dashboard />
  }

  if(showAdmin){
    return <Admin_Dashboard />
  }

  return (
    <div className='page_style'>
      <div className='sign_in_block'>
        <div className='sign_in_logo'>
          <img src={itca_logo} />
        </div>
        <div className='sign_in_body'>
          <form className='sign_in_form' onSubmit={handleSubmit}>
            <h1>Login</h1>
            <div className='input_field'>
              <label className='input_label'>
                ITCA ID
              </label>
              <input 
                type='text'
                placeholder='Enter ID'
                
              />
            </div>
            <div className='input_field'>
              <label className='input_label'>
                Passcode
              </label>
              <input 
                type='text'
                placeholder='Enter Passcode (temp)'
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
            <div className='input_button'>
              <input
                type='submit'
                value='Log Attendence'
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}