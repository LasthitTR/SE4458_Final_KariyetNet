using Asp.Versioning;
using JobPosting.API.Models;
using JobPosting.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace JobPosting.API.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    public class JobPostingsController : ControllerBase
    {
        private readonly IJobPostingService _jobPostingService;

        public JobPostingsController(IJobPostingService jobPostingService)
        {
            _jobPostingService = jobPostingService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var jobPostings = await _jobPostingService.GetAllAsync(pageNumber, pageSize);
            return Ok(jobPostings);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var jobPosting = await _jobPostingService.GetByIdAsync(id);
            if (jobPosting == null) return NotFound();
            
            return Ok(jobPosting);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] JobPostingEntity jobPosting)
        {
            var createdJobPosting = await _jobPostingService.CreateAsync(jobPosting);
            return CreatedAtAction(nameof(GetById), new { id = createdJobPosting.Id }, createdJobPosting);
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> Update(Guid id, [FromBody] JobPostingEntity jobPosting)
        {
            var updatedJobPosting = await _jobPostingService.UpdateAsync(id, jobPosting);
            if (updatedJobPosting == null) return NotFound();
            
            return Ok(updatedJobPosting);
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _jobPostingService.DeleteAsync(id);
            if (!result) return NotFound();
            
            return NoContent();
        }
    }
}
