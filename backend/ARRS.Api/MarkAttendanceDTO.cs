namespace AttendanceEngine_API
{
    namespace AttendanceSystem.DTOs
    {
        public class MarkAttendanceDto
        {
            public int StudentId { get; set; }
            public int SessionId { get; set; }
            public string IpAddress { get; set; }
            public string DeviceId { get; set; }
        }
    }
}
