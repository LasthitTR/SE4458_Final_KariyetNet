using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace JobSearch.API.Models
{
    public class UserSearchHistory
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        
        public string PositionKeyword { get; set; } = string.Empty;
        
        public string City { get; set; } = string.Empty;
        
        public string Town { get; set; } = string.Empty;
        
        public string WorkingPreference { get; set; } = string.Empty;

        public DateTime SearchDate { get; set; } = DateTime.UtcNow;
    }
}
