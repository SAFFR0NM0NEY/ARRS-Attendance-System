using AttendanceEngine_API.AttendanceSystem.Data;
using AttendanceEngine_API.AttendanceSystem.DTOs;
using AttendanceEngine_API;
// using Microsoft.EntityFrameworkCore;

namespace AttendanceEngine_API
{
    public class AttendanceService
    {
        private readonly AppDbContext _context;

        public AttendanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> MarkAttendance(MarkAttendanceDto dto)
        {
            var session = await _context.Sessions.FindAsync(dto.SessionId);

            if (session == null)
                return "Session not found";

            if (session.Status != "Open")
                return "Session is closed";

            if (DateTime.Now > session.CutoffTime)
                return "Cutoff time passed";

            var alreadyMarked = await _context.Attendance
                .AnyAsync(a => a.StudentId == dto.StudentId &&
                               a.SessionId == dto.SessionId);

            if (alreadyMarked)
                return "Attendance already marked";

            // Example IP validation (Campus IP only)
            if (!dto.IpAddress.StartsWith("192.168."))
                return "Invalid campus IP address";

            var attendance = new Attendance
            {
                StudentId = dto.StudentId,
                SessionId = dto.SessionId,
                Timestamp = DateTime.Now
            };

            _context.Attendance.Add(attendance);
            await _context.SaveChangesAsync();

            return "Attendance marked successfully";
        }
    }
}

