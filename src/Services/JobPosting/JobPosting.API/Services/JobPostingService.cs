using EventBus.Messages.Events;
using JobPosting.API.Data;
using JobPosting.API.Models;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace JobPosting.API.Services
{
    public class JobPostingService : IJobPostingService
    {
        private readonly JobPostingDbContext _context;
        private readonly IDistributedCache _cache;
        private readonly IPublishEndpoint _publishEndpoint;
        private const string CacheKeyPrefix = "JobPostings";

        public JobPostingService(JobPostingDbContext context, IDistributedCache cache, IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _cache = cache;
            _publishEndpoint = publishEndpoint;
        }

        public async Task<IEnumerable<JobPostingEntity>> GetAllAsync(int pageNumber, int pageSize)
        {
            var cacheKey = $"{CacheKeyPrefix}_Page_{pageNumber}_Size_{pageSize}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<IEnumerable<JobPostingEntity>>(cachedData)!;
            }

            var jobPostings = await _context.JobPostings
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(jobPostings), cacheOptions);

            return jobPostings;
        }

        public async Task<JobPostingEntity?> GetByIdAsync(Guid id)
        {
            var cacheKey = $"{CacheKeyPrefix}_{id}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<JobPostingEntity>(cachedData);
            }

            var jobPosting = await _context.JobPostings.FindAsync(id);

            if (jobPosting != null)
            {
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(jobPosting), new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                });
            }

            return jobPosting;
        }

        public async Task<JobPostingEntity> CreateAsync(JobPostingEntity jobPosting)
        {
            jobPosting.Id = Guid.NewGuid();
            jobPosting.CreatedAt = DateTime.UtcNow;

            _context.JobPostings.Add(jobPosting);
            await _context.SaveChangesAsync();

            // RabbitMQ'ya Event fırlat
            var eventMessage = new JobPostedIntegrationEvent
            {
                JobId = jobPosting.Id,
                Title = jobPosting.Title,
                CompanyName = jobPosting.CompanyName,
                City = jobPosting.City,
                Town = jobPosting.Town,
                WorkingPreference = jobPosting.WorkingPreference,
                WorkingType = jobPosting.WorkingType,
                CreatedAt = jobPosting.CreatedAt
            };

            try
            {
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(15));
                await _publishEndpoint.Publish(eventMessage, cts.Token);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARNING] MassTransit publish failed or timed out: {ex.Message}");
            }

            // Cache Invalidate & Sync
            await RefreshSharedSearchCacheAsync();

            return jobPosting;
        }

        public async Task<JobPostingEntity?> UpdateAsync(Guid id, JobPostingEntity jobPosting)
        {
            var existing = await _context.JobPostings.FindAsync(id);
            if (existing == null) return null;

            existing.Title = jobPosting.Title;
            existing.CompanyName = jobPosting.CompanyName;
            existing.City = jobPosting.City;
            existing.Town = jobPosting.Town;
            existing.WorkingPreference = jobPosting.WorkingPreference;
            existing.WorkingType = jobPosting.WorkingType;
            existing.PositionLevel = jobPosting.PositionLevel;
            existing.Department = jobPosting.Department;
            existing.Description = jobPosting.Description;
            existing.Experience = jobPosting.Experience;
            existing.EducationLevel = jobPosting.EducationLevel;
            existing.MilitaryStatus = jobPosting.MilitaryStatus;
            existing.ApplicationCount = jobPosting.ApplicationCount;
            existing.UpdatedAt = DateTime.UtcNow;

            _context.JobPostings.Update(existing);
            await _context.SaveChangesAsync();

            // Cache Invalidate & Sync
            await _cache.RemoveAsync($"{CacheKeyPrefix}_{id}");
            await RefreshSharedSearchCacheAsync();

            return existing;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _context.JobPostings.FindAsync(id);
            if (existing != null)
            {
                _context.JobPostings.Remove(existing);
                await _context.SaveChangesAsync();
            }

            // Veritabanında olmasa bile (eskiden kalıp cache'de kalmış olabilir)
            // cache senkronizasyonunu zorla çalıştırıyoruz ki cache temizlensin.
            await _cache.RemoveAsync($"{CacheKeyPrefix}_{id}");
            await RefreshSharedSearchCacheAsync();

            return true;
        }

        private async Task RefreshSharedSearchCacheAsync()
        {
            try
            {
                var allJobs = await _context.JobPostings.ToListAsync();
                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                };
                await _cache.SetStringAsync("JobPostings_Page_1_Size_1000", JsonSerializer.Serialize(allJobs), cacheOptions);
                
                // Ayrıca yerel liste cache'lerini de sil
                await _cache.RemoveAsync($"{CacheKeyPrefix}_Page_1_Size_10");
                await _cache.RemoveAsync($"{CacheKeyPrefix}_Page_1_Size_20");
                await _cache.RemoveAsync($"{CacheKeyPrefix}_Page_1_Size_100"); // Admin sayfasının önbelleğini de temizle
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARNING] Redis cache sync failed: {ex.Message}");
            }
        }
    }
}
