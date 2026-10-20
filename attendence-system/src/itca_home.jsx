import React,{useState} from 'react'
import itca_logo from './assets/itca_logo.png'
import Student_Login from'./student_login'
import Faculty_Login from './faculty_login'

export default function App(){
  const [studentLog, setStudentLog] = useState(false)
  const [facultyLog, setFacultyLog] = useState(false)

  if(studentLog){
    return <Student_Login />
  }

  if(facultyLog){
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
          onClick={() => setStudentLog(true)}
        />
        <input
          type='button'
          value='Faculty Log In'
          className='faculty_button'
          onClick={() => setFacultyLog(true)}
        />
      </div>
    </div>
  )
}