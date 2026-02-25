namespace AttendanceEngine_API
// namespace AttendanceSystem.Models
{
    public class Session
    {
        public int Id { get; set; }

        public string ClassCode { get; set; }

        public DateTime Date { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime CutoffTime { get; set; }

        public string Status { get; set; } // Open or Closed
    }
}

