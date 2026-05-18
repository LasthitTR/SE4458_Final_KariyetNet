using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace JobSearch.API.Models
{
    public class JobApplication
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        
        [BsonGuidRepresentation(GuidRepresentation.Standard)]
        public Guid JobId { get; set; }
        
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    }
}
