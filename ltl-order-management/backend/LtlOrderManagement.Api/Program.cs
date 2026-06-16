using LtlOrderManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database provider:
//  - If a "Default" connection string is configured, use SQL Server (production / TruckMate MS SQL).
//  - Otherwise fall back to an in-memory store so the API runs out-of-the-box for development.
var connectionString = builder.Configuration.GetConnectionString("Default");
builder.Services.AddDbContext<OrderDbContext>(options =>
{
    if (string.IsNullOrWhiteSpace(connectionString))
        options.UseInMemoryDatabase("LtlOrders");
    else
        options.UseSqlServer(connectionString);
});

const string CorsPolicy = "Spa";
builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
    policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure the schema exists when using a relational provider.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    if (db.Database.IsRelational())
        db.Database.EnsureCreated();
}

app.UseCors(CorsPolicy);
app.MapControllers();

app.Run();
