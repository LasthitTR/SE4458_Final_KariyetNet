using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Notification.Worker.Data;

namespace Notification.Worker.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly NotificationDbContext _context;

        public NotificationsController(NotificationDbContext context)
        {
            _context = context;
        }

        // GET /api/v1/notifications/{userId} - Kullanıcının bildirimlerini getir
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetNotifications(string userId)
        {
            var notifications = await _context.UserNotifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .ToListAsync();

            return Ok(notifications);
        }

        // PUT /api/v1/notifications/{userId}/read-all - Hepsini okundu olarak işaretle
        [HttpPut("{userId}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(string userId)
        {
            var unread = await _context.UserNotifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
                n.IsRead = true;

            await _context.SaveChangesAsync();
            return Ok(new { updated = unread.Count });
        }

        // POST /api/v1/notifications/test - Test amaçlı manuel bildirim oluştur
        [HttpPost("test")]
        public async Task<IActionResult> CreateTestNotification([FromBody] TestNotificationRequest request)
        {
            if (string.IsNullOrEmpty(request.UserId))
                return BadRequest("UserId gerekli.");

            var notification = new Notification.Worker.Models.UserNotification
            {
                UserId = request.UserId,
                Title = "🔔 Test Bildirimi",
                Message = "Bu bir test bildirimidir. Sisteminiz doğru çalışıyor!",
                JobId = string.Empty,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserNotifications.Add(notification);
            await _context.SaveChangesAsync();
            return Ok(notification);
        }

        // GET /api/v1/notifications/debug/all - Debug verilerini getir
        [HttpGet("debug/all")]
        public async Task<IActionResult> DebugUnprocessed()
        {
            var unprocessed = await _context.UnprocessedJobs.ToListAsync();
            var notifications = await _context.UserNotifications.ToListAsync();
            var alerts = await _context.JobAlerts.ToListAsync();
            return Ok(new { unprocessed, notifications, alerts });
        }

        // DELETE /api/v1/notifications/{id} - Tek bir bildirimi sil
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var notification = await _context.UserNotifications.FindAsync(id);
            if (notification == null) return NotFound();

            _context.UserNotifications.Remove(notification);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // DELETE /api/v1/notifications/user/{userId} - Kullanıcının tüm bildirimlerini sil
        [HttpDelete("user/{userId}")]
        public async Task<IActionResult> DeleteAllUserNotifications(string userId)
        {
            var notifications = await _context.UserNotifications
                .Where(n => n.UserId == userId)
                .ToListAsync();

            _context.UserNotifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();
            return Ok(new { deletedCount = notifications.Count });
        }
    }

    public class TestNotificationRequest
    {
        public string UserId { get; set; } = string.Empty;
    }
}
