namespace JobPosting.API.Models
{
    public class JobPostingEntity
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Town { get; set; } = string.Empty;
        public string WorkingPreference { get; set; } = string.Empty; // Uzaktan, Hibrit vb.
        public string WorkingType { get; set; } = string.Empty; // Tam Zamanlı vb.
        public string PositionLevel { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Experience { get; set; } = string.Empty;
        public string EducationLevel { get; set; } = string.Empty;
        public string MilitaryStatus { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int ApplicationCount { get; set; } = 0;
    }
}
