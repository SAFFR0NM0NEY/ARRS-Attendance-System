// =============================================================================
// FILE:    Jobs/BackgroundJobs.cs
// OWNER:   *** OFENTSE — Background Jobs, Automation & Logging ***
//
// PURPOSE: Automated background tasks that run on a schedule without any
//          human triggering them. These are the "invisible engine" of the system.
//
// WHAT OFENTSE OWNS:
//   ✔ MarkAbsenteesJob    — runs after each session ends; marks all no-shows
//   ✔ DailyReportJob      — runs once per day; logs attendance summary
//   ✔ AlertCleanupJob     — runs weekly; purges old read alerts
//   ✔ JobScheduler        — orchestrates when each job fires
//
// HOW JOBS WORK:
//   Each job is a class with a single Run() method.
//   The JobScheduler runs in a background thread, wakes up on a timer,
//   and calls each job's Run() at the right time.
//
// IN PRODUCTION:
//   Replace JobScheduler with Hangfire or Quartz.NET for robust scheduling.
//   For the class project, the built-in System.Threading.Timer is used.
//
// JOB SCHEDULE:
//   MarkAbsenteesJob  → every 5 minutes  (checks for ended sessions)
//   DailyReportJob    → every 24 hours   (daily summary log)
//   AlertCleanupJob   → every 7 days     (purge old alerts)
// =============================================================================

using System;
using System.Collections.Generic;
using System.Threading;
using Microsoft.Data.SqlClient;
using AttendanceSystem.Data;
using AttendanceSystem.Models;
using AttendanceSystem.Services;

namespace AttendanceSystem.Jobs
{
    // =========================================================================
    // JOB 1: MarkAbsenteesJob
    // =========================================================================
    // Runs every 5 minutes. Finds sessions that have ended and marks every
    // enrolled user who has NO attendance record as Absent.
    //
    // HOW IT WORKS:
    //   1. Queries Sessions where EndTime < NOW and IsActive = 1
    //   2. For each ended session, fetches the list of enrolled students
    //   3. Calls Thandeka's AttendanceEngine.MarkAbsenteesForSession()
    //   4. Logs the result
    // =========================================================================
    public class MarkAbsenteesJob
    {
        private readonly AttendanceEngine _engine;
        private readonly SessionService   _sessionService;
        private readonly DatabaseContext  _db;
        private readonly AppLogger        _logger;

        public MarkAbsenteesJob(
            AttendanceEngine engine,
            SessionService   sessionService,
            DatabaseContext  db,
            AppLogger        logger)
        {
            _engine         = engine;
            _sessionService = sessionService;
            _db             = db;
            _logger         = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: Run
        // Called by the JobScheduler on a timer.
        // -------------------------------------------------------------------------
        public void Run()
        {
            _logger.Info("MarkAbsenteesJob", "Job triggered — scanning for ended sessions.");

            try
            {
                // Fetch all sessions that have ended
                var endedSessions = _sessionService.GetEndedSessions();

                if (endedSessions.Count == 0)
                {
                    _logger.Info("MarkAbsenteesJob", "No ended sessions to process.");
                    return;
                }

                foreach (var session in endedSessions)
                {
                    // Get the list of all users enrolled/expected in this session
                    var enrolledIds = GetEnrolledUserIds(session.SessionId);

                    if (enrolledIds.Count == 0)
                    {
                        _logger.Info("MarkAbsenteesJob",
                            $"Session {session.SessionId} has no enrolled users. Skipping.");
                        continue;
                    }

                    // Call Thandeka's engine to mark no-shows
                    _engine.MarkAbsenteesForSession(session.SessionId, enrolledIds);

                    _logger.Info("MarkAbsenteesJob",
                        $"Processed session {session.SessionId} '{session.SessionName}' " +
                        $"— {enrolledIds.Count} users checked.");

                    // Mark the session as processed so this job doesn't run it again
                    MarkSessionProcessed(session.SessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.Error("MarkAbsenteesJob", $"Job failed: {ex.Message}");
            }
        }

        // -------------------------------------------------------------------------
        // Fetches all user IDs expected to attend a given session.
        // In a full system this would query an Enrollments table.
        // For the project, we fetch all active Students and Trainers.
        // -------------------------------------------------------------------------
        private List<int> GetEnrolledUserIds(int sessionId)
        {
            // Get all active students + trainers as "enrolled" population
            string sql = @"
                SELECT UserId FROM Users
                WHERE IsActive = 1 AND Role IN (0, 1)"; // 0=Student, 1=Trainer

            var ids = new List<int>();

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                ids.Add((int)reader["UserId"]);

            return ids;
        }

        // Deactivates a session once absentees have been marked, preventing reprocessing
        private void MarkSessionProcessed(int sessionId)
        {
            string sql = "UPDATE Sessions SET IsActive = 0 WHERE SessionId = @SessionId";
            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@SessionId", sessionId);
            cmd.ExecuteNonQuery();

            _logger.Info("MarkAbsenteesJob",
                $"Session {sessionId} marked as processed (IsActive = 0).");
        }
    }

    // =========================================================================
    // JOB 2: DailyReportJob
    // =========================================================================
    // Runs every 24 hours. Queries overall attendance statistics for the day
    // and writes a summary to the SystemLogs table for auditing.
    // =========================================================================
    public class DailyReportJob
    {
        private readonly DatabaseContext _db;
        private readonly AppLogger       _logger;

        public DailyReportJob(DatabaseContext db, AppLogger logger)
        {
            _db     = db;
            _logger = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: Run
        // -------------------------------------------------------------------------
        public void Run()
        {
            _logger.Info("DailyReportJob", "Daily report job triggered.");

            try
            {
                DateTime today = DateTime.UtcNow.Date;

                // Count records created today
                string sql = @"
                    SELECT
                        COUNT(*)                                                       AS Total,
                        SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END)                   AS Present,
                        SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END)                   AS Absent,
                        SUM(CASE WHEN Status = 2 THEN 1 ELSE 0 END)                   AS Late,
                        SUM(CASE WHEN Status = 3 THEN 1 ELSE 0 END)                   AS Excused
                    FROM AttendanceRecords ar
                    JOIN Sessions s ON ar.SessionId = s.SessionId
                    WHERE CAST(s.StartTime AS DATE) = @Today";

                using var cmd = new SqlCommand(sql, _db.GetConnection());
                cmd.Parameters.AddWithValue("@Today", today);

                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    int total   = (int)reader["Total"];
                    int present = (int)reader["Present"];
                    int absent  = (int)reader["Absent"];
                    int late    = (int)reader["Late"];
                    int excused = (int)reader["Excused"];

                    double pct = total == 0 ? 0 :
                        Math.Round((double)(present + late) / total * 100, 1);

                    string summary =
                        $"DAILY SUMMARY [{today:yyyy-MM-dd}] | " +
                        $"Total: {total} | Present: {present} | " +
                        $"Late: {late} | Absent: {absent} | " +
                        $"Excused: {excused} | Attendance Rate: {pct}%";

                    _logger.Info("DailyReportJob", summary);
                }
            }
            catch (Exception ex)
            {
                _logger.Error("DailyReportJob", $"Job failed: {ex.Message}");
            }
        }
    }

    // =========================================================================
    // JOB 3: AlertCleanupJob
    // =========================================================================
    // Runs every 7 days. Deletes alerts that have been read and are older
    // than 30 days. Keeps the Alerts table from growing indefinitely.
    // =========================================================================
    public class AlertCleanupJob
    {
        private readonly DatabaseContext _db;
        private readonly AppLogger       _logger;

        public AlertCleanupJob(DatabaseContext db, AppLogger logger)
        {
            _db     = db;
            _logger = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: Run
        // -------------------------------------------------------------------------
        public void Run()
        {
            _logger.Info("AlertCleanupJob", "Alert cleanup job triggered.");

            try
            {
                // Delete alerts that are read AND older than 30 days
                string sql = @"
                    DELETE FROM Alerts
                    WHERE IsRead = 1
                      AND CreatedAt < @Cutoff";

                DateTime cutoff = DateTime.UtcNow.AddDays(-30);

                using var cmd = new SqlCommand(sql, _db.GetConnection());
                cmd.Parameters.AddWithValue("@Cutoff", cutoff);

                int deleted = cmd.ExecuteNonQuery();

                _logger.Info("AlertCleanupJob",
                    $"Cleanup complete. {deleted} old alerts removed.");
            }
            catch (Exception ex)
            {
                _logger.Error("AlertCleanupJob", $"Job failed: {ex.Message}");
            }
        }
    }

    // =========================================================================
    // JOB SCHEDULER
    // =========================================================================
    // Coordinates when each job runs using System.Threading.Timer.
    // Start() is called once from Program.cs at application startup.
    //
    // IMPORTANT: In a production app, replace this with Hangfire or Quartz.NET
    //            for persistence, retries, and a management dashboard.
    // =========================================================================
    public class JobScheduler
    {
        private readonly MarkAbsenteesJob _markAbsenteesJob;
        private readonly DailyReportJob   _dailyReportJob;
        private readonly AlertCleanupJob  _alertCleanupJob;
        private readonly AppLogger        _logger;

        // Timer handles — kept alive as fields so they are not garbage collected
        private Timer _absenteeTimer;
        private Timer _dailyTimer;
        private Timer _cleanupTimer;

        public JobScheduler(
            MarkAbsenteesJob markAbsenteesJob,
            DailyReportJob   dailyReportJob,
            AlertCleanupJob  alertCleanupJob,
            AppLogger        logger)
        {
            _markAbsenteesJob = markAbsenteesJob;
            _dailyReportJob   = dailyReportJob;
            _alertCleanupJob  = alertCleanupJob;
            _logger           = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: Start
        // Called once from Program.cs. Registers all job timers.
        // -------------------------------------------------------------------------
        public void Start()
        {
            _logger.Info("JobScheduler", "Starting background job scheduler...");

            // MarkAbsenteesJob — fires immediately, then every 5 minutes
            _absenteeTimer = new Timer(
                _ => _markAbsenteesJob.Run(),
                null,
                TimeSpan.Zero,                  // Start immediately
                TimeSpan.FromMinutes(5)          // Repeat every 5 minutes
            );

            // DailyReportJob — fires immediately, then every 24 hours
            _dailyTimer = new Timer(
                _ => _dailyReportJob.Run(),
                null,
                TimeSpan.Zero,
                TimeSpan.FromHours(24)
            );

            // AlertCleanupJob — fires after 1 hour, then every 7 days
            _cleanupTimer = new Timer(
                _ => _alertCleanupJob.Run(),
                null,
                TimeSpan.FromHours(1),           // Delay first run by 1 hour
                TimeSpan.FromDays(7)             // Repeat weekly
            );

            _logger.Info("JobScheduler", "All background jobs scheduled and running.");
        }

        // -------------------------------------------------------------------------
        // METHOD: Stop
        // Cleanly shuts down all timers on application exit.
        // -------------------------------------------------------------------------
        public void Stop()
        {
            _absenteeTimer?.Dispose();
            _dailyTimer?.Dispose();
            _cleanupTimer?.Dispose();
            _logger.Info("JobScheduler", "All background jobs stopped.");
        }
    }
}
