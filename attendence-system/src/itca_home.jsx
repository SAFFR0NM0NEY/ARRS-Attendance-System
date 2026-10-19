import {useState} from 'react'
import itca_logo from './assets/itca_logo.png'

import Student_Login from'./student_login'
import Faculty_Login from './faculty_login'

export default function App(){
  const [student_log, setStudent_log] = useState(false)
  const [faculty_dashboard, setFaculty_dashboard] = useState(false)

  if(student_log){
    return <Student_Login />
  }

  if(faculty_dashboard){
    return <Faculty_Login />
  }

  return (
    <div className='page_style'>
      <div className='header_block'>
        <img src={itca_logo} className='logo' />
      </div>
      <div className='body_block'>
        <input
          type='button'
          value='Student Log Attendence'
          className='student_button'
          onClick={() => setStudent_log(true)}
        />
        <input
          type='button'
          value='Faculty Dashboard'
          className='faculty_button'
          onClick={() => setFaculty_dashboard(true)}
        />
      </div>
    </div>
  )
}