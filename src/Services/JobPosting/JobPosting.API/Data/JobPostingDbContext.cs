using JobPosting.API.Models;
using Microsoft.EntityFrameworkCore;

namespace JobPosting.API.Data
{
    public class JobPostingDbContext : DbContext
    {
        public JobPostingDbContext(DbContextOptions<JobPostingDbContext> options) : base(options)
        {
        }

        public DbSet<JobPostingEntity> JobPostings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<JobPostingEntity>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
                // Diğer property konfigürasyonları eklenebilir
            });
        }
    }
}
