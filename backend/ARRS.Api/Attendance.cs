namespace AttendanceEngine_API
{
    public class Attendance
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public Student Student { get; set; }

        public int SessionId { get; set; }
        public Session Session { get; set; }

        public DateTime Timestamp { get; set; }
    }
}
