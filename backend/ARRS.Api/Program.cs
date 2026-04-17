// =============================================================================
// FILE:    Program.cs
// OWNER:   Shared (Thandeka leads this as API Lead)
//
// PURPOSE: Application entry point.
//          Wires up all services, starts background jobs, and (optionally)
//          runs the ASP.NET Core web host.
//
// DEPENDENCY ORDER:
//   DatabaseContext → AppLogger → Services → Engine → Jobs → Scheduler
//
// TO RUN:
//   1. Run DatabaseSetup.sql in SSMS first
//   2. Update connectionString below
//   3. In terminal: dotnet run
// =============================================================================

using System;
using AttendanceSystem.Data;
using AttendanceSystem.Jobs;
using AttendanceSystem.Services;

namespace AttendanceSystem
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("╔══════════════════════════════════════════════╗");
            Console.WriteLine("║     STUDENT ATTENDANCE SYSTEM — Starting     ║");
            Console.WriteLine("╚══════════════════════════════════════════════╝\n");

            // -----------------------------------------------------------------
            // STEP 1: Database connection
            // Update this with your actual SQL Server credentials.
            // -----------------------------------------------------------------
            string connectionString =
                "Server=localhost;Database=AttendanceDB;" +
                "User Id=sa;Password=YourPassword123;" +
                "TrustServerCertificate=True;";

            using var db = new DatabaseContext(connectionString);

            // -----------------------------------------------------------------
            // STEP 2: Logger first — everything else depends on it
            // Owned by OFENTSE
            // -----------------------------------------------------------------
            var logger = new AppLogger(db);
            logger.Info("Program", "Database connected. Initialising services...");

            // -----------------------------------------------------------------
            // STEP 3: Core services
            // Owned by THANDEKA
            // -----------------------------------------------------------------
            var alertService   = new AlertService(db, logger);
            var userService    = new UserService(db, logger);
            var sessionService = new SessionService(db, logger);
            var engine         = new AttendanceEngine(db, alertService, logger);
            var reportService  = new ReportService(db, engine, logger);

            logger.Info("Program", "Core services initialised.");

            // -----------------------------------------------------------------
            // STEP 4: Background jobs
            // Owned by OFENTSE
            // -----------------------------------------------------------------
            var markAbsenteesJob = new MarkAbsenteesJob(engine, sessionService, db, logger);
            var dailyReportJob   = new DailyReportJob(db, logger);
            var alertCleanupJob  = new AlertCleanupJob(db, logger);
            var scheduler        = new JobScheduler(markAbsenteesJob, dailyReportJob, alertCleanupJob, logger);

            scheduler.Start();
            logger.Info("Program", "Background jobs started.");

            // -----------------------------------------------------------------
            // STEP 5: Demo run — shows every part of the system working
            // -----------------------------------------------------------------
            RunDemo(userService, sessionService, engine, reportService, alertService, logger);

            // -----------------------------------------------------------------
            // Graceful shutdown on keypress
            // -----------------------------------------------------------------
            Console.WriteLine("\nPress any key to stop background jobs and exit...");
            Console.ReadKey();
            scheduler.Stop();
            logger.Info("Program", "Application shutting down.");
        }

        // =====================================================================
        // DEMO: Simulates a full real-world day in the system
        // =====================================================================
        static void RunDemo(
            UserService     userService,
            SessionService  sessionService,
            AttendanceEngine engine,
            ReportService   reportService,
            AlertService    alertService,
            AppLogger       logger)
        {
            logger.Info("Demo", "=== DEMO START ===");

            // -----------------------------------------------------------------
            // A. Register users across all four roles
            // -----------------------------------------------------------------
            int superAdminId = userService.RegisterUser("Super Admin",   "super@school.com",   "Admin@1234",   Models.UserRole.SuperAdmin);
            int adminId      = userService.RegisterUser("Admin User",    "admin@school.com",   "Admin@1234",   Models.UserRole.Admin);
            int trainerId    = userService.RegisterUser("Trainer Alice", "alice@school.com",   "Train@1234",   Models.UserRole.Trainer);
            int student1Id   = userService.RegisterUser("Student Bob",   "bob@school.com",     "Student@1234", Models.UserRole.Student);
            int student2Id   = userService.RegisterUser("Student Carol", "carol@school.com",   "Student@1234", Models.UserRole.Student);

            // -----------------------------------------------------------------
            // B. Login as Trainer → create a session
            // -----------------------------------------------------------------
            var trainer = userService.Login("alice@school.com", "Train@1234");

            // Session started 2 minutes ago (allows immediate clock-in)
            int sessionId = sessionService.CreateSession(
                "C# Bootcamp — Morning",
                trainerId,
                DateTime.UtcNow.AddMinutes(-2),
                DateTime.UtcNow.AddHours(3),
                trainer
            );

            // -----------------------------------------------------------------
            // C. Students & trainer clock in
            // -----------------------------------------------------------------
            engine.ClockIn(student1Id, sessionId);   // Bob clocks in
            engine.ClockIn(student2Id, sessionId);   // Carol clocks in
            engine.ClockIn(trainerId,  sessionId);   // Alice clocks in

            // -----------------------------------------------------------------
            // D. Bob clocks out early
            // -----------------------------------------------------------------
            engine.ClockOut(student1Id, sessionId);

            // -----------------------------------------------------------------
            // E. Admin views session register
            // -----------------------------------------------------------------
            var admin    = userService.Login("admin@school.com", "Admin@1234");
            var register = reportService.GenerateSessionReport(sessionId, admin);
            logger.Info("Demo", $"Session register: {register?.Count ?? 0} records found.");

            // -----------------------------------------------------------------
            // F. Generate Bob's personal report
            // -----------------------------------------------------------------
            var bobReport = reportService.GenerateStudentReport(student1Id, admin);
            if (bobReport != null)
                logger.Info("Demo",
                    $"Bob's report: {bobReport.AttendancePercentage}% " +
                    $"({bobReport.SessionsAttended}/{bobReport.TotalSessions} sessions)");

            // -----------------------------------------------------------------
            // G. Generate full class report
            // -----------------------------------------------------------------
            var classReport = reportService.GenerateFullClassReport(admin);
            logger.Info("Demo", $"Class report: {classReport?.Count ?? 0} students.");

            // -----------------------------------------------------------------
            // H. Check Bob's alerts
            // -----------------------------------------------------------------
            var alerts = alertService.GetAlertsForUser(student1Id);
            logger.Info("Demo", $"Bob has {alerts.Count} unread alert(s).");
            foreach (var a in alerts)
                alertService.MarkAlertAsRead(a.AlertId);

            logger.Info("Demo", "=== DEMO COMPLETE ===");
        }
    }
}
