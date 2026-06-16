using LtlOrderManagement.Api.Data;
using LtlOrderManagement.Api.Domain;
using LtlOrderManagement.Api.Dtos;
using LtlOrderManagement.Api.Validation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LtlOrderManagement.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly OrderDbContext _db;

    public OrdersController(OrderDbContext db) => _db = db;

    /// <summary>List orders, optionally filtered by status (Submitted / Parked / Draft / Updated).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderListItemDto>>> List([FromQuery] string? status)
    {
        var query = _db.Orders.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var parsed))
            query = query.Where(o => o.Status == parsed);

        var items = await query
            .OrderByDescending(o => o.Timestamp)
            .Select(o => new OrderListItemDto
            {
                Id = o.Id,
                Status = o.Status.ToString(),
                FreightBillNumber = o.FreightBillNumber,
                Timestamp = o.Timestamp,
                UpdatedAt = o.UpdatedAt,
                ShipperName = o.ShipperName,
                ConsigneeName = o.ConsigneeName,
                ServiceLevel = o.ServiceLevel,
                PaymentType = o.PaymentType,
                ReasonForParking = o.ReasonForParking
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> Get(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        return order is null ? NotFound() : Ok(order.ToDto());
    }

    /// <summary>
    /// Submit a new order. All required fields (per the workbook Config) must be present,
    /// otherwise a 422 with the list of missing fields is returned. A freight bill number
    /// is generated on success.
    /// </summary>
    [HttpPost("submit")]
    public async Task<ActionResult<OrderDto>> Submit([FromBody] OrderDto dto)
    {
        var errors = OrderValidator.Validate(dto);
        if (errors.Count > 0)
            return UnprocessableEntity(new ValidationErrorResponse
            {
                Message = "Order cannot be submitted because required fields are missing.",
                Errors = errors
            });

        var order = new Order { Status = OrderStatus.Submitted, Timestamp = DateTimeOffset.UtcNow };
        dto.ApplyTo(order);
        order.Disposition = "ORDER SUBMITTED";
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        order.FreightBillNumber = $"APPS{order.Id:D7}";
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = order.Id }, order.ToDto());
    }

    /// <summary>
    /// Park an order. Parking deliberately skips required-field validation so an agent can
    /// save a partially complete order (the workbook's "PARKED ORDERS" flow), capturing a reason.
    /// </summary>
    [HttpPost("park")]
    public async Task<ActionResult<OrderDto>> Park([FromBody] ParkRequest request)
    {
        var order = new Order { Status = OrderStatus.Parked, Timestamp = DateTimeOffset.UtcNow };
        request.Order.ApplyTo(order);
        order.ReasonForParking = request.ReasonForParking;
        order.Disposition = "ORDER PARKED";
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = order.Id }, order.ToDto());
    }

    /// <summary>
    /// Update an existing order. Re-validates required fields and promotes the order to
    /// "Updated" (the workbook's "ORDER UPDATED" disposition).
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<OrderDto>> Update(int id, [FromBody] OrderDto dto)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order is null) return NotFound();

        var errors = OrderValidator.Validate(dto);
        if (errors.Count > 0)
            return UnprocessableEntity(new ValidationErrorResponse
            {
                Message = "Order cannot be updated because required fields are missing.",
                Errors = errors
            });

        dto.ApplyTo(order);
        order.Status = OrderStatus.Updated;
        order.Disposition = "ORDER UPDATED";
        order.UpdatedAt = DateTimeOffset.UtcNow;
        if (string.IsNullOrEmpty(order.FreightBillNumber))
            order.FreightBillNumber = $"APPS{order.Id:D7}";
        await _db.SaveChangesAsync();

        return Ok(order.ToDto());
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _db.Orders.FindAsync(id);
        if (order is null) return NotFound();
        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
