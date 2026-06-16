namespace LtlOrderManagement.Api.Domain;

/// <summary>
/// Lifecycle states that mirror the workbook's "SUBMITTED ORDERS" / "PARKED ORDERS"
/// sheets and the DISPOSITION list (ORDER SUBMITTED / ORDER PARKED / ORDER UPDATED).
/// </summary>
public enum OrderStatus
{
    Draft = 0,
    Submitted = 1,
    Parked = 2,
    Updated = 3
}
