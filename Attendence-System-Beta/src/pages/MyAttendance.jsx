
import { useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";

export default function MyAttendance() {
  const [records] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("itca_attendance_records") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");

  const modules = [
    ...new Set(records.map((record) => record.module).filter(Boolean)),
  ];

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = [
        record.module,
        record.date,
        record.status,
        record.className,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        status === "All" ||
        String(record.status || "").toLowerCase() === status.toLowerCase();

      const matchesModule =
        moduleFilter === "All" || record.module === moduleFilter;

      return matchesSearch && matchesStatus && matchesModule;
    });
  }, [records, search, status, moduleFilter]);

  const present = records.filter(
    (record) => record.status?.toLowerCase() === "present"
  ).length;

  const attendanceRate =
    records.length > 0
      ? Math.round((present / records.length) * 100)
      : 0;

  function downloadCSV() {
    const columns = [
      "Module",
      "Date",
      "Scheduled Time",
      "Check-in Time",
      "Status",
    ];

    const rows = filteredRecords.map((record) => [
      record.module || "",
      record.date || "",
      record.scheduledTime || "",
      record.checkInTime || "",
      record.status || "",
    ]);

    const csv = [columns, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "itca-attendance.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout role="student" title="My Attendance">
      <section className="page-heading">
        <div>
          <span className="eyebrow">STUDENT SERVICES</span>
          <h2>My Attendance</h2>
          <p>Review your recorded class attendance.</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Recorded Classes</p>
          <strong>{records.length}</strong>
        </article>
        <article className="stat-card">
          <p>Present</p>
          <strong>{present}</strong>
        </article>
        <article className="stat-card">
          <p>Attendance Rate</p>
          <strong>{attendanceRate}%</strong>
        </article>
      </section>

      <section className="content-card">
        <div className="card-heading">
          <div>
            <h3>Attendance History</h3>
            <p>Search and filter your attendance records.</p>
          </div>
          <button type="button" onClick={downloadCSV}>
            Download CSV
          </button>
        </div>

        <div className="form-grid">
          <label>
            Search records
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search module, date or status"
            />
          </label>

          <label>
            Attendance status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All</option>
              <option>Present</option>
              <option>Late</option>
              <option>Absent</option>
              <option>Excused</option>
            </select>
          </label>

          <label>
            Module
            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
            >
              <option>All</option>
              {modules.map((module) => (
                <option key={module}>{module}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module / Class</th>
                <th>Date</th>
                <th>Scheduled Time</th>
                <th>Check-in Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <tr key={record.id || `${record.date}-${index}`}>
                  <td>{record.module || record.className || "—"}</td>
                  <td>{record.date || "—"}</td>
                  <td>{record.scheduledTime || "—"}</td>
                  <td>{record.checkInTime || "—"}</td>
                  <td>{record.status || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <p role="status">
            No attendance records are available for the selected filters.
          </p>
        )}
      </section>
    </Layout>
  );
}
