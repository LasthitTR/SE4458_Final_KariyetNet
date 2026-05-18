using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Threading;
using JobSearch.API.Models;
using JobSearch.API.Services;
using JobSearch.API.Settings;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Moq;
using System.Text.Json;
using Xunit;

namespace JobSearch.API.Tests
{
    public class JobSearchServiceTests
    {
        [Fact]
        public async Task SearchJobsAsync_FiltersByPositionAndCity_WhenCacheHasData()
        {
            // Arrange
            var postings = new[] {
                new JobPostingDto { Id = Guid.NewGuid(), Title = "Yaz�l�m Uzman�", City = "izmir", Town = "konak", WorkingPreference = "Tam Zamanl�", CreatedAt = DateTime.UtcNow },
                new JobPostingDto { Id = Guid.NewGuid(), Title = "Backend Developer", City = "istanbul", Town = "kadikoy", WorkingPreference = "Tam Zamanl�", CreatedAt = DateTime.UtcNow }
            };

            var cacheMock = new Mock<IDistributedCache>();
            cacheMock.Setup(c => c.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(JsonSerializer.SerializeToUtf8Bytes(postings));

            var mongoSettings = Options.Create(new MongoDbSettings { ConnectionString = "mongodb://localhost:27017", DatabaseName = "testdb", CollectionName = "UserSearchHistory" });

            var service = new JobSearchService(mongoSettings, cacheMock.Object, mongoClient: null, testSearchHistory: null);

            // Act
            var results = await service.SearchJobsAsync("Yaz�l�m", "izmir", null, null, null);

            // Assert
            Assert.Single(results);
            Assert.Contains(results, r => r.Title.Contains("Yaz�l�m"));
        }

        [Fact]
        public async Task GetRecentSearchesAsync_ReturnsList_WhenTestHistoryProvided()
        {
            // Arrange
            var expected = new List<UserSearchHistory>
            {
                new UserSearchHistory { UserId = "user1", PositionKeyword = "Yaz�l�m", City = "izmir", SearchDate = DateTime.UtcNow }
            };

            var cacheMock = new Mock<IDistributedCache>();
            var mongoSettings = Options.Create(new MongoDbSettings { ConnectionString = "mongodb://localhost:27017", DatabaseName = "testdb", CollectionName = "UserSearchHistory" });

            var service = new JobSearchService(mongoSettings, cacheMock.Object, mongoClient: null, testSearchHistory: expected);

            // Act
            var results = await service.GetRecentSearchesAsync("user1");

            // Assert
            Assert.NotNull(results);
            Assert.Single(results);
            Assert.Equal("user1", results.First().UserId);
        }
    }
}
