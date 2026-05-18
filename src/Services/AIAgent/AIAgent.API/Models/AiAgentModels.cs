namespace AIAgent.API.Models
{
    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public string? UserId { get; set; }
    }

    public class JobSearchExtraction
    {
        public string? City { get; set; }
        public string? Town { get; set; }
        public string? Position { get; set; }
        public string? WorkingPreference { get; set; }
    }

    // Gemini API Request/Response DTOs (Simplified)
    public class GeminiRequest
    {
        public List<Content> contents { get; set; } = new();
    }
    public class Content
    {
        public List<Part> parts { get; set; } = new();
    }
    public class Part
    {
        public string text { get; set; } = string.Empty;
    }

    public class GeminiResponse
    {
        public List<Candidate> candidates { get; set; } = new();
    }
    public class Candidate
    {
        public Content content { get; set; } = new();
    }
}
