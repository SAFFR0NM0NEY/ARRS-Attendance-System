
import { useState } from "react";
import Layout from "../components/Layout.jsx";

export default function Reports() {
  const [records] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itca_attendance_records") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = records.filter((record) => {
    const date = record.date || "";
    return (
      (!fromDate || date >= fromDate) &&
      (!toDate || date <= toDate)
    );
  });

  const present = filtered.filter(
    (record) => record.status?.toLowerCase() === "present"
  ).length;

  const attendanceRate =
    filtered.length > 0
      ? Math.round((present / filtered.length) * 100)
      : 0;

  function downloadReport() {
    const header = "Date,Module,Status";
    const rows = filtered.map((record) =>
      [record.date, record.module, record.status]
        .map((value) =>
          `"${String(value || "").replace(/"/g, '""')}"`
        )
        .join(",")
    );

    const blob = new Blob(
      ["\uFEFF" + [header, ...rows].join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "itca-attendance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout role="student" title="Reports">
      <section className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC PERFORMANCE</span>
          <h2>Attendance Reports</h2>
          <p>Review your attendance statistics and records.</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Sessions</p>
          <strong>{filtered.length}</strong>
        </article>
        <article className="stat-card">
          <p>Present Sessions</p>
          <strong>{present}</strong>
        </article>
        <article className="stat-card">
          <p>Attendance Rate</p>
          <strong>{attendanceRate}%</strong>
        </article>
      </section>

      <section className="content-card">
        <h3>Report Filters</h3>

        <div className="form-grid">
          <label>
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label>
            To date
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>

        <button type="button" onClick={downloadReport}>
          Download Report (CSV)
        </button>

        <h3>Report Records</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Module</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <tr key={record.id || index}>
                  <td>{record.date || "—"}</td>
                  <td>{record.module || "—"}</td>
                  <td>{record.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p role="status">No report data is available yet.</p>
        )}
      </section>
    </Layout>
  );
}
