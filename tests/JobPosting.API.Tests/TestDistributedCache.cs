using Microsoft.Extensions.Caching.Distributed;
using System.Collections.Concurrent;
using System.Text;

namespace JobPosting.API.Tests;

internal sealed class TestDistributedCache : IDistributedCache
{
    private readonly ConcurrentDictionary<string, byte[]> _store = new();

    public IReadOnlyCollection<string> RemovedKeys => _removedKeys;
    private readonly ConcurrentBag<string> _removedKeys = new();

    public byte[]? Get(string key)
        => _store.TryGetValue(key, out var value) ? value : null;

    public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
        => Task.FromResult(Get(key));

    public void Refresh(string key)
    {
    }

    public Task RefreshAsync(string key, CancellationToken token = default)
        => Task.CompletedTask;

    public void Remove(string key)
    {
        _store.TryRemove(key, out _);
        _removedKeys.Add(key);
    }

    public Task RemoveAsync(string key, CancellationToken token = default)
    {
        Remove(key);
        return Task.CompletedTask;
    }

    public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
    {
        _store[key] = value;
    }

    public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        Set(key, value, options);
        return Task.CompletedTask;
    }

    public void SeedString(string key, string value)
        => Set(key, Encoding.UTF8.GetBytes(value), new DistributedCacheEntryOptions());
}
