import {useState} from 'react';
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function UserManager() {

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  if(!errorMessage) {
    <p>errorMessage</p>
  }

  return (
    <Layout role='admin' title='User Management'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage ITCA Accounts</span>
          <h2>User Accounts</h2>
          <p>Manage ITCA student, faculty, and trainer accounts</p>
        </div>
      </section>
    </Layout>
  )
}

export function StudentManager() {

}