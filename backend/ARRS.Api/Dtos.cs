// =============================================================================
// FILE:    DTOs/Dtos.cs
// OWNER:   *** MPHO — Controllers, DTO Validation & API Responses ***
//
// PURPOSE: Data Transfer Objects (DTOs) define the exact shape of data that
//          enters and exits the API.
//
// WHY DTOs EXIST:
//   - They separate the internal model (database entity) from what the API
//     exposes — you never return raw database objects to clients.
//   - They carry validation rules (e.g. [Required], [EmailAddress]) so bad
//     data is rejected BEFORE it reaches any service or database.
//   - They prevent over-posting attacks where a user sends extra fields.
//
// NAMING CONVENTION:
//   Request DTOs → used in POST/PUT bodies     e.g. LoginRequest
//   Response DTOs → returned in API responses  e.g. UserResponse
// =============================================================================

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using AttendanceSystem.Models;

namespace AttendanceSystem.DTOs
{
    // =========================================================================
    // AUTH DTOs
    // =========================================================================

    // POST /api/auth/register
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(150, MinimumLength = 2, ErrorMessage = "Name must be 2–150 characters.")]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
        public string Password { get; set; }

        // Role is set by Admins/SuperAdmins — not chosen freely by the user
        [Range(0, 3, ErrorMessage = "Invalid role value.")]
        public int Role { get; set; } = 0; // Default: Student
    }

    // POST /api/auth/login
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; }
    }

    // Response returned after a successful login
    public class LoginResponse
    {
        public int    UserId   { get; set; }
        public string FullName { get; set; }
        public string Email    { get; set; }
        public string Role     { get; set; }   // "Student", "Trainer", etc.
        public string Token    { get; set; }   // JWT token (future implementation)
    }

    // =========================================================================
    // USER DTOs
    // =========================================================================

    // GET /api/users/{id}  — safe user profile (no password hash exposed)
    public class UserResponse
    {
        public int    UserId    { get; set; }
        public string FullName  { get; set; }
        public string Email     { get; set; }
        public string Role      { get; set; }
        public bool   IsActive  { get; set; }
        public string CreatedAt { get; set; }
    }

    // =========================================================================
    // SESSION DTOs
    // =========================================================================

    // POST /api/sessions — create a new session
    public class CreateSessionRequest
    {
        [Required(ErrorMessage = "Session name is required.")]
        [StringLength(200, MinimumLength = 3)]
        public string SessionName { get; set; }

        [Required(ErrorMessage = "Trainer ID is required.")]
        public int TrainerId { get; set; }

        [Required(ErrorMessage = "Start time is required.")]
        public DateTime StartTime { get; set; }

        [Required(ErrorMessage = "End time is required.")]
        public DateTime EndTime { get; set; }
    }

    // GET /api/sessions/{id}
    public class SessionResponse
    {
        public int    SessionId   { get; set; }
        public string SessionName { get; set; }
        public int    TrainerId   { get; set; }
        public string TrainerName { get; set; }
        public string StartTime   { get; set; }
        public string EndTime     { get; set; }
        public bool   IsActive    { get; set; }
        public string Status      { get; set; } // "Upcoming", "Active", "Ended"
    }

    // =========================================================================
    // ATTENDANCE DTOs
    // =========================================================================

    // POST /api/attendance/clockin
    public class ClockInRequest
    {
        [Required(ErrorMessage = "User ID is required.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Session ID is required.")]
        public int SessionId { get; set; }
    }

    // POST /api/attendance/clockout
    public class ClockOutRequest
    {
        [Required(ErrorMessage = "User ID is required.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Session ID is required.")]
        public int SessionId { get; set; }
    }

    // POST /api/attendance/excuse
    public class ExcuseAbsenceRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int SessionId { get; set; }

        [StringLength(500)]
        public string Reason { get; set; }
    }

    // GET /api/attendance/record
    public class AttendanceRecordResponse
    {
        public int    RecordId     { get; set; }
        public int    UserId       { get; set; }
        public string UserName     { get; set; }
        public int    SessionId    { get; set; }
        public string SessionName  { get; set; }
        public string ClockInTime  { get; set; }
        public string ClockOutTime { get; set; }
        public string Status       { get; set; }
        public string Notes        { get; set; }
    }

    // =========================================================================
    // REPORT DTOs
    // =========================================================================

    // GET /api/reports/student/{id}
    public class StudentReportResponse
    {
        public int    UserId               { get; set; }
        public string FullName             { get; set; }
        public int    TotalSessions        { get; set; }
        public int    SessionsAttended     { get; set; }
        public int    SessionsAbsent       { get; set; }
        public int    SessionsLate         { get; set; }
        public double AttendancePercentage { get; set; }
        public string AttendanceRating     { get; set; }  // "Good", "At Risk", "Critical"
        public List<AttendanceRecordResponse> Records { get; set; }
    }

    // =========================================================================
    // ALERT DTOs
    // =========================================================================

    // GET /api/alerts/{userId}
    public class AlertResponse
    {
        public int    AlertId   { get; set; }
        public string Message   { get; set; }
        public bool   IsRead    { get; set; }
        public string CreatedAt { get; set; }
    }

    // =========================================================================
    // SHARED API WRAPPER
    // All API responses are wrapped in this for consistent structure.
    //
    // SUCCESS shape: { success: true,  data: { ... },  message: "OK" }
    // FAILURE shape: { success: false, data: null,     message: "Error detail" }
    // =========================================================================
    public class ApiResponse<T>
    {
        public bool   Success { get; set; }
        public string Message { get; set; }
        public T      Data    { get; set; }

        // Factory: creates a success response
        public static ApiResponse<T> Ok(T data, string message = "Success") =>
            new ApiResponse<T> { Success = true, Message = message, Data = data };

        // Factory: creates an error response
        public static ApiResponse<T> Fail(string message) =>
            new ApiResponse<T> { Success = false, Message = message, Data = default };
    }

    // =========================================================================
    // DTO MAPPER
    // Converts raw Model objects into safe, clean DTOs for API responses.
    // Mpho owns this — keeps all mapping logic in one place.
    // =========================================================================
    public static class DtoMapper
    {
        // Map User → UserResponse (strips password hash)
        public static UserResponse ToUserResponse(User u) => new UserResponse
        {
            UserId    = u.UserId,
            FullName  = u.FullName,
            Email     = u.Email,
            Role      = u.Role.ToString(),
            IsActive  = u.IsActive,
            CreatedAt = u.CreatedAt.ToString("yyyy-MM-dd HH:mm")
        };

        // Map Session → SessionResponse
        public static SessionResponse ToSessionResponse(Session s) => new SessionResponse
        {
            SessionId   = s.SessionId,
            SessionName = s.SessionName,
            TrainerId   = s.TrainerId,
            StartTime   = s.StartTime.ToString("yyyy-MM-dd HH:mm"),
            EndTime     = s.EndTime.ToString("yyyy-MM-dd HH:mm"),
            IsActive    = s.IsActive,
            Status      = DateTime.UtcNow < s.StartTime ? "Upcoming"
                        : DateTime.UtcNow > s.EndTime   ? "Ended"
                        : "Active"
        };

        // Map AttendanceRecord → AttendanceRecordResponse
        public static AttendanceRecordResponse ToRecordResponse(AttendanceRecord r) =>
            new AttendanceRecordResponse
            {
                RecordId     = r.RecordId,
                UserId       = r.UserId,
                SessionId    = r.SessionId,
                ClockInTime  = r.ClockInTime?.ToString("HH:mm") ?? "—",
                ClockOutTime = r.ClockOutTime?.ToString("HH:mm") ?? "—",
                Status       = r.Status.ToString(),
                Notes        = r.Notes ?? ""
            };

        // Map AttendanceReport → StudentReportResponse
        public static StudentReportResponse ToStudentReport(AttendanceReport r) =>
            new StudentReportResponse
            {
                UserId               = r.UserId,
                FullName             = r.FullName,
                TotalSessions        = r.TotalSessions,
                SessionsAttended     = r.SessionsAttended,
                SessionsAbsent       = r.SessionsAbsent,
                SessionsLate         = r.SessionsLate,
                AttendancePercentage = r.AttendancePercentage,
                AttendanceRating     = r.AttendancePercentage >= 85 ? "Good"
                                     : r.AttendancePercentage >= 75 ? "At Risk"
                                     : "Critical",
                Records = r.DetailedRecords.ConvertAll(ToRecordResponse)
            };
    }
}
