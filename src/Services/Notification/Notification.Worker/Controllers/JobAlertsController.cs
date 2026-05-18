using Microsoft.AspNetCore.Mvc;
using Notification.Worker.Data;
using Notification.Worker.Models;

namespace Notification.Worker.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class JobAlertsController : ControllerBase
    {
        private readonly NotificationDbContext _context;

        public JobAlertsController(NotificationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateJobAlert([FromBody] JobAlert jobAlert)
        {
            jobAlert.Id = Guid.NewGuid();
            jobAlert.CreatedAt = DateTime.UtcNow;
            
            _context.JobAlerts.Add(jobAlert);
            await _context.SaveChangesAsync();
            
            return Ok(jobAlert);
        }
    }
}
