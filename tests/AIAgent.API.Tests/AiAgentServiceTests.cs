using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;
using Xunit;
using AIAgent.API.Services;

namespace AIAgent.API.Tests
{
    public class AiAgentServiceTests
    {
        [Fact]
        public async Task ProcessUserMessageAsync_WhenHFTokenMissing_ReturnsFriendlyFallback()
        {
            var handlerMock = new Mock<HttpMessageHandler>();
            // Simulate HF returning 401 due to missing token
            handlerMock.Protected()
               .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
               .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.Unauthorized) { Content = new StringContent("Unauthorized") });

            var httpClient = new HttpClient(handlerMock.Object);

            var inMemorySettings = new System.Collections.Generic.Dictionary<string, string> {
                { "HF_TOKEN", "" },
                { "ApiGatewayUrl", "http://localhost:5000" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

            var service = new AiAgentService(httpClient, config, NullLogger<AiAgentService>.Instance);

            var result = await service.ProcessUserMessageAsync("selam", null);

            Assert.Contains("üzgünüm", result, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ProcessUserMessageAsync_WhenJobSearchReturnsJobs_IncludesJobCount()
        {
            var gatewayResponse = "[ { \"id\": \"00000000-0000-0000-0000-000000000001\", \"title\": \"Dev\", \"companyName\": \"X\", \"city\": \"Istanbul\", \"town\": \"\", \"workingPreference\": \"Remote\", \"workingType\": \"FullTime\" } ]";

            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock.Protected()
               .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(r => r.Method == HttpMethod.Get), ItExpr.IsAny<CancellationToken>())
               .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(gatewayResponse) });

            // For HF calls, return a simple JSON for extraction step
            handlerMock.Protected()
               .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.Is<HttpRequestMessage>(r => r.Method == HttpMethod.Post), ItExpr.IsAny<CancellationToken>())
               .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{ \"City\": \"Istanbul\", \"Position\": \"yazılım\" }") });

            var httpClient = new HttpClient(handlerMock.Object);

            var inMemorySettings = new System.Collections.Generic.Dictionary<string, string> {
                { "HF_TOKEN", "dummy" },
                { "ApiGatewayUrl", "http://localhost:5000" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

            var service = new AiAgentService(httpClient, config, NullLogger<AiAgentService>.Instance);

            var result = await service.ProcessUserMessageAsync("İstanbul'da yazılım", "user1");

            Assert.Contains("Harika", result);
            Assert.Contains("1 adet", result);
        }
    }
}
