using Microsoft.EntityFrameworkCore;
using Notification.Worker.Data;
using Quartz;

namespace Notification.Worker.Tasks
{
    public class JobAlertNotificationTask : IJob
    {
        private readonly ILogger<JobAlertNotificationTask> _logger;
        private readonly IServiceProvider _serviceProvider;

        public JobAlertNotificationTask(ILogger<JobAlertNotificationTask> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("JobAlertNotificationTask çalışıyor...");

            // Scoped servisleri kullanmak için scope oluşturuyoruz (Quartz singleton çalışır)
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

            var unprocessedJobs = await dbContext.UnprocessedJobs.Where(j => !j.IsProcessed).ToListAsync();
            if (!unprocessedJobs.Any()) return;

            var jobAlerts = await dbContext.JobAlerts.ToListAsync();

            foreach (var job in unprocessedJobs)
            {
                var matchingAlerts = jobAlerts.Where(alert =>
                    (string.IsNullOrEmpty(alert.City) || job.City.Equals(alert.City, StringComparison.OrdinalIgnoreCase)) &&
                    (string.IsNullOrEmpty(alert.Keywords) || job.Title.Contains(alert.Keywords, StringComparison.OrdinalIgnoreCase))
                ).ToList();

                foreach (var alert in matchingAlerts)
                {
                    // Mock Bildirim Gönderme
                    _logger.LogInformation($"Kullanıcıya bildirim gönderildi: [{job.Title}] (User: {alert.UserId})");
                }

                job.IsProcessed = true;
            }

            dbContext.UnprocessedJobs.UpdateRange(unprocessedJobs);
            await dbContext.SaveChangesAsync();
        }
    }
}
