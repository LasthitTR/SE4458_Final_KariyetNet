namespace AIAgent.API.Services
{
    public interface IAiAgentService
    {
        Task<string> ProcessUserMessageAsync(string message, string? userId);
    }
}
