// =============================================================================
// FILE:    Services/AlertService.cs
// OWNER:   *** THANDEKA — Attendance Engine & API Lead ***
//
// PURPOSE: Creates, stores, and retrieves notification alerts.
//   ✔ SendAlert        — writes a new alert to the DB for a user
//   ✔ GetAlertsForUser — returns all unread alerts for a user
//   ✔ MarkAlertAsRead  — marks a single alert as read
//
// CALLED BY:
//   → AttendanceEngine (automatic low-attendance alerts)
//   → Ofentse's jobs (automated system notifications)
//   → Mpho's AlertController (API endpoints to read/dismiss alerts)
// =============================================================================

using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using AttendanceSystem.Data;
using AttendanceSystem.Models;

namespace AttendanceSystem.Services
{
    public class AlertService
    {
        private readonly DatabaseContext _db;
        private readonly AppLogger       _logger;

        public AlertService(DatabaseContext db, AppLogger logger)
        {
            _db     = db;
            _logger = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: SendAlert
        // Creates a new alert record for a user.
        // -------------------------------------------------------------------------
        public void SendAlert(int userId, string message)
        {
            string sql = @"
                INSERT INTO Alerts (UserId, Message)
                VALUES (@UserId, @Message)";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId",  userId);
            cmd.Parameters.AddWithValue("@Message", message);
            cmd.ExecuteNonQuery();

            _logger.Info("AlertService", $"Alert sent to User {userId}: {message}");
        }

        // -------------------------------------------------------------------------
        // METHOD: GetAlertsForUser
        // Returns all unread alerts for a user, newest first.
        // -------------------------------------------------------------------------
        public List<Alert> GetAlertsForUser(int userId)
        {
            string sql = @"
                SELECT * FROM Alerts
                WHERE UserId = @UserId AND IsRead = 0
                ORDER BY CreatedAt DESC";

            var alerts = new List<Alert>();

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                alerts.Add(new Alert
                {
                    AlertId   = (int)reader["AlertId"],
                    UserId    = (int)reader["UserId"],
                    Message   = reader["Message"].ToString(),
                    IsRead    = (bool)reader["IsRead"],
                    CreatedAt = (DateTime)reader["CreatedAt"]
                });
            }

            return alerts;
        }

        // -------------------------------------------------------------------------
        // METHOD: MarkAlertAsRead
        // Called when a user dismisses a notification.
        // -------------------------------------------------------------------------
        public void MarkAlertAsRead(int alertId)
        {
            string sql = "UPDATE Alerts SET IsRead = 1 WHERE AlertId = @AlertId";
            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@AlertId", alertId);
            cmd.ExecuteNonQuery();
        }
    }
}


// =============================================================================
// FILE:    Services/ReportService.cs (appended)
// OWNER:   *** THANDEKA — Attendance Engine & API Lead ***
//
// PURPOSE: Generates all attendance reports used by the system.
//   ✔ GenerateStudentReport   — one student's full attendance summary
//   ✔ GenerateSessionReport   — full register for one session
//   ✔ GenerateFullClassReport — all students sorted by attendance %
//
// CALLED BY:
//   → Mpho's ReportController for GET /api/reports/student/{id} etc.
//   → Ofentse's DailyReportJob for automated daily summaries
// =============================================================================

namespace AttendanceSystem.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Microsoft.Data.SqlClient;
    using AttendanceSystem.Data;
    using AttendanceSystem.Models;

    public class ReportService
    {
        private readonly DatabaseContext  _db;
        private readonly AttendanceEngine _engine;
        private readonly AppLogger        _logger;

        public ReportService(DatabaseContext db, AttendanceEngine engine, AppLogger logger)
        {
            _db     = db;
            _engine = engine;
            _logger = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: GenerateStudentReport
        // Full attendance summary for one student.
        // Students can ONLY view their own report.
        // Trainers, Admins, and SuperAdmins can view any student's report.
        // -------------------------------------------------------------------------
        public AttendanceReport GenerateStudentReport(int studentId, User requestingUser)
        {
            // Students may only access their own data
            if (requestingUser.Role == UserRole.Student && requestingUser.UserId != studentId)
            {
                _logger.Warning("ReportService",
                    $"Student {requestingUser.UserId} tried to view report for User {studentId}. Denied.");
                return null;
            }

            // Get student name
            string name = "";
            using (var cmd = new SqlCommand(
                "SELECT FullName FROM Users WHERE UserId = @Id", _db.GetConnection()))
            {
                cmd.Parameters.AddWithValue("@Id", studentId);
                name = cmd.ExecuteScalar()?.ToString() ?? "Unknown";
            }

            // Get all records for this student
            var records = _engine.GetRecordsByUser(studentId);

            int total    = records.Count;
            int attended = records.Count(r => r.Status is AttendanceStatus.Present
                                                       or AttendanceStatus.Late);
            int absent   = records.Count(r => r.Status == AttendanceStatus.Absent);
            int late     = records.Count(r => r.Status == AttendanceStatus.Late);
            double pct   = total == 0 ? 0 : Math.Round((double)attended / total * 100, 2);

            _logger.Info("ReportService",
                $"Report generated for User {studentId}: {pct}% ({attended}/{total})");

            return new AttendanceReport
            {
                UserId               = studentId,
                FullName             = name,
                TotalSessions        = total,
                SessionsAttended     = attended,
                SessionsAbsent       = absent,
                SessionsLate         = late,
                AttendancePercentage = pct,
                DetailedRecords      = records
            };
        }

        // -------------------------------------------------------------------------
        // METHOD: GenerateSessionReport
        // Returns the full register for one session.
        // Access: Trainer and above.
        // -------------------------------------------------------------------------
        public List<AttendanceRecord> GenerateSessionReport(int sessionId, User requestingUser)
        {
            if (requestingUser.Role < UserRole.Trainer)
            {
                _logger.Warning("ReportService", "GenerateSessionReport denied: insufficient role.");
                return null;
            }

            return _engine.GetRecordsBySession(sessionId);
        }

        // -------------------------------------------------------------------------
        // METHOD: GenerateFullClassReport
        // All students ranked by attendance % (lowest first = most at-risk).
        // Access: Admin and above.
        // -------------------------------------------------------------------------
        public List<AttendanceReport> GenerateFullClassReport(User requestingUser)
        {
            if (requestingUser.Role < UserRole.Admin)
            {
                _logger.Warning("ReportService", "GenerateFullClassReport denied: insufficient role.");
                return null;
            }

            var studentIds = new List<int>();
            using (var cmd = new SqlCommand(
                "SELECT UserId FROM Users WHERE Role = 0 AND IsActive = 1",
                _db.GetConnection()))
            using (var reader = cmd.ExecuteReader())
                while (reader.Read())
                    studentIds.Add((int)reader["UserId"]);

            var reports = studentIds
                .Select(id => GenerateStudentReport(id, requestingUser))
                .Where(r => r != null)
                .OrderBy(r => r.AttendancePercentage)
                .ToList();

            _logger.Info("ReportService",
                $"Full class report generated: {reports.Count} students.");

            return reports;
        }
    }
}
