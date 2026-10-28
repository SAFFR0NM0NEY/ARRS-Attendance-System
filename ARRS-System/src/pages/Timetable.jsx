
import { useState } from "react";
import Layout from "../components/Layout.jsx";

export default function Timetable() {
  const [classes] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itca_timetable") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredClasses = classes.filter((item) => {
    const searchable = [
      item.module,
      item.trainer,
      item.venue,
      item.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(search.toLowerCase()) &&
      (!dateFilter || item.date === dateFilter)
    );
  });

  return (
    <Layout role="student" title="Timetable">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC SCHEDULE</span>
          <h2>My Timetable</h2>
          <p>View your scheduled classes and practical sessions.</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Scheduled Classes</p>
          <strong>{classes.length}</strong>
        </article>
      </section>

      <section className="content-card">
        <h3>Class Schedule</h3>
        <p>Use the filters to find a scheduled session.</p>

        <div className="form-grid">
          <label>
            Search classes
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Module, trainer, venue..."
            />
          </label>

          <label>
            Filter by date
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Module</th>
                <th>Trainer</th>
                <th>Venue</th>
                <th>Session</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{item.date || "—"}</td>
                  <td>
                    {item.startTime || "—"} – {item.endTime || "—"}
                  </td>
                  <td>{item.module || "—"}</td>
                  <td>{item.trainer || "—"}</td>
                  <td>{item.venue || "—"}</td>
                  <td>{item.type || "Class"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClasses.length === 0 && (
          <p role="status">
            No timetable entries are available yet.
          </p>
        )}
      </section>
    </Layout>
  );
}
