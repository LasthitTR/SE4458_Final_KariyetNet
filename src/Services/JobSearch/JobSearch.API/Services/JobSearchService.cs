using JobSearch.API.Models;
using JobSearch.API.Settings;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Text.Json;

namespace JobSearch.API.Services
{
    public class JobSearchService : IJobSearchService
    {
        private readonly IMongoCollection<UserSearchHistory> _searchHistoryCollection;
        private readonly IMongoCollection<JobApplication> _jobApplicationsCollection;
        private readonly IDistributedCache _cache;
        private readonly IEnumerable<UserSearchHistory>? _testSearchHistory;
        // Not: Redis key'leri tüm sayfaları veya listeyi çekmek için senkronize olmalı
        // veya JobPosting Service ile paylaşımlı bir veri senkronizasyonu kurulmalı.
        // Basitlik adına, "JobPostings_Page_1_Size_1000" gibi toplu bir cache'den okuduğumuzu varsayıyoruz.
        private const string CacheKeyPrefix = "JobPostings_Page_1_Size_1000"; 

        public JobSearchService(IOptions<MongoDbSettings> mongoDbSettings, IDistributedCache cache, IMongoClient? mongoClient = null, IEnumerable<UserSearchHistory>? testSearchHistory = null)
        {
            var client = mongoClient ?? new MongoClient(mongoDbSettings.Value.ConnectionString);
            var mongoDatabase = client.GetDatabase(mongoDbSettings.Value.DatabaseName);

            _searchHistoryCollection = mongoDatabase.GetCollection<UserSearchHistory>(mongoDbSettings.Value.CollectionName);
            _jobApplicationsCollection = mongoDatabase.GetCollection<JobApplication>("JobApplications");
            _cache = cache;
            _testSearchHistory = testSearchHistory;
        }

        private static string NormalizeForSearch(string? value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;

            var sb = new System.Text.StringBuilder();
            foreach (var c in value.Trim())
            {
                char newChar = char.ToLowerInvariant(c);
                switch (newChar)
                {
                    case 'ı':
                    case 'İ':
                    case 'i':
                        newChar = 'i';
                        break;
                    case 'ş':
                    case 'Ş':
                        newChar = 's';
                        break;
                    case 'ğ':
                    case 'Ğ':
                        newChar = 'g';
                        break;
                    case 'ü':
                    case 'Ü':
                        newChar = 'u';
                        break;
                    case 'ö':
                    case 'Ö':
                        newChar = 'o';
                        break;
                    case 'ç':
                    case 'Ç':
                        newChar = 'c';
                        break;
                }
                sb.Append(newChar);
            }
            return sb.ToString();
        }

        public async Task<IEnumerable<JobPostingDto>> SearchJobsAsync(string? position, string? city, string? town, string? workingPreference, string? userId, int pageNumber = 1, int pageSize = 10)
        {
            // 1. Redis'ten ilanları çek (Gerçek senaryoda daha dinamik veya pattern-based bir query gerekebilir)
            var cachedData = await _cache.GetStringAsync(CacheKeyPrefix);
            IEnumerable<JobPostingDto> jobPostings = new List<JobPostingDto>();

            if (!string.IsNullOrEmpty(cachedData))
            {
                jobPostings = JsonSerializer.Deserialize<IEnumerable<JobPostingDto>>(cachedData) ?? new List<JobPostingDto>();
            }

            // 2. RAM üzerinde Linq ile filtrele (Türkçe ve İngilizce karakter duyarlı normalizasyonlu arama)
            if (!string.IsNullOrEmpty(position))
            {
                var posNormalized = NormalizeForSearch(position);
                jobPostings = jobPostings.Where(j => NormalizeForSearch(j.Title).Contains(posNormalized));
            }
            if (!string.IsNullOrEmpty(city))
            {
                var cityNormalized = NormalizeForSearch(city);
                jobPostings = jobPostings.Where(j => NormalizeForSearch(j.City).Equals(cityNormalized));
            }
            if (!string.IsNullOrEmpty(town))
            {
                var townNormalized = NormalizeForSearch(town);
                jobPostings = jobPostings.Where(j => NormalizeForSearch(j.Town).Equals(townNormalized));
            }
            if (!string.IsNullOrEmpty(workingPreference))
            {
                var wpNormalized = NormalizeForSearch(workingPreference);
                jobPostings = jobPostings.Where(j => NormalizeForSearch(j.WorkingPreference).Equals(wpNormalized));
            }


            // Sayfalama (Pagination)
            var pagedResults = jobPostings
                .OrderByDescending(j => j.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // 3. Kullanıcı login olmuşsa aramayı MongoDB'ye asenkron (fire-and-forget veya Task.Run) olarak kaydet
            if (!string.IsNullOrEmpty(userId) && (!string.IsNullOrEmpty(position) || !string.IsNullOrEmpty(city)))
            {
                var searchHistory = new UserSearchHistory
                {
                    UserId = userId,
                    PositionKeyword = position ?? string.Empty,
                    City = city ?? string.Empty,
                    Town = town ?? string.Empty,
                    WorkingPreference = workingPreference ?? string.Empty,
                    SearchDate = DateTime.UtcNow
                };

                // Asenkron kaydet (Fire and Forget)
                _ = Task.Run(() => _searchHistoryCollection.InsertOneAsync(searchHistory));
            }

            return pagedResults;
        }

        public async Task<IEnumerable<UserSearchHistory>> GetRecentSearchesAsync(string userId)
        {
            if (_testSearchHistory != null)
            {
                return _testSearchHistory
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.SearchDate)
                    .Take(5)
                    .ToList();
            }

            var filter = Builders<UserSearchHistory>.Filter.Eq(s => s.UserId, userId);

            return await _searchHistoryCollection.Find(filter)
                .SortByDescending(s => s.SearchDate)
                .Limit(5)
                .ToListAsync();
        }

        public async Task<bool> HasAppliedAsync(string userId, Guid jobId)
        {
            var jobIdStr = jobId.ToString();
            var filter = Builders<JobApplication>.Filter.And(
                Builders<JobApplication>.Filter.Eq(a => a.UserId, userId),
                Builders<JobApplication>.Filter.Eq(a => a.JobId, jobIdStr)
            );
            var count = await _jobApplicationsCollection.CountDocumentsAsync(filter);
            return count > 0;
        }

        public async Task<bool> ApplyToJobAsync(string userId, Guid jobId)
        {
            if (await HasAppliedAsync(userId, jobId)) return false;

            var application = new JobApplication
            {
                UserId = userId,
                JobId = jobId.ToString(),
                AppliedAt = DateTime.UtcNow
            };
            await _jobApplicationsCollection.InsertOneAsync(application);
            return true;
        }
    }
}
