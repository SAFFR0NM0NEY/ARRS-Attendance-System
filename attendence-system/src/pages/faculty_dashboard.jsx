import {supabase} from '../supabase'
import React,{useState} from 'react'

export default function Faculty_Dashboard() {
  const [year_table, setYear_table] = useState('');
  const [year_cols, setYear_cols] = useState('');
  const [y_t_status, setY_t_status] = useState('')

  const CreateYearTable = async (e) => {
    e.preventDefault();
    setY_t_status('Creating table...')

    const columnArray = year_cols
      .split(',')
      .map((col) => col.trim())
      .filter((col) => col.length > 0);

    try {
      const {error} = await supabase.rpc('create_year_table', {
        year_name: year_table,
        column_names: columnArray,
      });

      if(error) throw error;

      setY_t_status(`Success! Table "${year_table}" was created.`);
      setYear_table('');
      setYear_cols('');
    }
    catch (err){
      console.error('Error creating table:',err.message)
      setY_t_status(`Error: ${err.message}`);
    }
  }

  
  return (
    <div className='page_style'>
      <h3>Faculty dashboard</h3>

      <div className='body_1'>
        <form onSubmit={CreateYearTable}>
          <div>
            <label>Enter table name:</label>
            <input
              type='text'
              value={year_table}
              onChange={(e) => setYear_table(e.target.value)}
            />
          </div>
          <div>
            <label>Enter columns:</label>
            <input
              type='text'
              value={year_cols}
              onChange={(e) => setYear_cols(e.target.value)}
            />
          </div>
          <button type='submit'>
            Create Table
          </button>
        </form>
        
        {y_t_status && <p style={{marginTop: '15px'}}>{y_t_status}</p>}
      </div>
    </div>
  )
}