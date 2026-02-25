// using Microsoft.EntityFrameworkCore;
// using AttendanceSystem.Models;
using AttendanceEngine_API.AttendanceSystem.Models;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace AttendanceEngine_API
{
    namespace AttendanceSystem.Data
    {
        public class AppDbContext : DbContext
        {
            public AppDbContext(DbContextOptions<AppDbContext> options)
                : base(options)
            {
            }

            public DbSet<Student> Students { get; set; }
            public DbSet<Session> Sessions { get; set; }
            public DbSet<Attendance> Attendance { get; set; }

            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                // UNIQUE constraint to prevent duplicate attendance
                modelBuilder.Entity<Attendance>()
                    .HasIndex(a => new { a.StudentId, a.SessionId })
                    .IsUnique();
            }
        }
    }
}
