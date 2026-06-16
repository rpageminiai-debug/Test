using System.Reflection;
using LtlOrderManagement.Api.Dtos;

namespace LtlOrderManagement.Api.Validation;

/// <summary>
/// Server-side validation that mirrors the "Config" sheet of the source workbook:
/// a set of always-required fields plus conditional rules where appointment date/time
/// become required only when the matching "Appt Required" field equals "Yes".
///
/// The same rule set is duplicated in the SPA (validation/validateOrder.ts). The client
/// copy gives instant feedback; this copy is the authority and runs on every submit/park.
/// </summary>
public static class OrderValidator
{
    private record Rule(string Field, string Label, Func<OrderDto, bool>? RequiredWhen = null);

    // Always-required fields (Config: Required = TRUE, no condition formula).
    private static readonly Rule[] Rules =
    {
        new("PaymentType", "Payment Type"),

        new("CallerName", "Caller Name"),
        new("CallerAddress", "Caller Address"),
        new("CallerPhone", "Caller Phone"),
        new("CallerEmail", "Caller Email"),
        new("CallerHours", "Caller Hours"),

        new("ShipperName", "Shipper Name"),
        new("ShipperAddress", "Shipper Address"),
        new("ShipperPhone", "Shipper Phone"),
        new("ShipperEmail", "Shipper Email"),
        new("ShipperHours", "Shipper Hours"),

        new("ConsigneeName", "Consignee Name"),
        new("ConsigneeAddress", "Consignee Address"),
        new("ConsigneePhone", "Consignee Phone"),
        new("ConsigneeEmail", "Consignee Email"),
        new("ConsigneeHours", "Consignee Hours"),

        new("PickupDate", "Pickup Date"),
        new("PickupTime", "Pickup Time"),
        new("PickupAddress", "Pickup Address"),
        new("PickupAddressType", "Pickup Address Type"),
        new("PickupApptRequired", "Pickup Appt Required"),
        // Conditional: required only when Pickup Appt Required = "Yes" (Config: Form!I12="Yes").
        new("PickupApptDate", "Pickup Appt Date", o => IsYes(o.PickupApptRequired)),
        new("PickupApptTime", "Pickup Appt Time", o => IsYes(o.PickupApptRequired)),
        new("PickupApptType", "Pickup Appt Type"),

        new("DeliveryDate", "Delivery Date"),
        new("DeliveryTime", "Delivery Time"),
        new("DeliveryAddress", "Delivery Address"),
        new("DeliveryAddressType", "Delivery Address Type"),
        new("DeliveryApptRequired", "Delivery Appt Required"),
        // Conditional: required only when Delivery Appt Required = "Yes" (Config: Form!I22="Yes").
        new("DeliveryApptDate", "Delivery Appt Date", o => IsYes(o.DeliveryApptRequired)),
        new("DeliveryApptTime", "Delivery Appt Time", o => IsYes(o.DeliveryApptRequired)),
        new("DeliveryType", "Delivery Type"),
        new("DeliveryApptType", "Delivery Appt Type"),

        new("Pieces", "Pieces"),
        new("PiecesUnit", "Pieces Unit"),
        new("Commodity", "Commodity"),
        new("DangerousGoods", "Dangerous goods"),
        new("HeatRequirement", "Heat Requirement"),
        new("Slc", "SLC"),
        new("Stc", "STC"),
        new("Sks", "SKS"),
        new("WeightLbs", "Weight (lbs)"),
        new("LengthIn", "Length (in)"),
        new("WidthIn", "Width (in)"),
        new("HeightIn", "Height (in)"),

        new("PickupEquipmentType", "Pickup Equipment Type"),
        new("PickupPtg", "Pickup PTG"),
        new("PickupInside", "Pickup Inside"),
        new("PickupDock", "Pickup Dock"),
        new("PickupPalletJack", "Pickup Pallet jack"),

        new("DeliveryEquipmentType", "Delivery Equipment Type"),
        new("DeliveryPtg", "Delivery PTG"),
        new("DeliveryInside", "Delivery Inside"),
        new("DeliveryDock", "Delivery Dock"),
        new("DeliveryPalletJack", "Delivery Pallet jack"),

        new("TraceType", "Trace Type"),
        new("PickupNumbers", "Pick-up numbers"),
        new("Ccn", "Cargo control (CCN)"),
        new("Po", "Purchase Order (PO)"),
        new("Rad", "Required Arrival Date (RAD)"),
        new("ServiceLevel", "Service Level"),

        new("FbNotes", "FB Notes"),
        new("ShippingInstructions", "Shipping Instructions"),
        // Note: Quote and all Bill To fields are optional in the source workbook (Required = FALSE).
    };

    private static bool IsYes(string? v) => string.Equals(v?.Trim(), "Yes", StringComparison.OrdinalIgnoreCase);

    public static List<FieldError> Validate(OrderDto order)
    {
        var errors = new List<FieldError>();
        foreach (var rule in Rules)
        {
            var required = rule.RequiredWhen?.Invoke(order) ?? true;
            if (!required) continue;

            var prop = typeof(OrderDto).GetProperty(rule.Field, BindingFlags.Public | BindingFlags.Instance);
            var value = prop?.GetValue(order) as string;
            if (string.IsNullOrWhiteSpace(value))
            {
                errors.Add(new FieldError
                {
                    Field = char.ToLowerInvariant(rule.Field[0]) + rule.Field[1..],
                    Label = rule.Label,
                    Message = $"{rule.Label} is required."
                });
            }
        }
        return errors;
    }
}
