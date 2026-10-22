import {supabase} from '../supabase'
import React,{useState} from 'react'

export default function Faculty_Dashboard() {
  const [year_table, setYear_table] = useState('');
  const [year_cols, setYear_cols] = useState('');
  const [y_t_status, setY_t_status] = useState('')

  const [insert_table, setInsert_table] = useState('')
  const [formData, setFormData] = useState({
    group: '',
    description: ''
  });
  const [insert_status, setInsert_status] = useState('');

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


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const InsertYearTable = async (e) => {
    e.preventDefault();
    setInsert_status('Inserting data...')

    try {
      const {error} = await supabase.rpc('insert_year_group', {
        year_table: insert_table,
        group_data: formData,
      });

      if(error) throw error

      setInsert_status(`Success! Data inserted into ${insert_table}`);
      setFormData({title: '', description: ''});
    }
    catch(err){
      console.error('Error inserting data:',err.message);
      setInsert_status(`Error: ${err.message}`);
    }
  };

  
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

      <div>
        <h3>Insert into year table</h3>
        <form onSubmit={InsertYearTable}>
          <div>
            <label>Target table:</label>
            <input
              type='text'
              value={insert_table}
              onChange={(i) => setInsert_table(i.target.value)}
            />
          </div>
          <div>
            <label>Group: </label>
            <input
              type='text'
              name='group'
              value={formData.group}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Description: </label>
            <input
              type='text'
              name='description'
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <button type='submit'>Insert Data</button>
        </form>
        {insert_status && <p style={{marginTop: '15px'}}>{insert_status}</p>}
      </div>
    </div>
  )
}