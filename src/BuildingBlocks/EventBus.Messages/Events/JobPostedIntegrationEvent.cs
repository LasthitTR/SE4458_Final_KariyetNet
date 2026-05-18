namespace EventBus.Messages.Events
{
    public class JobPostedIntegrationEvent
    {
        public Guid JobId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Town { get; set; } = string.Empty;
        public string WorkingPreference { get; set; } = string.Empty;
        public string WorkingType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
