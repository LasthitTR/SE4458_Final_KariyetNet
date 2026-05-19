using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        // GET /api/v1/jobalerts/user/{userId} - Kullanıcının alarmlarını sonuç sayılarıyla getir
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetJobAlertsByUser(string userId)
        {
            var alerts = await _context.JobAlerts
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var result = new List<object>();

            foreach (var alert in alerts)
            {
                var query = _context.JobPostings.AsQueryable();

                if (!string.IsNullOrEmpty(alert.City))
                {
                    query = query.Where(j => j.City.ToLower() == alert.City.ToLower());
                }
                if (!string.IsNullOrEmpty(alert.Keywords))
                {
                    query = query.Where(j => j.Title.ToLower().Contains(alert.Keywords.ToLower()));
                }

                var matchCount = await query.CountAsync();

                result.Add(new
                {
                    alert.Id,
                    alert.UserId,
                    alert.Keywords,
                    alert.Country,
                    alert.City,
                    alert.Town,
                    alert.CreatedAt,
                    MatchCount = matchCount
                });
            }

            return Ok(result);
        }

        // DELETE /api/v1/jobalerts/{id} - Alarm silme desteği (isteğe bağlı ama faydalı)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobAlert(Guid id)
        {
            var alert = await _context.JobAlerts.FindAsync(id);
            if (alert == null) return NotFound();

            _context.JobAlerts.Remove(alert);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
