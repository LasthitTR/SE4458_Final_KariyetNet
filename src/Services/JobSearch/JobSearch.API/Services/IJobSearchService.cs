using JobSearch.API.Models;

namespace JobSearch.API.Services
{
    public interface IJobSearchService
    {
        Task<IEnumerable<JobPostingDto>> SearchJobsAsync(string? position, string? city, string? town, string? workingPreference, string? userId, int pageNumber = 1, int pageSize = 10);
        Task<IEnumerable<UserSearchHistory>> GetRecentSearchesAsync(string userId);
        Task<bool> HasAppliedAsync(string userId, Guid jobId);
        Task<bool> ApplyToJobAsync(string userId, Guid jobId);
    }
}
