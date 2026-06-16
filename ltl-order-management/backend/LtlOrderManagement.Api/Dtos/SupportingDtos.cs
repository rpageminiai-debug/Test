namespace LtlOrderManagement.Api.Dtos;

public class OrderListItemDto
{
    public int Id { get; set; }
    public string Status { get; set; } = "";
    public string? FreightBillNumber { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? ShipperName { get; set; }
    public string? ConsigneeName { get; set; }
    public string? ServiceLevel { get; set; }
    public string? PaymentType { get; set; }
    public string? ReasonForParking { get; set; }
}

/// <summary>Request body for parking an order (reason is captured per the workbook's PARKED ORDERS flow).</summary>
public class ParkRequest
{
    public OrderDto Order { get; set; } = new();
    public string? ReasonForParking { get; set; }
}

/// <summary>The dropdown lists (from the workbook "Lists" sheet) and field validation config.</summary>
public class ReferenceDataDto
{
    public Dictionary<string, string[]> Lists { get; set; } = new();
}

public class ValidationErrorResponse
{
    public string Message { get; set; } = "";
    public List<FieldError> Errors { get; set; } = new();
}

public class FieldError
{
    public string Field { get; set; } = "";
    public string Label { get; set; } = "";
    public string Message { get; set; } = "";
}
