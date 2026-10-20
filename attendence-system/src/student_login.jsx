import React,{useState, useEffect} from 'react';

import itca_logo from './assets/itca_logo.png'

import {supabase} from './supabase'


export default function Student_Login() {
  const [student_nr, setStudent_nr] = useState('')
  const [passcode, setPasscode] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  


  const handleSubmit = (event) => {
    event.preventDefault();

    if(student_nr === db_student && passcode === db_pass){
      alert('student number matched')
    }
    else {
      alert('Something went wrong')
    }

  };


  return (
    <div className='page_style'>
      <div className='sign_in_block'>
        <div className='sign_in_logo'>
          <img src={itca_logo} />
        </div>
        <div className='sign_in_body'>
          <form className='sign_in_form' onSubmit={handleSubmit}>
            <h1>Student Log In</h1>
            <div className='input_field'>
              <label className='input_label'>
                ITCA Student Number:
              </label>
              <input 
                type='text'
                placeholder='Enter ITCA Student Number'
                onChange={(e) => setStudent_nr(e.target.value)}
              />
            </div>
            <div className='input_field'>
              <label className='input_label'>
                Passcode:
              </label>
              <input 
                type='text'
                placeholder='Enter Passcode'
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