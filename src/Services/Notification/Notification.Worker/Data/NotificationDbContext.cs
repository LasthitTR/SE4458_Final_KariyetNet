using Microsoft.EntityFrameworkCore;
using Notification.Worker.Models;

namespace Notification.Worker.Data
{
    public class NotificationDbContext : DbContext
    {
        public NotificationDbContext(DbContextOptions<NotificationDbContext> options) : base(options)
        {
        }

        public DbSet<JobAlert> JobAlerts { get; set; }
        public DbSet<UnprocessedJob> UnprocessedJobs { get; set; }
        public DbSet<UserNotification> UserNotifications { get; set; }
        public DbSet<JobPostingDbModel> JobPostings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<JobAlert>().HasKey(x => x.Id);
            modelBuilder.Entity<UnprocessedJob>().HasKey(x => x.Id);
            modelBuilder.Entity<UserNotification>().HasKey(x => x.Id);
            modelBuilder.Entity<JobPostingDbModel>().HasKey(x => x.Id);
        }
    }
}
