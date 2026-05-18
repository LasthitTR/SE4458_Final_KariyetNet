using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using Notification.Worker.Data;
using Quartz;

namespace Notification.Worker.Tasks
{
    // MongoDB modelini sadece okuma amaçlı buraya alıyoruz (veya shared kütüphaneden çekilebilir)
    public class SearchHistoryDto
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string PositionKeyword { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public DateTime SearchDate { get; set; }
    }

    public class RelatedJobNotificationTask : IJob
    {
        private readonly ILogger<RelatedJobNotificationTask> _logger;
        private readonly IConfiguration _configuration;
        private readonly IServiceProvider _serviceProvider;

        public RelatedJobNotificationTask(ILogger<RelatedJobNotificationTask> logger, IConfiguration configuration, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _configuration = configuration;
            _serviceProvider = serviceProvider;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogInformation("RelatedJobNotificationTask çalışıyor...");

            // MongoDB Bağlantısı (JobSearch servisinin DB'sini okuyoruz)
            var mongoConn = _configuration.GetConnectionString("MongoDbConnection");
            if (string.IsNullOrEmpty(mongoConn)) return;

            var client = new MongoClient(mongoConn);
            var database = client.GetDatabase("JobSearchDb");
            var collection = database.GetCollection<SearchHistoryDto>("UserSearchHistory");

            // Son 1 gündeki aramaları çek
            var recentSearches = await collection.Find(x => x.SearchDate >= DateTime.UtcNow.AddDays(-1)).ToListAsync();

            if (!recentSearches.Any()) return;

            // PostgreSQL bağlantısı ile aktif ilanları kontrol edip eşleşme buluyoruz
            // Gerçek projede bu Redis'ten veya HTTP çağrısıyla JobSearch servisinden de yapılabilir
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
            var activeJobs = dbContext.UnprocessedJobs.Where(j => j.IsProcessed).Take(100).ToList(); 

            foreach (var search in recentSearches.GroupBy(x => x.UserId))
            {
                var userTopSearch = search.OrderByDescending(x => x.SearchDate).First();
                
                var recommendedJob = activeJobs.FirstOrDefault(j => 
                    (string.IsNullOrEmpty(userTopSearch.City) || j.City == userTopSearch.City) &&
                    (string.IsNullOrEmpty(userTopSearch.PositionKeyword) || j.Title.Contains(userTopSearch.PositionKeyword, StringComparison.OrdinalIgnoreCase))
                );

                if (recommendedJob != null)
                {
                    _logger.LogInformation($"[ÖNERİ] Kullanıcıya ({search.Key}) geçmiş aramasına göre ilan önerildi: {recommendedJob.Title} - {recommendedJob.City}");
                }
            }
        }
    }
}
