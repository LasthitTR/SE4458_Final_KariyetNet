using AIAgent.API.Services;
using Asp.Versioning;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5004");

// HttpClient DI (Gemini ve API Gateway'e istek atmak için)
builder.Services.AddHttpClient<IAiAgentService, AiAgentService>();

// API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddMvc();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
