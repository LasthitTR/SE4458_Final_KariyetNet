using Asp.Versioning;
using JobSearch.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace JobSearch.API.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    public class JobSearchController : ControllerBase
    {
        private readonly IJobSearchService _jobSearchService;

        public JobSearchController(IJobSearchService jobSearchService)
        {
            _jobSearchService = jobSearchService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchJobs(
            [FromQuery] string? position, 
            [FromQuery] string? city, 
            [FromQuery] string? town, 
            [FromQuery] string? workingPreference, 
            [FromQuery] string? userId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var results = await _jobSearchService.SearchJobsAsync(position, city, town, workingPreference, userId, pageNumber, pageSize);
            return Ok(results);
        }

        [HttpGet("recent-searches/{userId}")]
        public async Task<IActionResult> GetRecentSearches(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User ID is required.");
            }

            var recentSearches = await _jobSearchService.GetRecentSearchesAsync(userId);
            return Ok(recentSearches);
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyToJob([FromQuery] string userId, [FromQuery] Guid jobId)
        {
            var success = await _jobSearchService.ApplyToJobAsync(userId, jobId);
            if (!success) return BadRequest("Already applied.");
            return Ok(new { Success = true });
        }

        [HttpGet("has-applied")]
        public async Task<IActionResult> HasApplied([FromQuery] string userId, [FromQuery] Guid jobId)
        {
            var result = await _jobSearchService.HasAppliedAsync(userId, jobId);
            return Ok(new { HasApplied = result });
        }

        [HttpGet("autocomplete")]
        public IActionResult Autocomplete([FromQuery] string term)
        {
            // Gerçek bir senaryoda bu veri Redis'ten, Elasticsearch'ten veya MongoDB'den
            // prefix-search (regex) ile çekilebilir.
            // Örnek amaçlı statik veya basit liste dönüyoruz.
            var mockData = new List<string>
            {
                "Yazılım Uzmanı", "Frontend Developer", "Backend Developer", "İstanbul", "İzmir", "Ankara"
            };

            if (string.IsNullOrEmpty(term))
                return Ok(mockData);

            var filtered = mockData.Where(m => m.Contains(term, StringComparison.OrdinalIgnoreCase)).ToList();
            return Ok(filtered);
        }
    }
}
