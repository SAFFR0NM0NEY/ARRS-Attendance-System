using Microsoft.AspNetCore.Mvc;
using AttendanceEngine_API.AttendanceSystem.DTOs;
using AttendanceEngine_API;

namespace AttendanceSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly AttendanceService _service;

        public AttendanceController(AttendanceService service)
        {
            _service = service;
        }

        [HttpPost("mark")]
        public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceDto dto)
        {
            var result = await _service.MarkAttendance(dto);

            if (result != "Attendance marked successfully")
                return BadRequest(new { message = result });

            return Ok(new { message = result });
        }
    }
}
