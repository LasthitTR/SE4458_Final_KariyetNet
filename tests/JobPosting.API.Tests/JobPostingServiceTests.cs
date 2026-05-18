using System.Text.Json;
using EventBus.Messages.Events;
using JobPosting.API.Data;
using JobPosting.API.Models;
using JobPosting.API.Services;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using Xunit;

namespace JobPosting.API.Tests;

public class JobPostingServiceTests
{
    private static JobPostingDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<JobPostingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new JobPostingDbContext(options);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsCachedResults_WhenCacheContainsPage()
    {
        await using var context = CreateDbContext();
        var cache = new TestDistributedCache();
        var publishEndpoint = new Mock<IPublishEndpoint>();

        var cachedJobs = new List<JobPostingEntity>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Backend Developer",
                CompanyName = "Acme",
                City = "Istanbul",
                CreatedAt = DateTime.UtcNow
            }
        };

        cache.SeedString("JobPostings_Page_1_Size_2", JsonSerializer.Serialize(cachedJobs));

        var service = new JobPostingService(context, cache, publishEndpoint.Object);

        var result = (await service.GetAllAsync(1, 2)).ToList();

        Assert.Single(result);
        Assert.Equal("Backend Developer", result[0].Title);
        Assert.Equal("Acme", result[0].CompanyName);
    }

    [Fact]
    public async Task CreateAsync_PersistsEntity_AndPublishesIntegrationEvent()
    {
        await using var context = CreateDbContext();
        var cache = new TestDistributedCache();
        var publishEndpoint = new Mock<IPublishEndpoint>();

        var service = new JobPostingService(context, cache, publishEndpoint.Object);

        var entity = new JobPostingEntity
        {
            Title = "Frontend Developer",
            CompanyName = "Contoso",
            City = "Ankara",
            Town = "Çankaya",
            WorkingPreference = "Hybrid",
            WorkingType = "Full Time",
            PositionLevel = "Mid",
            Department = "IT",
            Description = "Build UI components",
            Experience = "3 years",
            EducationLevel = "Bachelor",
            MilitaryStatus = "Not Required"
        };

        var created = await service.CreateAsync(entity);

        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.True(created.CreatedAt > DateTime.MinValue);
        Assert.Single(await context.JobPostings.ToListAsync());

        publishEndpoint.Verify(endpoint => endpoint.Publish(
            It.Is<JobPostedIntegrationEvent>(evt =>
                evt.JobId == created.Id &&
                evt.Title == "Frontend Developer" &&
                evt.CompanyName == "Contoso"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_RemovesEntity_AndRemovesCacheEntries()
    {
        await using var context = CreateDbContext();
        var cache = new TestDistributedCache();
        var publishEndpoint = new Mock<IPublishEndpoint>();

        var existing = new JobPostingEntity
        {
            Id = Guid.NewGuid(),
            Title = "DevOps Engineer",
            CompanyName = "Tailspin",
            City = "Izmir",
            CreatedAt = DateTime.UtcNow
        };

        context.JobPostings.Add(existing);
        await context.SaveChangesAsync();

        var service = new JobPostingService(context, cache, publishEndpoint.Object);

        var deleted = await service.DeleteAsync(existing.Id);

        Assert.True(deleted);
        Assert.Empty(await context.JobPostings.ToListAsync());
        Assert.Contains($"JobPostings_{existing.Id}", cache.RemovedKeys);
    }
}
