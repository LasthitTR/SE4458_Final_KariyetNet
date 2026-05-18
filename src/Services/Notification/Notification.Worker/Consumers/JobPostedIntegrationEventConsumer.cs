using EventBus.Messages.Events;
using MassTransit;
using Notification.Worker.Data;
using Notification.Worker.Models;

namespace Notification.Worker.Consumers
{
    public class JobPostedIntegrationEventConsumer : IConsumer<JobPostedIntegrationEvent>
    {
        private readonly NotificationDbContext _context;
        private readonly ILogger<JobPostedIntegrationEventConsumer> _logger;

        public JobPostedIntegrationEventConsumer(NotificationDbContext context, ILogger<JobPostedIntegrationEventConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<JobPostedIntegrationEvent> context)
        {
            var message = context.Message;
            _logger.LogInformation("Kuyruktan yeni iş ilanı alındı: {JobId} - {Title}", message.JobId, message.Title);

            // Gelen ilanı daha sonra Scheduled Task'ın işlemesi için veritabanına kaydediyoruz
            var unprocessedJob = new UnprocessedJob
            {
                JobId = message.JobId,
                Title = message.Title,
                CompanyName = message.CompanyName,
                City = message.City,
                Town = message.Town,
                WorkingPreference = message.WorkingPreference,
                WorkingType = message.WorkingType,
                CreatedAt = message.CreatedAt,
                IsProcessed = false
            };

            _context.UnprocessedJobs.Add(unprocessedJob);
            await _context.SaveChangesAsync();
        }
    }
}
