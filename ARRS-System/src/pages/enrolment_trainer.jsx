import {useState} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function TrainerEnrolment() {

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