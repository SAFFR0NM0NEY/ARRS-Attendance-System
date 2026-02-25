using System.ComponentModel.DataAnnotations;

namespace AttendanceEngine_API
{ 
namespace AttendanceSystem.Models
    {
        public class Student
        {
            public int Id { get; set; }

            [Required]
            public string StudentNumber { get; set; }

            public string Name { get; set; }
        }
    }

}
