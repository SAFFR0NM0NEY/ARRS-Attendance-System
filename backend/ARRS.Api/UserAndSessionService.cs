// =============================================================================
// FILE:    Services/UserService.cs
// OWNER:   *** THANDEKA — Attendance Engine & API Lead ***
//
// PURPOSE: Manages all user account operations:
//   ✔ Register new users (all roles)
//   ✔ Login / authenticate
//   ✔ Fetch user profiles (by ID, by role)
//   ✔ Role-based access helper (CanAccess)
//   ✔ Deactivate accounts (Admin only)
//
// USED BY:
//   → Mpho's AuthController calls Login and RegisterUser
//   → Mpho's UserController calls GetAllStudents / GetUserById
//   → AttendanceEngine calls GetUserById for role checks
// =============================================================================

using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.SqlClient;
using AttendanceSystem.Data;
using AttendanceSystem.Models;

namespace AttendanceSystem.Services
{
    public class UserService
    {
        private readonly DatabaseContext _db;
        private readonly AppLogger       _logger;

        public UserService(DatabaseContext db, AppLogger logger)
        {
            _db     = db;
            _logger = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: RegisterUser
        // Creates a new user. Password is hashed before storage.
        // Returns the new UserId on success, or -1 if the email already exists.
        // -------------------------------------------------------------------------
        public int RegisterUser(string fullName, string email, string plainPassword, UserRole role)
        {
            string hash = HashPassword(plainPassword);

            string sql = @"
                INSERT INTO Users (FullName, Email, PasswordHash, Role)
                OUTPUT INSERTED.UserId
                VALUES (@FullName, @Email, @PasswordHash, @Role)";

            try
            {
                using var cmd = new SqlCommand(sql, _db.GetConnection());
                cmd.Parameters.AddWithValue("@FullName",     fullName);
                cmd.Parameters.AddWithValue("@Email",        email.ToLower().Trim());
                cmd.Parameters.AddWithValue("@PasswordHash", hash);
                cmd.Parameters.AddWithValue("@Role",         (int)role);

                int newId = (int)cmd.ExecuteScalar();
                _logger.Info("UserService", $"New user registered: {email} | Role: {role} | ID: {newId}");
                return newId;
            }
            catch (SqlException ex) when (ex.Number == 2627) // Unique constraint: duplicate email
            {
                _logger.Warning("UserService", $"Registration failed — email already exists: {email}");
                return -1;
            }
        }

        // -------------------------------------------------------------------------
        // METHOD: Login
        // Verifies email + password. Returns the User if valid, null if not.
        // Only active accounts can log in.
        // -------------------------------------------------------------------------
        public User Login(string email, string plainPassword)
        {
            string sql = "SELECT * FROM Users WHERE Email = @Email AND IsActive = 1";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@Email", email.ToLower().Trim());

            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                string storedHash = reader["PasswordHash"].ToString();
                if (VerifyPassword(plainPassword, storedHash))
                {
                    var user = MapUser(reader);
                    _logger.Info("UserService", $"Login successful: {email}");
                    return user;
                }
            }

            _logger.Warning("UserService", $"Login failed for: {email}");
            return null;
        }

        // -------------------------------------------------------------------------
        // METHOD: GetUserById
        // Fetch a single user's full profile.
        // -------------------------------------------------------------------------
        public User GetUserById(int userId)
        {
            string sql = "SELECT * FROM Users WHERE UserId = @UserId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = cmd.ExecuteReader();
            return reader.Read() ? MapUser(reader) : null;
        }

        // -------------------------------------------------------------------------
        // METHOD: GetAllStudents / GetAllTrainers
        // Returns all active users filtered by role.
        // -------------------------------------------------------------------------
        public List<User> GetAllStudents() => GetByRole(UserRole.Student);
        public List<User> GetAllTrainers() => GetByRole(UserRole.Trainer);

        private List<User> GetByRole(UserRole role)
        {
            string sql = "SELECT * FROM Users WHERE Role = @Role AND IsActive = 1";
            var    list = new List<User>();

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@Role", (int)role);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                list.Add(MapUser(reader));

            return list;
        }

        // -------------------------------------------------------------------------
        // METHOD: DeactivateUser
        // Soft-deletes a user (IsActive = 0). Admin/SuperAdmin only.
        // -------------------------------------------------------------------------
        public bool DeactivateUser(int targetId, User requestingUser)
        {
            if (!CanAccess(requestingUser, UserRole.Admin))
            {
                _logger.Warning("UserService",
                    $"DeactivateUser denied: User {requestingUser.UserId} lacks Admin role.");
                return false;
            }

            string sql = "UPDATE Users SET IsActive = 0 WHERE UserId = @UserId";
            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@UserId", targetId);

            bool success = cmd.ExecuteNonQuery() > 0;
            if (success)
                _logger.Info("UserService", $"User {targetId} deactivated by {requestingUser.UserId}.");

            return success;
        }

        // -------------------------------------------------------------------------
        // METHOD: CanAccess
        // Role-based access helper used throughout all services.
        // Usage: if (!userService.CanAccess(currentUser, UserRole.Admin)) return;
        // -------------------------------------------------------------------------
        public bool CanAccess(User user, UserRole requiredRole)
        {
            return user != null && user.IsActive && user.Role >= requiredRole;
        }

        // =========================================================================
        // PRIVATE HELPERS
        // =========================================================================

        private User MapUser(SqlDataReader r) => new User
        {
            UserId       = (int)r["UserId"],
            FullName     = r["FullName"].ToString(),
            Email        = r["Email"].ToString(),
            PasswordHash = r["PasswordHash"].ToString(),
            Role         = (UserRole)(int)r["Role"],
            IsActive     = (bool)r["IsActive"],
            CreatedAt    = (DateTime)r["CreatedAt"]
        };

        // SHA-256 hash — replace with BCrypt.Net-Next in production
        private string HashPassword(string plain)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(plain));
            return Convert.ToBase64String(bytes);
        }

        private bool VerifyPassword(string plain, string hash) =>
            HashPassword(plain) == hash;
    }
}


// =============================================================================
// FILE:    Services/SessionService.cs (appended here for project cohesion)
// OWNER:   *** THANDEKA — Attendance Engine & API Lead ***
//
// PURPOSE: Creates and manages training sessions.
//   ✔ CreateSession    — Trainer or Admin creates a new class block
//   ✔ GetActiveSessions — sessions happening right now
//   ✔ GetUpcomingSessions — sessions in the future
//   ✔ GetSessionsByTrainer — all sessions for a specific trainer
//   ✔ DeactivateSession — Admin can cancel/remove a session
//
// USED BY:
//   → Mpho's SessionController for all session API endpoints
//   → Ofentse's MarkAbsenteesJob calls GetEndedSessions
//   → AttendanceEngine fetches sessions for clock-in validation
// =============================================================================

namespace AttendanceSystem.Services
{
    using System;
    using System.Collections.Generic;
    using Microsoft.Data.SqlClient;
    using AttendanceSystem.Data;
    using AttendanceSystem.Models;

    public class SessionService
    {
        private readonly DatabaseContext _db;
        private readonly AppLogger       _logger;

        public SessionService(DatabaseContext db, AppLogger logger)
        {
            _db     = db;
            _logger = logger;
        }

        // -------------------------------------------------------------------------
        // METHOD: CreateSession
        // Creates a new session. Only Trainers and above can do this.
        // Returns new SessionId or -1 on failure.
        // -------------------------------------------------------------------------
        public int CreateSession(
            string   sessionName,
            int      trainerId,
            DateTime startTime,
            DateTime endTime,
            User     requestingUser)
        {
            if (requestingUser.Role < UserRole.Trainer)
            {
                _logger.Warning("SessionService", "CreateSession denied: insufficient role.");
                return -1;
            }

            if (endTime <= startTime)
            {
                _logger.Warning("SessionService", "CreateSession failed: EndTime must be after StartTime.");
                return -1;
            }

            string sql = @"
                INSERT INTO Sessions (SessionName, TrainerId, StartTime, EndTime)
                OUTPUT INSERTED.SessionId
                VALUES (@SessionName, @TrainerId, @StartTime, @EndTime)";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@SessionName", sessionName);
            cmd.Parameters.AddWithValue("@TrainerId",   trainerId);
            cmd.Parameters.AddWithValue("@StartTime",   startTime);
            cmd.Parameters.AddWithValue("@EndTime",     endTime);

            int id = (int)cmd.ExecuteScalar();
            _logger.Info("SessionService", $"Session created: '{sessionName}' ID={id}");
            return id;
        }

        // -------------------------------------------------------------------------
        // METHOD: GetSessionById
        // -------------------------------------------------------------------------
        public Session GetSessionById(int sessionId)
        {
            string sql = "SELECT * FROM Sessions WHERE SessionId = @SessionId";

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            using var reader = cmd.ExecuteReader();
            return reader.Read() ? MapSession(reader) : null;
        }

        // -------------------------------------------------------------------------
        // METHOD: GetActiveSessions
        // Sessions currently in progress (started but not ended).
        // -------------------------------------------------------------------------
        public List<Session> GetActiveSessions()
        {
            string sql = @"
                SELECT * FROM Sessions
                WHERE StartTime <= @Now AND EndTime >= @Now AND IsActive = 1";

            return QuerySessions(sql, ("@Now", DateTime.UtcNow));
        }

        // -------------------------------------------------------------------------
        // METHOD: GetUpcomingSessions
        // Sessions that have not started yet.
        // -------------------------------------------------------------------------
        public List<Session> GetUpcomingSessions()
        {
            string sql = @"
                SELECT * FROM Sessions
                WHERE StartTime > @Now AND IsActive = 1
                ORDER BY StartTime ASC";

            return QuerySessions(sql, ("@Now", DateTime.UtcNow));
        }

        // -------------------------------------------------------------------------
        // METHOD: GetEndedSessions
        // Sessions that have ended. Called by Ofentse's MarkAbsenteesJob.
        // -------------------------------------------------------------------------
        public List<Session> GetEndedSessions()
        {
            string sql = @"
                SELECT * FROM Sessions
                WHERE EndTime < @Now AND IsActive = 1";

            return QuerySessions(sql, ("@Now", DateTime.UtcNow));
        }

        // -------------------------------------------------------------------------
        // METHOD: GetSessionsByTrainer
        // -------------------------------------------------------------------------
        public List<Session> GetSessionsByTrainer(int trainerId)
        {
            string sql = @"
                SELECT * FROM Sessions
                WHERE TrainerId = @TrainerId
                ORDER BY StartTime DESC";

            return QuerySessions(sql, ("@TrainerId", trainerId));
        }

        // -------------------------------------------------------------------------
        // METHOD: DeactivateSession
        // Admin or above can deactivate (soft-delete) a session.
        // -------------------------------------------------------------------------
        public bool DeactivateSession(int sessionId, User requestingUser)
        {
            if (requestingUser.Role < UserRole.Admin)
            {
                _logger.Warning("SessionService", "DeactivateSession denied: insufficient role.");
                return false;
            }

            string sql = "UPDATE Sessions SET IsActive = 0 WHERE SessionId = @SessionId";
            using var cmd = new SqlCommand(sql, _db.GetConnection());
            cmd.Parameters.AddWithValue("@SessionId", sessionId);

            bool success = cmd.ExecuteNonQuery() > 0;
            if (success)
                _logger.Info("SessionService", $"Session {sessionId} deactivated.");

            return success;
        }

        // =========================================================================
        // PRIVATE HELPERS
        // =========================================================================

        private List<Session> QuerySessions(string sql, params (string name, object val)[] parameters)
        {
            var list = new List<Session>();

            using var cmd = new SqlCommand(sql, _db.GetConnection());
            foreach (var (name, val) in parameters)
                cmd.Parameters.AddWithValue(name, val);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                list.Add(MapSession(reader));

            return list;
        }

        private Session MapSession(SqlDataReader r) => new Session
        {
            SessionId   = (int)r["SessionId"],
            SessionName = r["SessionName"].ToString(),
            TrainerId   = (int)r["TrainerId"],
            StartTime   = (DateTime)r["StartTime"],
            EndTime     = (DateTime)r["EndTime"],
            IsActive    = (bool)r["IsActive"]
        };
    }
}
