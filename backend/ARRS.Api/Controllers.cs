// =============================================================================
// FILE:    Controllers/Controllers.cs
// OWNER:   *** MPHO — Controllers, DTO Validation & API Responses ***
//
// PURPOSE: ASP.NET Core API Controllers that expose the system's features
//          as HTTP endpoints.
//
// WHAT MPHO OWNS:
//   ✔ All [ApiController] route definitions
//   ✔ ModelState validation (DTO validation errors returned to client)
//   ✔ Consistent ApiResponse<T> wrapping on every endpoint
//   ✔ HTTP status codes (200, 201, 400, 401, 403, 404, 500)
//   ✔ Calling the correct service method and mapping to a DTO
//
// CONTROLLERS IN THIS FILE:
//   1. AuthController       → /api/auth
//   2. UserController       → /api/users
//   3. SessionController    → /api/sessions
//   4. AttendanceController → /api/attendance  (calls Thandeka's engine)
//   5. ReportController     → /api/reports
//   6. AlertController      → /api/alerts
//
// NOTE: In a real ASP.NET project each controller would be in its own file.
//       They are combined here for the class project submission.
// =============================================================================

using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using AttendanceSystem.DTOs;
using AttendanceSystem.Models;
using AttendanceSystem.Services;

namespace AttendanceSystem.Controllers
{
    // =========================================================================
    // 1. AUTH CONTROLLER — /api/auth
    // Handles login and user registration.
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;

        public AuthController(UserService userService)
        {
            _userService = userService;
        }

        // POST /api/auth/login
        // Accepts a LoginRequest DTO; returns a LoginResponse on success.
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // ModelState is automatically validated by [ApiController]
            // If [Required] or [EmailAddress] fails, 400 is returned before here
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Validation failed."));

            var user = _userService.Login(request.Email, request.Password);

            if (user == null)
                return Unauthorized(ApiResponse<object>.Fail("Invalid email or password."));

            var response = new LoginResponse
            {
                UserId   = user.UserId,
                FullName = user.FullName,
                Email    = user.Email,
                Role     = user.Role.ToString(),
                Token    = "JWT_TOKEN_PLACEHOLDER" // Swap for real JWT in production
            };

            return Ok(ApiResponse<LoginResponse>.Ok(response, "Login successful."));
        }

        // POST /api/auth/register
        // SuperAdmin/Admin creates a new user with a specified role.
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Validation failed."));

            int newId = _userService.RegisterUser(
                request.FullName,
                request.Email,
                request.Password,
                (UserRole)request.Role
            );

            if (newId == -1)
                return Conflict(ApiResponse<object>.Fail("Email already exists."));

            return StatusCode(201,
                ApiResponse<object>.Ok(new { UserId = newId }, "User registered successfully."));
        }
    }

    // =========================================================================
    // 2. USER CONTROLLER — /api/users
    // Profile and role management endpoints.
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        // GET /api/users/{id}
        // Returns a user's profile (no password hash exposed).
        [HttpGet("{id}")]
        public IActionResult GetUser(int id)
        {
            var user = _userService.GetUserById(id);

            if (user == null)
                return NotFound(ApiResponse<object>.Fail($"User {id} not found."));

            return Ok(ApiResponse<UserResponse>.Ok(DtoMapper.ToUserResponse(user)));
        }

        // GET /api/users/students
        // Returns all active students. Accessible by Trainer and above.
        [HttpGet("students")]
        public IActionResult GetStudents()
        {
            var students = _userService.GetAllStudents();
            var dtos     = students.ConvertAll(DtoMapper.ToUserResponse);
            return Ok(ApiResponse<List<UserResponse>>.Ok(dtos));
        }

        // GET /api/users/trainers
        // Returns all active trainers. Accessible by Admin and above.
        [HttpGet("trainers")]
        public IActionResult GetTrainers()
        {
            var trainers = _userService.GetAllTrainers();
            var dtos     = trainers.ConvertAll(DtoMapper.ToUserResponse);
            return Ok(ApiResponse<List<UserResponse>>.Ok(dtos));
        }

        // DELETE /api/users/{id}/deactivate
        // Soft-deletes a user. Admin only.
        [HttpDelete("{id}/deactivate")]
        public IActionResult DeactivateUser(int id, [FromQuery] int requestingUserId)
        {
            var requestingUser = _userService.GetUserById(requestingUserId);
            if (requestingUser == null)
                return Unauthorized(ApiResponse<object>.Fail("Requesting user not found."));

            bool success = _userService.DeactivateUser(id, requestingUser);

            return success
                ? Ok(ApiResponse<object>.Ok(null, $"User {id} deactivated."))
                : Forbid();
        }
    }

    // =========================================================================
    // 3. SESSION CONTROLLER — /api/sessions
    // Create and browse sessions.
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class SessionController : ControllerBase
    {
        private readonly SessionService _sessionService;
        private readonly UserService    _userService;

        public SessionController(SessionService sessionService, UserService userService)
        {
            _sessionService = sessionService;
            _userService    = userService;
        }

        // POST /api/sessions
        // Create a new session. Trainer or above only.
        [HttpPost]
        public IActionResult CreateSession(
            [FromBody] CreateSessionRequest request,
            [FromQuery] int requestingUserId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Validation failed."));

            var creator = _userService.GetUserById(requestingUserId);
            if (creator == null)
                return Unauthorized(ApiResponse<object>.Fail("User not found."));

            int sessionId = _sessionService.CreateSession(
                request.SessionName,
                request.TrainerId,
                request.StartTime,
                request.EndTime,
                creator
            );

            if (sessionId == -1)
                return Forbid();

            return StatusCode(201,
                ApiResponse<object>.Ok(new { SessionId = sessionId }, "Session created."));
        }

        // GET /api/sessions/{id}
        [HttpGet("{id}")]
        public IActionResult GetSession(int id)
        {
            var session = _sessionService.GetSessionById(id);

            if (session == null)
                return NotFound(ApiResponse<object>.Fail($"Session {id} not found."));

            return Ok(ApiResponse<SessionResponse>.Ok(DtoMapper.ToSessionResponse(session)));
        }

        // GET /api/sessions/active
        [HttpGet("active")]
        public IActionResult GetActiveSessions()
        {
            var sessions = _sessionService.GetActiveSessions();
            var dtos     = sessions.ConvertAll(DtoMapper.ToSessionResponse);
            return Ok(ApiResponse<List<SessionResponse>>.Ok(dtos));
        }

        // GET /api/sessions/upcoming
        [HttpGet("upcoming")]
        public IActionResult GetUpcomingSessions()
        {
            var sessions = _sessionService.GetUpcomingSessions();
            var dtos     = sessions.ConvertAll(DtoMapper.ToSessionResponse);
            return Ok(ApiResponse<List<SessionResponse>>.Ok(dtos));
        }

        // GET /api/sessions/trainer/{trainerId}
        [HttpGet("trainer/{trainerId}")]
        public IActionResult GetSessionsByTrainer(int trainerId)
        {
            var sessions = _sessionService.GetSessionsByTrainer(trainerId);
            var dtos     = sessions.ConvertAll(DtoMapper.ToSessionResponse);
            return Ok(ApiResponse<List<SessionResponse>>.Ok(dtos));
        }

        // DELETE /api/sessions/{id}
        [HttpDelete("{id}")]
        public IActionResult DeactivateSession(int id, [FromQuery] int requestingUserId)
        {
            var user = _userService.GetUserById(requestingUserId);
            if (user == null)
                return Unauthorized(ApiResponse<object>.Fail("User not found."));

            bool success = _sessionService.DeactivateSession(id, user);

            return success
                ? Ok(ApiResponse<object>.Ok(null, $"Session {id} deactivated."))
                : Forbid();
        }
    }

    // =========================================================================
    // 4. ATTENDANCE CONTROLLER — /api/attendance
    // Clock in/out, excuse absences, view registers.
    // This controller calls THANDEKA'S AttendanceEngine.
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly AttendanceEngine _engine;

        public AttendanceController(AttendanceEngine engine)
        {
            _engine = engine;
        }

        // POST /api/attendance/clockin
        [HttpPost("clockin")]
        public IActionResult ClockIn([FromBody] ClockInRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Validation failed."));

            bool success = _engine.ClockIn(request.UserId, request.SessionId);

            return success
                ? Ok(ApiResponse<object>.Ok(null, "Clocked in successfully."))
                : BadRequest(ApiResponse<object>.Fail(
                    "Clock-in failed. Session may have ended, not started yet, or you already clocked in."));
        }

        // POST /api/attendance/clockout
        [HttpPost("clockout")]
        public IActionResult ClockOut([FromBody] ClockOutRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Validation failed."));

            bool success = _engine.ClockOut(request.UserId, request.SessionId);

            return success
                ? Ok(ApiResponse<object>.Ok(null, "Clocked out successfully."))
                : BadRequest(ApiResponse<object>.Fail(
                    "Clock-out failed. No clock-in record found or already clocked out."));
        }

        // POST /api/attendance/excuse
        [HttpPost("excuse")]
        public IActionResult ExcuseAbsence(
            [FromBody] ExcuseAbsenceRequest request,
            [FromQuery] int requestingUserId,
            [FromServices] UserService userService)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<object>.Fail("Validation failed."));

            var requestingUser = userService.GetUserById(requestingUserId);
            if (requestingUser == null)
                return Unauthorized(ApiResponse<object>.Fail("Requesting user not found."));

            bool success = _engine.ExcuseAbsence(
                request.UserId, request.SessionId, request.Reason, requestingUser);

            return success
                ? Ok(ApiResponse<object>.Ok(null, "Absence excused."))
                : Forbid();
        }

        // GET /api/attendance/session/{sessionId}
        // Returns the full register for a session (Trainer+ only).
        [HttpGet("session/{sessionId}")]
        public IActionResult GetSessionRegister(int sessionId)
        {
            var records = _engine.GetRecordsBySession(sessionId);
            var dtos    = records.ConvertAll(DtoMapper.ToRecordResponse);
            return Ok(ApiResponse<List<AttendanceRecordResponse>>.Ok(dtos));
        }

        // GET /api/attendance/user/{userId}
        // Returns all attendance history for a user.
        [HttpGet("user/{userId}")]
        public IActionResult GetUserHistory(int userId)
        {
            var records = _engine.GetRecordsByUser(userId);
            var dtos    = records.ConvertAll(DtoMapper.ToRecordResponse);
            return Ok(ApiResponse<List<AttendanceRecordResponse>>.Ok(dtos));
        }
    }

    // =========================================================================
    // 5. REPORT CONTROLLER — /api/reports
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly ReportService _reportService;
        private readonly UserService   _userService;

        public ReportController(ReportService reportService, UserService userService)
        {
            _reportService = reportService;
            _userService   = userService;
        }

        // GET /api/reports/student/{studentId}?requestingUserId=X
        [HttpGet("student/{studentId}")]
        public IActionResult GetStudentReport(int studentId, [FromQuery] int requestingUserId)
        {
            var requestingUser = _userService.GetUserById(requestingUserId);
            if (requestingUser == null)
                return Unauthorized(ApiResponse<object>.Fail("User not found."));

            var report = _reportService.GenerateStudentReport(studentId, requestingUser);
            if (report == null)
                return Forbid();

            return Ok(ApiResponse<StudentReportResponse>.Ok(DtoMapper.ToStudentReport(report)));
        }

        // GET /api/reports/session/{sessionId}?requestingUserId=X
        [HttpGet("session/{sessionId}")]
        public IActionResult GetSessionReport(int sessionId, [FromQuery] int requestingUserId)
        {
            var requestingUser = _userService.GetUserById(requestingUserId);
            if (requestingUser == null)
                return Unauthorized(ApiResponse<object>.Fail("User not found."));

            var records = _reportService.GenerateSessionReport(sessionId, requestingUser);
            if (records == null)
                return Forbid();

            var dtos = records.ConvertAll(DtoMapper.ToRecordResponse);
            return Ok(ApiResponse<List<AttendanceRecordResponse>>.Ok(dtos));
        }

        // GET /api/reports/class?requestingUserId=X
        [HttpGet("class")]
        public IActionResult GetClassReport([FromQuery] int requestingUserId)
        {
            var requestingUser = _userService.GetUserById(requestingUserId);
            if (requestingUser == null)
                return Unauthorized(ApiResponse<object>.Fail("User not found."));

            var reports = _reportService.GenerateFullClassReport(requestingUser);
            if (reports == null)
                return Forbid();

            var dtos = reports.ConvertAll(DtoMapper.ToStudentReport);
            return Ok(ApiResponse<List<StudentReportResponse>>.Ok(dtos));
        }
    }

    // =========================================================================
    // 6. ALERT CONTROLLER — /api/alerts
    // =========================================================================
    [ApiController]
    [Route("api/[controller]")]
    public class AlertController : ControllerBase
    {
        private readonly AlertService _alertService;

        public AlertController(AlertService alertService)
        {
            _alertService = alertService;
        }

        // GET /api/alerts/{userId}
        [HttpGet("{userId}")]
        public IActionResult GetAlerts(int userId)
        {
            var alerts = _alertService.GetAlertsForUser(userId);
            var dtos   = alerts.ConvertAll(a => new AlertResponse
            {
                AlertId   = a.AlertId,
                Message   = a.Message,
                IsRead    = a.IsRead,
                CreatedAt = a.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            });
            return Ok(ApiResponse<List<AlertResponse>>.Ok(dtos));
        }

        // PATCH /api/alerts/{alertId}/read
        [HttpPatch("{alertId}/read")]
        public IActionResult MarkAsRead(int alertId)
        {
            _alertService.MarkAlertAsRead(alertId);
            return Ok(ApiResponse<object>.Ok(null, "Alert marked as read."));
        }
    }
}
