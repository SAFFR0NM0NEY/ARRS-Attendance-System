import {useState, useEffect} from 'react'
import Layout from '../components/Layout'
import {supabase} from '../supabase'

export default function GroupManager() {

  const [loading, setLoading] = useState(false)

  const [yearError, setYearError] = useState(null)
  const [groupError, setGroupError] = useState(null)

  const year = new Date().getFullYear();

  const [year_table, setYearTable] = useState(year)
  const [year_cols, setYearCols] = useState('group, description')
  const [year_status, setYearStatus] = useState('')

  const [year_group, setYearGroup] = useState('')
  const [groupForm, setGroupForm] = useState({
    title: '',
    description: ''
  })
  const [refreshing, setRefresh] = useState(false)
  const [groupStatus, setGroupStatus] = useState('')
  
  const CreateYearTable = async () => {
    setYearStatus('Creating Year Table');

    const columnArray = year_cols
      .split(',')
      .map((col) => col.trim())
      .filter((col) => col.length > 0);

    try {
      const {error} = await supabase.rpc('create_year_table', {
        year_name: year_table,
        column_names: columnArray,
      });

      if(error) {
        switch(error.code){
          case '42P07':
            setYearError('Year Already Created, Either create groups or new Year');
            break;
          default:
            setYearError(`Database Error: ${error.message}`);
        }
        return;
      }

      setYearStatus(`Success! Table ${year_table} was created`)
      setYearTable('')
      setYearCols('')
    }
    catch(err){
      console.error('Error creating table:',err.message)
      setYearStatus(`Error: ${err.message}`)
    }
  }

  const GroupChange = (e) => {
    setGroupForm({
      ...groupForm,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {

  })

  const CreateGroup = async (e) => {
    e.preventDeafult();
    setLoading(true)
    setGroupStatus('Creating Group...')

    try{
      const {error} = await supabase.rpc('insert_year_group',{
        year_table: year_group,
        group_data: groupForm,
      });

      if(error) throw error

      setGroupStatus(`Success! Group created successfully for year ${year_group}`)
      setGroupForm({
        title: '',
        description: '',
      })
    }
    catch(err){
      console.error('Error creating group:',err.message);
      setGroupStatus(`Error: ${err.message}`)

    }
    finally{
      setLoading(false)
    }
  };

  return (
    <Layout role='admin' title='Group Management'>
      <section className='page-heading'>
        <div>
          <span className='eyebrow'>Manage ITCA Groups</span>
          <h2>ITCA Groups</h2>
          <p>Manage ITCA Groups, this includes years and their individual groups per year</p>
        </div>
      </section>

      <section className='content-card'>
        <div className='filter_block'>
          <label>
            Filter by Year:
            <input

            />
          </label>
          <br/>
          <label>
            Filter by Category:
            <select>
              
            </select>
          </label>
        </div>
      </section>
      <br/>
      <section className='content-card'>
        <h4>Create Year For {year} </h4>
        <button className='button button-primary dashboard-button' onClick={CreateYearTable}>
          Create Year
        </button>
        {year_status && <p>{year_status}</p>}
        {yearError && <p>{yearError}</p>}
      </section>
      <br/>
      <section className='content-card'>
        <h4>Create Group</h4>
        
        <form className='input-grid' >
          <label className='full-field' htmlFor='groupYear'>
            Select Year 
            <select
              className='filter_role'
              value={year_group}
              onChange={(e) => setYearGroup(e.target.value)}
              required
            >
              <option value='' disabled>--Select Year--</option>
            </select>
            <button className='button button-primary dashboard-button'>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </label>

          <label className='full-field' htmlFor='groupTitle'>
            Enter Group Title:
            <input
              name='title'
              type='text'
              value={groupForm.title}
              onChange={GroupChange}
              required
            />
          </label>
          <label className='full-field' htmlFor='groupDescription'>
            Enter Group Description:
            <input
              name='description'
              type='text'
              value={groupForm.description}
              onChange={GroupChange}
              required
            />
          </label>

          <button type='submit' className='button button-primary button-full' disabled={loading}>
            {loading ? 'Creating Group...' : 'Create Group'}
          </button>
        </form>

        {groupStatus && (
          <p className='form-success' role='status'>{groupStatus}</p>
        )}
      </section>
    </Layout>
  )
}
