
import { useState, useEffect} from "react";
import Layout from "../components/Layout.jsx";
import {supabase} from '../supabase.js'

export default function MyEnrolment() {
  {/*
  const [enrolment] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itca_enrolment") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");

  const filtered = enrolment.filter((item) =>
    [item.module, item.code, item.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  */}

  const [loading, setLoading] = useState(false)
  
  const [studentData, setStudentData] = useState([])
  const [studentStatus, setStudentStatus] = useState(null)

  const [groupData, setGroupData] = useState([])
  const [groupStatus, setGroupStatus] = useState(null)

  useEffect(() => {
    async function fetchStudentGroups(){
      setLoading(true)
      setStudentStatus(null)
      setGroupStatus(null)

      try {
        const {data: {user}, error: userError} = await supabase.auth.getUser()

        if(userError || !user?.id) throw new Error(`Error Fetching User`)

        const {data: student, error: studentError} = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', user.id);

        if(studentError) throw studentError

        setStudentData(student || [])
        setStudentStatus(!null)

        const enrolG = student?.[0]?.groups
        if(!Array.isArray(enrolG) || enrolG.length === 0){
          setGroupData([])
          setGroupStatus(!null)
          return;
        }

        try {
          const {data: group, error: groupError} = await supabase
            .from('group_table')
            .select('*')
            .in('group_id', enrolG);

          if(groupError) throw groupError

          setGroupData(group || [])
          setGroupStatus(!null)
        }
        catch(err){
          console.error(`Error Getting Groups, ${err.message}`)
          setGroupStatus(null)
        }
      }
      catch(err){
        console.error(`Error Getting User Data, ${err.message}`)
        setStudentStatus(null)
      }
      finally{
        setLoading(false)
      }
    }

    fetchStudentGroups();
  },[])

  return (
    <Layout role="student" title="Enrolment">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC RECORDS</span>
          <h2>My Enrolment</h2>
          <p>View your programme and registered modules.</p>
        </div>
      </section>

      <section className="content-card">
        {loading ? (
          <>
            <h3>Loading...</h3>
          </>
        ) : studentStatus === null ? (
          <>
            <h3>Something Went Wrong Getting User</h3>
          </>
        ) : groupStatus === null ? (
          <>
            <h3>Something Went Wrong Getting Your Data</h3>
          </>
        ) : (
          <>
            <h3>Enrolment Summary</h3>
            <div className="stats-grid">
              {groupData.map((group) => (
                <article className='stat-card'>
                  <strong>Group Name: {group.group_description}</strong>
                  <p>
                    Year: {group.group_year}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
        {/*
        <label>
          Search modules
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by module, code or status"
          />
        </label>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module Code</th>
                <th>Module</th>
                <th>Academic Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.code || "—"}</td>
                  <td>{item.module || "—"}</td>
                  <td>{item.academicYear || "—"}</td>
                  <td>{item.status || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p role="status">
            No enrolment records are available yet. Your registered
            modules will appear here when records are loaded.
          </p>
        )}
        */}
      </section>
    </Layout>
  );
}
