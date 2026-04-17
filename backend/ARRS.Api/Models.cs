// =============================================================================
// FILE:    Models/Models.cs
// OWNER:   Thandeka (Attendance Engine & API Lead)
// PURPOSE: Defines every data entity (table) in the system.
//          These classes are the shared language across all three roles.
//          Mpho's DTOs wrap these. Ofentse's jobs read these.
//          Thandeka's engine writes to these.
// =============================================================================

using System;
using System.Collections.Generic;

namespace AttendanceSystem.Models
{
    // -------------------------------------------------------------------------
    // ENUM: UserRole
    // Controls what each person is allowed to see and do in the system.
    // Higher number = more access (used in role-based checks like role >= Admin).
    // -------------------------------------------------------------------------
    public enum UserRole
    {
        Student    = 0,
        Trainer    = 1,
        Admin      = 2,
        SuperAdmin = 3
    }

    // -------------------------------------------------------------------------
    // ENUM: AttendanceStatus
    // The status assigned to every attendance record.
    //   Present  → clocked in on time
    //   Late     → clocked in after the grace period (10 minutes)
    //   Absent   → never clocked in (set automatically when session ends)
    //   Excused  → manually overridden by a Trainer or Admin
    // -------------------------------------------------------------------------
    public enum AttendanceStatus
    {
        Present = 0,
        Absent  = 1,
        Late    = 2,
        Excused = 3
    }

    // -------------------------------------------------------------------------
    // CLASS: User
    // Every person in the system — Student, Trainer, Admin, or SuperAdmin.
    // Role determines access rights throughout all services.
    // -------------------------------------------------------------------------
    public class User
    {
        public int      UserId       { get; set; }
        public string   FullName     { get; set; }
        public string   Email        { get; set; }
        public string   PasswordHash { get; set; }   // Never stored as plain text
        public UserRole Role         { get; set; }
        public bool     IsActive     { get; set; } = true;
        public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;

        // Navigation: one user → many attendance records
        public List<AttendanceRecord> AttendanceRecords { get; set; } = new();
    }

    // -------------------------------------------------------------------------
    // CLASS: Session
    // A scheduled training or class block with a defined start and end time.
    // Only Trainers, Admins, and SuperAdmins can create sessions.
    // -------------------------------------------------------------------------
    public class Session
    {
        public int      SessionId   { get; set; }
        public string   SessionName { get; set; }
        public int      TrainerId   { get; set; }    // FK → Users.UserId
        public DateTime StartTime   { get; set; }
        public DateTime EndTime     { get; set; }
        public bool     IsActive    { get; set; } = true;

        // Navigation properties (populated by JOIN queries)
        public User                  Trainer          { get; set; }
        public List<AttendanceRecord> AttendanceRecords { get; set; } = new();
    }

    // -------------------------------------------------------------------------
    // CLASS: AttendanceRecord
    // One row per user per session.
    // Created when a user clocks in; updated when they clock out.
    // If they never clock in, Ofentse's background job creates an Absent record.
    // -------------------------------------------------------------------------
    public class AttendanceRecord
    {
        public int               RecordId     { get; set; }
        public int               UserId       { get; set; }
        public int               SessionId    { get; set; }
        public DateTime?         ClockInTime  { get; set; }  // Null until user clocks in
        public DateTime?         ClockOutTime { get; set; }  // Null until user clocks out
        public AttendanceStatus  Status       { get; set; }
        public string            Notes        { get; set; }  // Optional excuse/comment

        // Navigation properties
        public User    User    { get; set; }
        public Session Session { get; set; }
    }

    // -------------------------------------------------------------------------
    // CLASS: Alert
    // A notification stored in the DB and delivered to a user.
    // Generated automatically (e.g. low attendance) or manually by Admin/Trainer.
    // -------------------------------------------------------------------------
    public class Alert
    {
        public int      AlertId   { get; set; }
        public int      UserId    { get; set; }      // Who receives the alert
        public string   Message   { get; set; }
        public bool     IsRead    { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; }
    }

    // -------------------------------------------------------------------------
    // CLASS: AttendanceReport
    // Calculated summary — NOT stored in the DB.
    // Built by ReportService and returned as an API response via Mpho's DTOs.
    // -------------------------------------------------------------------------
    public class AttendanceReport
    {
        public int                   UserId               { get; set; }
        public string                FullName             { get; set; }
        public int                   TotalSessions        { get; set; }
        public int                   SessionsAttended     { get; set; }
        public int                   SessionsAbsent       { get; set; }
        public int                   SessionsLate         { get; set; }
        public double                AttendancePercentage { get; set; }
        public List<AttendanceRecord> DetailedRecords     { get; set; } = new();
    }
}
