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

    public class UserNotification
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty; // Boşsa genel bildirim
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    [System.ComponentModel.DataAnnotations.Schema.Table("JobPostings")]
    public class JobPostingDbModel
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Town { get; set; } = string.Empty;
    }
}

