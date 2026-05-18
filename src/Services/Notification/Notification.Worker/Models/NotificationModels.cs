namespace Notification.Worker.Models
{
    public class JobAlert
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Keywords { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Town { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class UnprocessedJob
    {
        public Guid Id { get; set; }
        public Guid JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Town { get; set; } = string.Empty;
        public string WorkingPreference { get; set; } = string.Empty;
        public string WorkingType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsProcessed { get; set; } = false;
    }
}
