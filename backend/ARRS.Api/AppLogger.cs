// =============================================================================
// FILE:    Logging/AppLogger.cs
// OWNER:   *** OFENTSE — Background Jobs, Automation & Logging ***
//
// PURPOSE: Central logging service for the entire system.
//          Every service and job logs through this class.
//
// WHAT OFENTSE OWNS:
//   ✔ AppLogger   — writes INFO / WARNING / ERROR to console + SQL Server
//   ✔ Log levels  — control what gets stored vs just printed
//   ✔ Source tags — every log entry knows which service wrote it
//
// HOW IT WORKS:
//   1. Every service receives AppLogger via constructor injection
//   2. Services call _logger.Info / _logger.Warning / _logger.Error
//   3. AppLogger writes to Console AND inserts a row in SystemLogs table
//
// LOG LEVELS:
//   INFO    → normal operations (user clocked in, session created)
//   WARNING → soft failures (access denied, duplicate clock-in)
//   ERROR   → unexpected crashes or exceptions
// =============================================================================

using System;
using Microsoft.Data.SqlClient;
using AttendanceSystem.Data;

namespace AttendanceSystem.Services
{
    public class AppLogger
    {
        private readonly DatabaseContext _db;

        public AppLogger(DatabaseContext db)
        {
            _db = db;
        }

        // -------------------------------------------------------------------------
        // METHOD: Info
        // Standard operational log. Written to console + DB.
        // -------------------------------------------------------------------------
        public void Info(string source, string message)
        {
            WriteLog("INFO", source, message);
        }

        // -------------------------------------------------------------------------
        // METHOD: Warning
        // Soft failure — access denied, bad input, validation issues.
        // -------------------------------------------------------------------------
        public void Warning(string source, string message)
        {
            WriteLog("WARNING", source, message);
        }

        // -------------------------------------------------------------------------
        // METHOD: Error
        // Unexpected exception or critical failure.
        // -------------------------------------------------------------------------
        public void Error(string source, string message)
        {
            WriteLog("ERROR", source, message);
        }

        // -------------------------------------------------------------------------
        // METHOD: WriteLog (private)
        // Writes to the console with a timestamp and stores it in SystemLogs.
        // -------------------------------------------------------------------------
        private void WriteLog(string level, string source, string message)
        {
            string timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
            string logLine   = $"[{timestamp}] [{level,-7}] [{source}] {message}";

            // --- Write to console (colour-coded by level) ---
            Console.ForegroundColor = level switch
            {
                "ERROR"   => ConsoleColor.Red,
                "WARNING" => ConsoleColor.Yellow,
                _         => ConsoleColor.Cyan
            };
            Console.WriteLine(logLine);
            Console.ResetColor();

            // --- Persist to SystemLogs table ---
            try
            {
                string sql = @"
                    INSERT INTO SystemLogs (Level, Source, Message)
                    VALUES (@Level, @Source, @Message)";

                using var cmd = new SqlCommand(sql, _db.GetConnection());
                cmd.Parameters.AddWithValue("@Level",   level);
                cmd.Parameters.AddWithValue("@Source",  source);
                cmd.Parameters.AddWithValue("@Message", message);
                cmd.ExecuteNonQuery();
            }
            catch
            {
                // If the DB is unavailable, we still have the console output.
                // Never let logging crash the application.
                Console.WriteLine("[AppLogger] Could not persist log to database.");
            }
        }
    }
}
