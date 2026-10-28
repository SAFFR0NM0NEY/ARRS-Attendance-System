
import { useState } from "react";
import Layout from "../components/Layout.jsx";

export default function MyEnrolment() {
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

  return (
    <Layout role="student" title="My Enrolment">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC RECORDS</span>
          <h2>My Enrolment</h2>
          <p>View your programme and registered modules.</p>
        </div>
      </section>

      <section className="content-card">
        <h3>Enrolment Summary</h3>
        <div className="stats-grid">
          <article className="stat-card">
            <p>Registered Modules</p>
            <strong>{enrolment.length}</strong>
          </article>
        </div>

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
      </section>
    </Layout>
  );
}
