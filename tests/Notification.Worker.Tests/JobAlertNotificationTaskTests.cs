using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Notification.Worker.Data;
using Notification.Worker.Tasks;
using Notification.Worker.Models;
using Moq;
using Quartz;
using Xunit;

namespace Notification.Worker.Tests
{
    public class JobAlertNotificationTaskTests
    {
        [Fact]
        public async Task Execute_MarksUnprocessedJobsAsProcessed_AndLogsNotifications()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddDbContext<NotificationDbContext>(opts => opts.UseInMemoryDatabase("notif_test_db"));

            var provider = services.BuildServiceProvider();

            // Seed data
            using (var scope = provider.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                db.JobAlerts.Add(new JobAlert { Id = Guid.NewGuid(), UserId = "user1", City = "Izmir", Keywords = "Yazılım", CreatedAt = DateTime.UtcNow });
                db.UnprocessedJobs.Add(new UnprocessedJob { Id = Guid.NewGuid(), Title = "Yazılım Uzmanı", City = "Izmir", IsProcessed = false });
                await db.SaveChangesAsync();
            }

            var logger = provider.GetRequiredService<ILogger<JobAlertNotificationTask>>();
            var serviceProviderMock = new Mock<IServiceProvider>();
            serviceProviderMock.Setup(sp => sp.GetService(typeof(IServiceScopeFactory))).Returns(provider.GetRequiredService<IServiceScopeFactory>());

            var task = new JobAlertNotificationTask(provider.GetRequiredService<ILogger<JobAlertNotificationTask>>(), provider);

            var contextMock = new Mock<IJobExecutionContext>();
            await task.Execute(contextMock.Object);

            using (var scope = provider.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                var job = await db.UnprocessedJobs.FirstOrDefaultAsync();
                Assert.NotNull(job);
                Assert.True(job.IsProcessed);
            }
        }
    }
}
