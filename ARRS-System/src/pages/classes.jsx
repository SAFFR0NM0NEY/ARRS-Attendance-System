import {useState} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function GroupManager() {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if(!error){
    <p>{error}</p>
  }

  return (
    <Layout role='admin' title='Group Management'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage ITCA Groups</span>
          <h2>ITCA Groups</h2>
          <p>Manage ITCA Groups, this includes years and their individual groups per year</p>
        </div>
      </section>
    </Layout>
  )
}
