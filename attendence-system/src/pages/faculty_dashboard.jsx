import {supabase} from '../supabase'
import React,{useState, useEffect, useCallback} from 'react'

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


  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [schedule_status, setSchedule_status] = useState('')

  const [student_nr, setStudent_nr] = useState('')
  const [student_tables, setStudent_tables] = useState([])
  const [student_status, setStudent_status] = useState(null)
  const [student_refresh, setStudent_refresh] = useState(false)

  const fetchTables = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) setRefreshing(true);
      else setLoading(true)

      const {data, error} = await supabase.rpc('get_schedule_tables');

      if(error) throw error

      setTables(data.map((row) => row.table_name));
    }
    catch(err){
      console.error('Error fetching tables:', err.message);
    }
    finally{
      setLoading(false)
      setRefreshing(false)
    }
  }, []);

  const fetchStudentTables = useCallback(async (refresh = false) => {
    try {
      if (refresh) setStudent_refresh(true);
      else setStudent_status('Fetching Tables...')

      const {data, error} = await supabase.rpc('get_student_tables');

      if(error) throw error

      setStudent_tables(data.map((row) => row.table_name))
      setStudent_status('Tables Fetched')
    }
    catch(err){
      console.error('Error fetching tables:', err.message)
    }
    finally{
      setStudent_refresh(false)
    }
  }, []);
  

  useEffect(() => {
    fetchTables();
    fetchStudentTables();
  },[fetchTables, fetchStudentTables]);

  const handleDropdown = (e) => {
    setSelectedTable(e.target.value)
    console.log('Selected Table:', e.target.value)
  }

  const handleStudentDropdown = (e) => {
    setStudent_tables(e.target.value)
  }

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

  const ScheduleInsert = async (e) => {
    e.preventDefault();
    setSchedule_status('Inserting Schedule...');

    try {
      const {error} = await supabase.rpc('insert_schedule_tables', {
        table_name: selectedTable,
        start_date: startDate,
        end_date: endDate,
        custom_summary: summary,
        custom_category: category
      });

      if(error) throw error;

      setSchedule_status('Success! Schedule Updated')
    }
    catch(err){
      console.error('Error inserting schedule:', err.message);
      setSchedule_status(`Error: ${err.message}`);
    }
  }

  const studentInsert = async (e) => {
    e.preventDefault();
    setStudent_status('Inserting Student...')

    try {
      const {err} = await supabase.rpc('insert_student', {
        target_table: student_tables,
        search_student_nr: student_nr
      });

      if(err) throw err;

      setStudent_status(`Success! Student ${student_nr} inserted into student table`)
      setStudent_nr('')
    }
    catch(err){
      console.error('Error inserting student into table:', err.message);
      setStudent_status(`Error: ${err.message}`);
    }
  };

  
  return (
    <div className='page_style'>
      <h3>Temp Table Creation Page</h3>

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

      <div>
        <h3>Insert schedule</h3>
        <form onSubmit={ScheduleInsert}>
          <div>
            <label>Target table:</label>
            <select
              id='table-select'
              value={selectedTable}
              onChange={handleDropdown}
            >
              <option value="" disabled>
                -- Choose Table --
              </option>
              {tables.map((tableName) => (
                <option key={tableName} vlaue={tableName}>
                  {tableName}
                </option>
              ))}
            </select>
            <button onClick={() => fetchTables(true)} disabled={refreshing}>{refreshing ? 'Refreshing...' : '🔄 Refresh Tables'}</button>
            {selectedTable && (
              <p>Currently selected: <strong>{selectedTable}</strong></p>
            )}
          </div>

          <div>
            <label>Start Date:</label>
            <input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label>End Date:</label>
            <input
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div>
            <label>Summary:</label>
            <input 
              type='text'
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div>
            <label>Category:</label>
            <input
              type='text'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <button type='submit'>Inset Schedule</button>
        </form>
        {schedule_status && <p style={{marginTop: '15px'}}>{schedule_status}</p>}
      </div>

      <div>
        <h3>Insert Student Data</h3>
        <form onSubmit={studentInsert}>
          <div>
            <label>Select table:</label>
            <select
              value={student_tables}
              onChange={handleStudentDropdown}
            >
              <option value='' disabled>
                -- Choose Table --
              </option>
              {student_tables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
            <button onClick={() => fetchStudentTables(true)} disabled={refreshing}>{refreshing ? 'Refreshing...' : '🔄 Refresh Tables'}</button>
          </div>
          
          <div>
            <label>Student Number: </label>
            <input
              type='text'
              value={student_nr}
              onChange={(e) => setStudent_nr(e.target.value)}
            />
          </div>

          <button type='submit'>
            Enroll Student
          </button>
        </form>
        {student_status && <p style={{marginTop: '15px'}}>{student_status}</p>}
      </div>

      
    </div>
  )
}