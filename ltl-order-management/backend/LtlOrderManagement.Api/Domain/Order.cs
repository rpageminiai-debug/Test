namespace LtlOrderManagement.Api.Domain;

/// <summary>
/// A single LTL (Less-Than-Truckload) order. Field set mirrors the "Database" sheet of
/// the source workbook (1_Single_Order_Management_Form). Property names follow the
/// workbook column names so the mapping to the original form is one-to-one.
/// </summary>
public class Order
{
    public int Id { get; set; }

    // --- Lifecycle / metadata ---
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>Freight Bill number assigned when an order is submitted (e.g. APPS0000123).</summary>
    public string? FreightBillNumber { get; set; }

    /// <summary>Reason captured when an order is parked rather than submitted.</summary>
    public string? ReasonForParking { get; set; }

    public string? Disposition { get; set; }

    // --- Header ---
    public string? Quote { get; set; }
    public string? PaymentType { get; set; }

    // --- Caller ---
    public string? CallerName { get; set; }
    public string? CallerAddress { get; set; }
    public string? CallerPhone { get; set; }
    public string? CallerEmail { get; set; }
    public string? CallerHours { get; set; }

    // --- Shipper ---
    public string? ShipperName { get; set; }
    public string? ShipperAddress { get; set; }
    public string? ShipperPhone { get; set; }
    public string? ShipperEmail { get; set; }
    public string? ShipperHours { get; set; }

    // --- Consignee ---
    public string? ConsigneeName { get; set; }
    public string? ConsigneeAddress { get; set; }
    public string? ConsigneePhone { get; set; }
    public string? ConsigneeEmail { get; set; }
    public string? ConsigneeHours { get; set; }

    // --- Bill To (optional in the source form) ---
    public string? BillToName { get; set; }
    public string? BillToAddress { get; set; }
    public string? BillToPhone { get; set; }
    public string? BillToEmail { get; set; }
    public string? BillToHours { get; set; }

    // --- Pickup ---
    public string? PickupDate { get; set; }
    public string? PickupTime { get; set; }
    public string? PickupAddress { get; set; }
    public string? PickupAddressType { get; set; }
    public string? PickupApptRequired { get; set; }
    public string? PickupApptDate { get; set; }
    public string? PickupApptTime { get; set; }
    public string? PickupApptType { get; set; }

    // --- Delivery ---
    public string? DeliveryDate { get; set; }
    public string? DeliveryTime { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryAddressType { get; set; }
    public string? DeliveryApptRequired { get; set; }
    public string? DeliveryApptDate { get; set; }
    public string? DeliveryApptTime { get; set; }
    public string? DeliveryType { get; set; }
    public string? DeliveryApptType { get; set; }

    // --- Freight description ---
    public string? Pieces { get; set; }
    public string? PiecesUnit { get; set; }
    public string? Commodity { get; set; }
    public string? DangerousGoods { get; set; }
    public string? HeatRequirement { get; set; }
    public string? Slc { get; set; }
    public string? Stc { get; set; }
    public string? Sks { get; set; }
    public string? WeightLbs { get; set; }
    public string? LengthIn { get; set; }
    public string? WidthIn { get; set; }
    public string? HeightIn { get; set; }

    // --- Requested equipment: pickup ---
    public string? PickupEquipmentType { get; set; }
    public string? PickupPtg { get; set; }
    public string? PickupInside { get; set; }
    public string? PickupDock { get; set; }
    public string? PickupPalletJack { get; set; }

    // --- Requested equipment: delivery ---
    public string? DeliveryEquipmentType { get; set; }
    public string? DeliveryPtg { get; set; }
    public string? DeliveryInside { get; set; }
    public string? DeliveryDock { get; set; }
    public string? DeliveryPalletJack { get; set; }

    // --- Reference numbers ---
    public string? TraceType { get; set; }
    public string? PickupNumbers { get; set; }
    public string? Ccn { get; set; }
    public string? Po { get; set; }
    public string? Rad { get; set; }
    public string? ServiceLevel { get; set; }

    // --- Notes & instructions ---
    public string? FbNotes { get; set; }
    public string? ShippingInstructions { get; set; }
}
