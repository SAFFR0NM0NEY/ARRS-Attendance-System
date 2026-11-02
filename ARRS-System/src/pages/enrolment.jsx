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
        </div>
      </section>
    </Layout>
  )
}

export function TrainerEnrolment() {

  const [loadingMess, setLoadingMess] = useState(false)
  const [errorMess, setErrorMess] = useState(null)

  if(!errorMess){
    <p>{errorMess} Something went wrong</p>
  }

  return (
    <Layout role='trainer' title='Enrolments'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage ITCA Student Enrolments</span>
          <h2>Enrolments</h2>
        </div>
      </section>
    </Layout>
  )
}