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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<JobAlert>().HasKey(x => x.Id);
            modelBuilder.Entity<UnprocessedJob>().HasKey(x => x.Id);
        }
    }
}
