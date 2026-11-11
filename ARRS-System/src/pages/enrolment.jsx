import {useState} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function AdminEnrolment(){

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if(!error){
    <p>{error}</p>
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

      <section className='content-card'>
        
      </section>
    </Layout>
  )
}