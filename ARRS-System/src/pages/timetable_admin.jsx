import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import { supabase } from '../supabase'

export default function AdminTimetable() {
  const [loading, setLoading] = useState(false)

  const [scheduling, setScheduling] = useState(false)
  const [scheduleStatus, setScheduleStatus] = useState(null)
  
  const [groupData, setGroupData] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)

  const [schedule, setSchedule] = useState({
    target_table: '',
    start_date: '',
    end_date: '',
    summary: '',
    category: '',
    clock_in: '',
  })

  function scheduleChange(e) {
    setSchedule({
      ...schedule,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    async function fetchGroups(){
      try {
        setLoading(true)
        setGroupStatus(null)

        const {data, error} = await supabase
          .from('group_table')
          .select('*');

        if(error) throw error

        setGroupData(data || [])
        setGroupStatus(!null)
      }
      catch(err){
        console.error(`Error fetching group ${err.message}`)
        setGroupStatus(null)
      }
      finally{
        setLoading(false)
      }
    }

    fetchGroups();
  }, [])

  const CreateSchedule = async (e) => {
    e.preventDefault();
    setScheduling(true)
    setScheduleStatus(null)

    try {
      const {error} = await supabase.rpc('insert_schedule_tables',{
        table_name: schedule.target_table,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        custom_summary: schedule.summary,
        custom_category: schedule.category,
        custom_time: schedule.clock_in
      });

      if(error) throw error;

      setScheduleStatus('Success! Schedule Created')
      setSchedule({
        target_table: '',
        start_date: '',
        end_date: '',
        summary: '',
        category: '',
        clock_in: '',
      })
    }
    catch(err){
      console.error(`Error creating schedule ${err.message}`)
      setScheduleStatus(`Error creating schedul ${err.message}`)
    } 
    finally{
      setScheduling(false)
    }
  }

  return(
    <Layout role='admin' title='Timetable'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Admin Timetable Management</span>
          <h2>Timetable</h2>
          <p>Create and Set Schedule for a group</p>
        </div>
      </section>

      {loading ? (
        <section className='content-card'>
          <h4>Loading...</h4>
        </section>
      ) : (
        <section className='content-card'>
          <h4>Create Schedule</h4>

          <form className='input-grid' onSubmit={CreateSchedule}>
            <label className='full-field'>
              Select Group:
              <select
                name='target_table'
                value={schedule.target_table}
                onChange={scheduleChange}
                required
              >
                <option value='' disabled>--Select Group--</option>
                {groupStatus === null ? (
                  <option disabled>--Error Fetching Groups</option>
                ) : (
                  groupData.map((group) => (
                    <option key={group.id} value={`${group.group_id}_schedule`}>
                      {group.group_id}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className='full-field'>
              Select Start Date:
              <input
                type='date'
                name='start_date'
                value={schedule.start_date}
                onChange={scheduleChange}
                required
              />
            </label>

            <label className='full-field'>
              Select End Date:
              <input
                type='date'
                name='end_date'
                value={schedule.end_date}
                onChange={scheduleChange}
                required
              />
            </label>

            <label className='full-field'>
              Enter Summary:
              <input
                type='text'
                name='summary'
                value={schedule.summary}
                onChange={scheduleChange}
                required
              />
            </label>

            <label className='full-field'>
              Select Category:
              <select
                name='category'
                value={schedule.category}
                onChange={scheduleChange}
                required
              >
                <option value='' disabled>--Select Category--</option>
                <option value='Class'>In Class</option>
                <option value='Home'>Home</option>
                <option value='No Class'>No Class</option>
              </select>
            </label>

            <label className='full-field'>
              Select Session Time:
              <select
                name='clock_in'
                value={schedule.clock_in}
                onChange={scheduleChange}
                required
              >
                <option value='' disabled>--Select Time--</option>
                <option value='Morning'>Morning Session</option>
                <option value='Afternoon'>Afternoon Session</option>
                <option value='Whole Day'>Whole Day Session</option>
                <option value='Off'>No Class</option>
              </select>
            </label>

            <button type='submit' className='button button-primary button-full' disabled={scheduling}>
              {scheduling ? 'Creating Schedule...' : 'Create Schedule'}
            </button>
          </form>

          {scheduleStatus && (
            <p className='form-success' role='status'>{scheduleStatus}</p>
          )}
        </section>
      )}
    </Layout>
  )
}