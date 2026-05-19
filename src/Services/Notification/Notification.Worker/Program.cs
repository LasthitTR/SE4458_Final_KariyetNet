using MassTransit;
using Microsoft.EntityFrameworkCore;
using Notification.Worker.Consumers;
using Notification.Worker.Data;
using Notification.Worker.Tasks;
using Quartz;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://localhost:5003"); // Worker Service as Hosted Service via WebApplicationBuilder (or Host.CreateApplicationBuilder)
}

// 1. PostgreSQL DB Context
builder.Services.AddDbContext<NotificationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection"));
});

// 2. MassTransit (RabbitMQ Consumer)
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<JobPostedIntegrationEventConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Bulut AMQPS bağlantısı (Explicit SSL config)
        cfg.Host("cow.rmq2.cloudamqp.com", "jhsvgrrk", h =>
        {
            h.Username("jhsvgrrk");
            h.Password("pSlLz5Xyyrfop-KhPPxGcWEZnTUnFGoL");
            h.UseSsl(s =>
            {
                s.Protocol = System.Security.Authentication.SslProtocols.Tls12;
            });
        });

        cfg.ReceiveEndpoint("job-posting-notification-queue", e =>
        {
            e.ConfigureConsumer<JobPostedIntegrationEventConsumer>(context);
        });
    });
});

// 3. Quartz.NET (Zamanlanmış Görevler)
builder.Services.AddQuartz(q =>
{
    // JobAlertNotificationTask (Hızlı eşleşme için her 30 saniyede bir)
    var jobKey1 = new JobKey("JobAlertNotificationTask");
    q.AddJob<JobAlertNotificationTask>(opts => opts.WithIdentity(jobKey1));
    q.AddTrigger(opts => opts
        .ForJob(jobKey1)
        .WithIdentity("JobAlertNotificationTask-trigger")
        .WithSimpleSchedule(x => x.WithIntervalInSeconds(30).RepeatForever()));

    // RelatedJobNotificationTask (Örn: Her gün gece 02:00'de veya test için 10 dk'da bir)
    var jobKey2 = new JobKey("RelatedJobNotificationTask");
    q.AddJob<RelatedJobNotificationTask>(opts => opts.WithIdentity(jobKey2));
    q.AddTrigger(opts => opts
        .ForJob(jobKey2)
        .WithIdentity("RelatedJobNotificationTask-trigger")
        .WithSimpleSchedule(x => x.WithIntervalInMinutes(10).RepeatForever()));
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

builder.Services.AddControllers();

var app = builder.Build();

// UserNotifications tablosunu yoksa oluştur (EnsureCreated mevcut DB'de yeni tablo eklemez)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""UserNotifications"" (
            ""Id"" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            ""UserId"" text NOT NULL DEFAULT '',
            ""Title"" text NOT NULL DEFAULT '',
            ""Message"" text NOT NULL DEFAULT '',
            ""JobId"" text NOT NULL DEFAULT '',
            ""IsRead"" boolean NOT NULL DEFAULT false,
            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now()
        );
    ");
}

app.UseRouting();
app.MapControllers();

app.Run();
