// =============================================================================
// FILE:    Services/AttendanceEngine.cs
// OWNER:   *** THANDEKA — Attendance Engine & API Lead ***
//
// PURPOSE: This is the CORE ENGINE of the entire system.
//          Every attendance action flows through this class.
//
// RESPONSIBILITIES:
//   ✔ ClockIn    — user marks their arrival at a session
//   ✔ ClockOut   — user marks their departure from a session
//   ✔ MarkAbsentees — bulk-marks no-shows after a session ends
//   ✔ ExcuseAbsence — Trainer/Admin overrides an Absent to Excused
//   ✔ Status logic — Present / Late / Absent / Excused rules
//   ✔ Low attendance detection → triggers alerts
//
// USED BY:
//   → Mpho's AttendanceController calls ClockIn/ClockOut/ExcuseAbsence
//   → Ofentse's MarkAbsenteesJob calls MarkAbsenteesForSession
//   → ReportService reads records written here
//
// CLOCK-IN STATUS RULES:
//   ┌──────────────────────────────────────────────────────────┐
//   │ Clocked in ≤ 10 min after start   → Present             │
//   │ Clocked in > 10 min after start   → Late                │
//   │ Never clocked in (session ended)  → Absent (by job)     │
//   │ Manually overridden               → Excused             │
//   └──────────────────────────────────────────────────────────┘
// =============================================================================

using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using AttendanceSystem.Data;
using AttendanceSystem.Models;

namespace AttendanceSystem.Services
{
    public class AttendanceEngine
    {
        private readonly DatabaseContext _db;
        private readonly AlertService    _alertService;
        private readonly AppLogger       _logger;

        // How many minutes after session start before a student is marked "Late"
        private const int    LATE_GRACE_MINUTES        = 10;

        // If attendance % falls below this, an alert is sent to the student
        private const double LOW_ATTENDANCE_THRESHOLD  = 75.0;

        // -------------------------------------------------------------------------
        // CONSTRUCTOR — receives all dependencies via injection
        // -------------------------------------------------------------------------
        public AttendanceEngine(
            DatabaseContext db,
            AlertService    alertService,
            AppLogger       logger)
        {
            _db           = db;
            _alertService = alertService;
            _logger       = logger;
        }

        // =========================================================================
        // METHOD: ClockIn
        // =========================================================================
        // Called when a user (student or trainer) arrives at a session.
        //
        // VALIDATION CHECKS (in order):
        //   1. Session must exist and be active
        //   2. Cannot clock in before the session has started
        //   3. Cannot clock in after the session has ended
        //   4. Cannot clock in twice to the same session
        //
        // STATUS ASSIGNED:
        //   Present → clocked in within the grace period
        //   Late    → clocked in after the grace period
        //
        // RETURNS: true if successful, false if any validation fails
        // =========================================================================
        public bool ClockIn(int userId, int sessionId)
        {
            DateTime now = DateTime.UtcNow;

            // --- Validation 1: session must exist and be active ---
            var session = GetSessionById(sessionId);
            if (session == null || !session.IsActive)
            {
                _logger.Warning("AttendanceEngine",
                    $"ClockIn failed: Session {sessionId} not found or inactive.");
                return false;
            }

            // --- Validation 2: cannot clock in before session starts ---
            if (now < session.StartTime)
            {
                _logger.Warning("AttendanceEngine",
                    $"ClockIn failed: Session {sessionId} has not started yet.");
                return false;
            }

            // --- Validation 3: cannot clock in after session ends ---
            if (now > session.EndTime)
            {
                _logger.Warning("AttendanceEngine",
                    $"ClockIn failed: Session {sessionId} has already ended.");
                return false;
            }

            // --- Validation 4: prevent duplicate clock-ins ---
            if (RecordExists(userId, sessionId))
            {
                _logger.Warning("AttendanceEngine",
                    $"ClockIn failed: User {userId} already has a record for session {sessionId}.");
                return false;
            }

            // --- Determine status: Present or Late ---
            AttendanceStatus status = (now > session.StartTime.AddMinutes(LATE_GRACE_MINUTES))
                ? AttendanceStatus.Late
                : AttendanceStatus.Present;

            // --- Insert the attendance record ---
            string sql = @"
                INSERT INTO AttendanceRecords (UserId, SessionId, ClockInTime, Status)
                VALUES (@UserId, @SessionId, @ClockInTime, @Status)";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId",      userId);
            cmd.Parameters.AddWithValue("@SessionId",   sessionId);
            cmd.Parameters.AddWithValue("@ClockInTime", now);
            cmd.Parameters.AddWithValue("@Status",      (int)status);

            bool success = cmd.ExecuteNonQuery() > 0;

            if (success)
                _logger.Info("AttendanceEngine",
                    $"User {userId} clocked IN to session {sessionId}. Status: {status}");

            return success;
        }

        // =========================================================================
        // METHOD: ClockOut
        // =========================================================================
        // Called when a user leaves a session.
        // Updates the existing record with a ClockOutTime.
        //
        // VALIDATION CHECKS:
        //   1. A clock-in record must already exist
        //   2. Cannot clock out twice
        //
        // RETURNS: true if successful, false if any validation fails
        // =========================================================================
        public bool ClockOut(int userId, int sessionId)
        {
            DateTime now = DateTime.UtcNow;

            // --- Validation 1: must have a clock-in record first ---
            var record = GetRecord(userId, sessionId);
            if (record == null)
            {
                _logger.Warning("AttendanceEngine",
                    $"ClockOut failed: No clock-in record for User {userId} in session {sessionId}.");
                return false;
            }

            // --- Validation 2: cannot clock out twice ---
            if (record.ClockOutTime.HasValue)
            {
                _logger.Warning("AttendanceEngine",
                    $"ClockOut failed: User {userId} already clocked out of session {sessionId}.");
                return false;
            }

            // --- Update the record with clock-out time ---
            string sql = @"
                UPDATE AttendanceRecords
                SET    ClockOutTime = @ClockOutTime
                WHERE  UserId = @UserId AND SessionId = @SessionId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@ClockOutTime", now);
            cmd.Parameters.AddWithValue("@UserId",       userId);
            cmd.Parameters.AddWithValue("@SessionId",    sessionId);

            bool success = cmd.ExecuteNonQuery() > 0;

            if (success)
                _logger.Info("AttendanceEngine",
                    $"User {userId} clocked OUT of session {sessionId}.");

            return success;
        }

        // =========================================================================
        // METHOD: MarkAbsenteesForSession
        // =========================================================================
        // Called by Ofentse's MarkAbsenteesJob after a session ends.
        // Any enrolled user with NO record in AttendanceRecords is marked Absent.
        //
        // PARAMETERS:
        //   sessionId        → the session that has ended
        //   enrolledUserIds  → all user IDs that were supposed to attend
        // =========================================================================
        public void MarkAbsenteesForSession(int sessionId, List<int> enrolledUserIds)
        {
            _logger.Info("AttendanceEngine",
                $"Marking absentees for session {sessionId}. Checking {enrolledUserIds.Count} users.");

            foreach (int userId in enrolledUserIds)
            {
                // Only mark absent if NO record exists at all
                if (!RecordExists(userId, sessionId))
                {
                    string sql = @"
                        INSERT INTO AttendanceRecords (UserId, SessionId, Status)
                        VALUES (@UserId, @SessionId, @Status)";

                    using var cmd = new SqlCommand(sql, _db.GetConnection());
                    cmd.Parameters.AddWithValue("@UserId",    userId);
                    cmd.Parameters.AddWithValue("@SessionId", sessionId);
                    cmd.Parameters.AddWithValue("@Status",    (int)AttendanceStatus.Absent);
                    cmd.ExecuteNonQuery();

                    _logger.Info("AttendanceEngine",
                        $"User {userId} marked ABSENT for session {sessionId}.");

                    // Check if this absence triggers a low-attendance alert
                    TriggerLowAttendanceAlertIfNeeded(userId);
                }
            }
        }

        // =========================================================================
        // METHOD: ExcuseAbsence
        // =========================================================================
        // Allows a Trainer or Admin to change a student's status from Absent
        // to Excused with an optional reason/note.
        //
        // ACCESS: Trainer, Admin, SuperAdmin only (not Students)
        //
        // RETURNS: true if the record was updated successfully
        // =========================================================================
        public bool ExcuseAbsence(int userId, int sessionId, string reason, User requestingUser)
        {
            // --- Role check: only Trainer or above ---
            if (requestingUser.Role < UserRole.Trainer)
            {
                _logger.Warning("AttendanceEngine",
                    $"ExcuseAbsence denied: User {requestingUser.UserId} has insufficient role.");
                return false;
            }

            string sql = @"
                UPDATE AttendanceRecords
                SET    Status = @Status,
                       Notes  = @Notes
                WHERE  UserId = @UserId AND SessionId = @SessionId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@Status",    (int)AttendanceStatus.Excused);
            cmd.Parameters.AddWithValue("@Notes",     reason ?? "Excused by staff");
            cmd.Parameters.AddWithValue("@UserId",    userId);
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            bool success = cmd.ExecuteNonQuery() > 0;

            if (success)
                _logger.Info("AttendanceEngine",
                    $"User {userId} excused for session {sessionId} by User {requestingUser.UserId}.");

            return success;
        }

        // =========================================================================
        // PUBLIC READ METHODS — used by ReportService and Mpho's Controllers
        // =========================================================================

        // Returns the single attendance record for one user in one session
        public AttendanceRecord GetRecord(int userId, int sessionId)
        {
            string sql = @"
                SELECT * FROM AttendanceRecords
                WHERE UserId = @UserId AND SessionId = @SessionId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId",    userId);
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            using var reader = cmd.ExecuteReader();
            return reader.Read() ? MapRecord(reader) : null;
        }

        // Returns all attendance records for a specific user (their full history)
        public List<AttendanceRecord> GetRecordsByUser(int userId)
        {
            string sql = @"
                SELECT * FROM AttendanceRecords
                WHERE UserId = @UserId
                ORDER BY RecordId DESC";

            var records = new List<AttendanceRecord>();

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                records.Add(MapRecord(reader));

            return records;
        }

        // Returns all attendance records for a specific session (the class register)
        public List<AttendanceRecord> GetRecordsBySession(int sessionId)
        {
            string sql = @"
                SELECT * FROM AttendanceRecords
                WHERE SessionId = @SessionId";

            var records = new List<AttendanceRecord>();

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                records.Add(MapRecord(reader));

            return records;
        }

        // =========================================================================
        // PRIVATE HELPERS
        // =========================================================================

        // Checks whether a record already exists for a user/session pair
        private bool RecordExists(int userId, int sessionId)
        {
            string sql = @"
                SELECT COUNT(1) FROM AttendanceRecords
                WHERE UserId = @UserId AND SessionId = @SessionId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId",    userId);
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            return (int)cmd.ExecuteScalar() > 0;
        }

        // Fetches a session record needed for time-based validation
        private Session GetSessionById(int sessionId)
        {
            string sql = "SELECT * FROM Sessions WHERE SessionId = @SessionId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return null;

            return new Session
            {
                SessionId   = (int)reader["SessionId"],
                SessionName = reader["SessionName"].ToString(),
                TrainerId   = (int)reader["TrainerId"],
                StartTime   = (DateTime)reader["StartTime"],
                EndTime     = (DateTime)reader["EndTime"],
                IsActive    = (bool)reader["IsActive"]
            };
        }

        // Calculates attendance % and sends an alert if below the threshold
        private void TriggerLowAttendanceAlertIfNeeded(int userId)
        {
            string sql = @"
                SELECT
                    COUNT(*)                                                    AS Total,
                    SUM(CASE WHEN Status IN (0,2,3) THEN 1 ELSE 0 END)         AS Attended
                FROM AttendanceRecords
                WHERE UserId = @UserId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return;

            int total    = (int)reader["Total"];
            int attended = (int)reader["Attended"];
            if (total == 0) return;

            double pct = (double)attended / total * 100;

            if (pct < LOW_ATTENDANCE_THRESHOLD)
            {
                string msg = $"⚠️ Attendance Warning: Your attendance is {pct:F1}% " +
                             $"({attended}/{total} sessions). Minimum required is " +
                             $"{LOW_ATTENDANCE_THRESHOLD}%.";

                _alertService.SendAlert(userId, msg);

                _logger.Warning("AttendanceEngine",
                    $"Low attendance alert sent to User {userId}: {pct:F1}%");
            }
        }

        // Maps a SqlDataReader row to an AttendanceRecord object
        private AttendanceRecord MapRecord(SqlDataReader r)
        {
            return new AttendanceRecord
            {
                RecordId     = (int)r["RecordId"],
                UserId       = (int)r["UserId"],
                SessionId    = (int)r["SessionId"],
                ClockInTime  = r["ClockInTime"]  == DBNull.Value ? null : (DateTime?)r["ClockInTime"],
                ClockOutTime = r["ClockOutTime"] == DBNull.Value ? null : (DateTime?)r["ClockOutTime"],
                Status       = (AttendanceStatus)(int)r["Status"],
                Notes        = r["Notes"] == DBNull.Value ? null : r["Notes"].ToString()
            };
        }
    }
}
