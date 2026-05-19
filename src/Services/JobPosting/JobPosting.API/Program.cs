using Asp.Versioning;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using JobPosting.API.Data;
using JobPosting.API.Services;
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://localhost:5001");
}

// Add services to the container.

// 1. PostgreSQL DB Context Configuration
builder.Services.AddDbContext<JobPostingDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection"));
});

// 2. Redis Cache Configuration
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("RedisConnection");
    options.InstanceName = "JobPosting_";
});

// 3. MassTransit (RabbitMQ) Configuration
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        // Bulut AMQPS bağlantısı (Doğrulanmış sabit URI ile otomatik SSL ve port 5671)
        cfg.Host(new Uri("amqps://jhsvgrrk:pSlLz5Xyyrfop-KhPPxGcWEZnTUnFGoL@cow.rmq2.cloudamqp.com/jhsvgrrk"));
    });
});

builder.Services.Configure<MassTransitHostOptions>(options =>
{
    options.WaitUntilStarted = false;
    options.StartTimeout = TimeSpan.FromSeconds(15);
});

// 4. API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddMvc();

// 5. Dependency Injection
builder.Services.AddScoped<IJobPostingService, JobPostingService>();

// Authentication & Authorization (JWT)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://securetoken.google.com/kariyernet-a805d";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = "kariyernet-a805d",
            ValidateIssuer = true,
            ValidIssuer = "https://securetoken.google.com/kariyernet-a805d",
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "JobPosting API is running.");
app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();
