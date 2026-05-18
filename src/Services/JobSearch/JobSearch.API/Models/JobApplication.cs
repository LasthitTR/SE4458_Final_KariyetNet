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
        
        public string JobId { get; set; } = string.Empty;
        
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    }
}
