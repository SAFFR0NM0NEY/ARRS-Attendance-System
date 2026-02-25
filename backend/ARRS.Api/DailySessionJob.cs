using AttendanceEngine_API.AttendanceSystem.Data;
using AttendanceEngine_API;
// using Microsoft.Extensions.Hosting;

namespace AttendanceSystem.BackgroundJobs
{
    public class DailySessionJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public DailySessionJob(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var today = DateTime.Today;

                var sessionExists = context.Sessions
                    .Any(s => s.Date == today);

                if (!sessionExists)
                {
                    var session = new Session
                    {
                        ClassCode = "IT101",
                        Date = today,
                        StartTime = today.AddHours(8),
                        CutoffTime = today.AddHours(8).AddMinutes(15),
                        Status = "Open"
                    };

                    context.Sessions.Add(session);
                    await context.SaveChangesAsync();
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
