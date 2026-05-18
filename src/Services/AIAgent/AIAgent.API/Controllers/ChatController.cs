using AIAgent.API.Models;
using AIAgent.API.Services;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;

namespace AIAgent.API.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IAiAgentService _aiAgentService;

        public ChatController(IAiAgentService aiAgentService)
        {
            _aiAgentService = aiAgentService;
        }

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest("Message cannot be empty.");
            }

            var response = await _aiAgentService.ProcessUserMessageAsync(request.Message, request.UserId);
            
            return Ok(new { Response = response });
        }
    }
}
