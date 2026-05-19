using Microsoft.EntityFrameworkCore;
using Notification.Worker.Data;
using Notification.Worker.Models;
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
                    _logger.LogInformation($"Kullanıcıya bildirim gönderildi: [{job.Title}] (User: {alert.UserId})");

                    // Kullanıcıya görünür bildirim kaydı oluştur
                    var notification = new UserNotification
                    {
                        UserId = alert.UserId,
                        Title = "İş Alarmı: Yeni İlan!",
                        Message = $"Aradığınız kriterlere uygun yeni bir ilan yayınlandı: \"{job.Title}\" - {job.CompanyName} ({job.City})",
                        JobId = job.JobId.ToString(),
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    dbContext.UserNotifications.Add(notification);
                }

                job.IsProcessed = true;
            }

            dbContext.UnprocessedJobs.UpdateRange(unprocessedJobs);
            await dbContext.SaveChangesAsync();
        }
    }
}
