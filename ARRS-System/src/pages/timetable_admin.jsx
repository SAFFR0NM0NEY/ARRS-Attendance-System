import {useState} from 'react'
import Layout from '../components/Layout'
import { supabase } from '../supabase'

export default function AdminTimetable() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if(!error){
    <p>{error} something went wrong</p>
  }

  return(
    <Layout role='admin' title='Timetable'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Admin Timetable Management</span>
          <h2>Timetable</h2>
        </div>
      </section>
    </Layout>
  )
}