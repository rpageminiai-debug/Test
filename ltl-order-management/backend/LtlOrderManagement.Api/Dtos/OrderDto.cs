using LtlOrderManagement.Api.Domain;

namespace LtlOrderManagement.Api.Dtos;

/// <summary>
/// Full order payload exchanged with the SPA. Mirrors the editable fields of the form.
/// Read-only server-managed values (Id, Status, FreightBillNumber, timestamps) are echoed
/// back on responses and ignored on inbound create/update requests.
/// </summary>
public class OrderDto
{
    public int Id { get; set; }
    public string Status { get; set; } = nameof(OrderStatus.Draft);
    public DateTimeOffset? Timestamp { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? FreightBillNumber { get; set; }
    public string? ReasonForParking { get; set; }
    public string? Disposition { get; set; }

    public string? Quote { get; set; }
    public string? PaymentType { get; set; }

    public string? CallerName { get; set; }
    public string? CallerAddress { get; set; }
    public string? CallerPhone { get; set; }
    public string? CallerEmail { get; set; }
    public string? CallerHours { get; set; }

    public string? ShipperName { get; set; }
    public string? ShipperAddress { get; set; }
    public string? ShipperPhone { get; set; }
    public string? ShipperEmail { get; set; }
    public string? ShipperHours { get; set; }

    public string? ConsigneeName { get; set; }
    public string? ConsigneeAddress { get; set; }
    public string? ConsigneePhone { get; set; }
    public string? ConsigneeEmail { get; set; }
    public string? ConsigneeHours { get; set; }

    public string? BillToName { get; set; }
    public string? BillToAddress { get; set; }
    public string? BillToPhone { get; set; }
    public string? BillToEmail { get; set; }
    public string? BillToHours { get; set; }

    public string? PickupDate { get; set; }
    public string? PickupTime { get; set; }
    public string? PickupAddress { get; set; }
    public string? PickupAddressType { get; set; }
    public string? PickupApptRequired { get; set; }
    public string? PickupApptDate { get; set; }
    public string? PickupApptTime { get; set; }
    public string? PickupApptType { get; set; }

    public string? DeliveryDate { get; set; }
    public string? DeliveryTime { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryAddressType { get; set; }
    public string? DeliveryApptRequired { get; set; }
    public string? DeliveryApptDate { get; set; }
    public string? DeliveryApptTime { get; set; }
    public string? DeliveryType { get; set; }
    public string? DeliveryApptType { get; set; }

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

    public string? PickupEquipmentType { get; set; }
    public string? PickupPtg { get; set; }
    public string? PickupInside { get; set; }
    public string? PickupDock { get; set; }
    public string? PickupPalletJack { get; set; }

    public string? DeliveryEquipmentType { get; set; }
    public string? DeliveryPtg { get; set; }
    public string? DeliveryInside { get; set; }
    public string? DeliveryDock { get; set; }
    public string? DeliveryPalletJack { get; set; }

    public string? TraceType { get; set; }
    public string? PickupNumbers { get; set; }
    public string? Ccn { get; set; }
    public string? Po { get; set; }
    public string? Rad { get; set; }
    public string? ServiceLevel { get; set; }

    public string? FbNotes { get; set; }
    public string? ShippingInstructions { get; set; }
}

public static class OrderMapping
{
    public static OrderDto ToDto(this Order o) => new()
    {
        Id = o.Id,
        Status = o.Status.ToString(),
        Timestamp = o.Timestamp,
        UpdatedAt = o.UpdatedAt,
        FreightBillNumber = o.FreightBillNumber,
        ReasonForParking = o.ReasonForParking,
        Disposition = o.Disposition,
        Quote = o.Quote,
        PaymentType = o.PaymentType,
        CallerName = o.CallerName,
        CallerAddress = o.CallerAddress,
        CallerPhone = o.CallerPhone,
        CallerEmail = o.CallerEmail,
        CallerHours = o.CallerHours,
        ShipperName = o.ShipperName,
        ShipperAddress = o.ShipperAddress,
        ShipperPhone = o.ShipperPhone,
        ShipperEmail = o.ShipperEmail,
        ShipperHours = o.ShipperHours,
        ConsigneeName = o.ConsigneeName,
        ConsigneeAddress = o.ConsigneeAddress,
        ConsigneePhone = o.ConsigneePhone,
        ConsigneeEmail = o.ConsigneeEmail,
        ConsigneeHours = o.ConsigneeHours,
        BillToName = o.BillToName,
        BillToAddress = o.BillToAddress,
        BillToPhone = o.BillToPhone,
        BillToEmail = o.BillToEmail,
        BillToHours = o.BillToHours,
        PickupDate = o.PickupDate,
        PickupTime = o.PickupTime,
        PickupAddress = o.PickupAddress,
        PickupAddressType = o.PickupAddressType,
        PickupApptRequired = o.PickupApptRequired,
        PickupApptDate = o.PickupApptDate,
        PickupApptTime = o.PickupApptTime,
        PickupApptType = o.PickupApptType,
        DeliveryDate = o.DeliveryDate,
        DeliveryTime = o.DeliveryTime,
        DeliveryAddress = o.DeliveryAddress,
        DeliveryAddressType = o.DeliveryAddressType,
        DeliveryApptRequired = o.DeliveryApptRequired,
        DeliveryApptDate = o.DeliveryApptDate,
        DeliveryApptTime = o.DeliveryApptTime,
        DeliveryType = o.DeliveryType,
        DeliveryApptType = o.DeliveryApptType,
        Pieces = o.Pieces,
        PiecesUnit = o.PiecesUnit,
        Commodity = o.Commodity,
        DangerousGoods = o.DangerousGoods,
        HeatRequirement = o.HeatRequirement,
        Slc = o.Slc,
        Stc = o.Stc,
        Sks = o.Sks,
        WeightLbs = o.WeightLbs,
        LengthIn = o.LengthIn,
        WidthIn = o.WidthIn,
        HeightIn = o.HeightIn,
        PickupEquipmentType = o.PickupEquipmentType,
        PickupPtg = o.PickupPtg,
        PickupInside = o.PickupInside,
        PickupDock = o.PickupDock,
        PickupPalletJack = o.PickupPalletJack,
        DeliveryEquipmentType = o.DeliveryEquipmentType,
        DeliveryPtg = o.DeliveryPtg,
        DeliveryInside = o.DeliveryInside,
        DeliveryDock = o.DeliveryDock,
        DeliveryPalletJack = o.DeliveryPalletJack,
        TraceType = o.TraceType,
        PickupNumbers = o.PickupNumbers,
        Ccn = o.Ccn,
        Po = o.Po,
        Rad = o.Rad,
        ServiceLevel = o.ServiceLevel,
        FbNotes = o.FbNotes,
        ShippingInstructions = o.ShippingInstructions
    };

    /// <summary>Copies editable fields from a DTO onto an entity (server-managed fields excluded).</summary>
    public static void ApplyTo(this OrderDto d, Order o)
    {
        o.Quote = d.Quote;
        o.PaymentType = d.PaymentType;
        o.CallerName = d.CallerName;
        o.CallerAddress = d.CallerAddress;
        o.CallerPhone = d.CallerPhone;
        o.CallerEmail = d.CallerEmail;
        o.CallerHours = d.CallerHours;
        o.ShipperName = d.ShipperName;
        o.ShipperAddress = d.ShipperAddress;
        o.ShipperPhone = d.ShipperPhone;
        o.ShipperEmail = d.ShipperEmail;
        o.ShipperHours = d.ShipperHours;
        o.ConsigneeName = d.ConsigneeName;
        o.ConsigneeAddress = d.ConsigneeAddress;
        o.ConsigneePhone = d.ConsigneePhone;
        o.ConsigneeEmail = d.ConsigneeEmail;
        o.ConsigneeHours = d.ConsigneeHours;
        o.BillToName = d.BillToName;
        o.BillToAddress = d.BillToAddress;
        o.BillToPhone = d.BillToPhone;
        o.BillToEmail = d.BillToEmail;
        o.BillToHours = d.BillToHours;
        o.PickupDate = d.PickupDate;
        o.PickupTime = d.PickupTime;
        o.PickupAddress = d.PickupAddress;
        o.PickupAddressType = d.PickupAddressType;
        o.PickupApptRequired = d.PickupApptRequired;
        o.PickupApptDate = d.PickupApptDate;
        o.PickupApptTime = d.PickupApptTime;
        o.PickupApptType = d.PickupApptType;
        o.DeliveryDate = d.DeliveryDate;
        o.DeliveryTime = d.DeliveryTime;
        o.DeliveryAddress = d.DeliveryAddress;
        o.DeliveryAddressType = d.DeliveryAddressType;
        o.DeliveryApptRequired = d.DeliveryApptRequired;
        o.DeliveryApptDate = d.DeliveryApptDate;
        o.DeliveryApptTime = d.DeliveryApptTime;
        o.DeliveryType = d.DeliveryType;
        o.DeliveryApptType = d.DeliveryApptType;
        o.Pieces = d.Pieces;
        o.PiecesUnit = d.PiecesUnit;
        o.Commodity = d.Commodity;
        o.DangerousGoods = d.DangerousGoods;
        o.HeatRequirement = d.HeatRequirement;
        o.Slc = d.Slc;
        o.Stc = d.Stc;
        o.Sks = d.Sks;
        o.WeightLbs = d.WeightLbs;
        o.LengthIn = d.LengthIn;
        o.WidthIn = d.WidthIn;
        o.HeightIn = d.HeightIn;
        o.PickupEquipmentType = d.PickupEquipmentType;
        o.PickupPtg = d.PickupPtg;
        o.PickupInside = d.PickupInside;
        o.PickupDock = d.PickupDock;
        o.PickupPalletJack = d.PickupPalletJack;
        o.DeliveryEquipmentType = d.DeliveryEquipmentType;
        o.DeliveryPtg = d.DeliveryPtg;
        o.DeliveryInside = d.DeliveryInside;
        o.DeliveryDock = d.DeliveryDock;
        o.DeliveryPalletJack = d.DeliveryPalletJack;
        o.TraceType = d.TraceType;
        o.PickupNumbers = d.PickupNumbers;
        o.Ccn = d.Ccn;
        o.Po = d.Po;
        o.Rad = d.Rad;
        o.ServiceLevel = d.ServiceLevel;
        o.FbNotes = d.FbNotes;
        o.ShippingInstructions = d.ShippingInstructions;
    }
}
