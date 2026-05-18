using JobPosting.API.Models;

namespace JobPosting.API.Services
{
    public interface IJobPostingService
    {
        Task<IEnumerable<JobPostingEntity>> GetAllAsync(int pageNumber, int pageSize);
        Task<JobPostingEntity?> GetByIdAsync(Guid id);
        Task<JobPostingEntity> CreateAsync(JobPostingEntity jobPosting);
        Task<JobPostingEntity?> UpdateAsync(Guid id, JobPostingEntity jobPosting);
        Task<bool> DeleteAsync(Guid id);
    }
}
