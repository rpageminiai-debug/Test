using LtlOrderManagement.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace LtlOrderManagement.Api.Data;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options) { }

    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(o => o.FreightBillNumber).HasMaxLength(40);
            e.HasIndex(o => o.Status);
            e.HasIndex(o => o.FreightBillNumber);
        });
    }
}
