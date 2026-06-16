namespace LtlOrderManagement.Api.Data;

/// <summary>
/// Drop-down option lists, transcribed from the "Lists" sheet of the source workbook.
/// Exposed via the reference-data endpoint so the SPA and any other client share one source.
/// </summary>
public static class ReferenceData
{
    public static readonly Dictionary<string, string[]> Lists = new()
    {
        ["AddressType"] = new[] { "RESIDENTIAL", "DOCK", "MALL", "JOB SITES", "NOT KNOWN" },
        ["YesNo"] = new[] { "YES", "NO" },
        ["AppointmentType"] = new[] { "WINDOW", "HARD", "FINABLE" },
        ["PiecesUnit"] = new[] { "PIECES", "PALLET", "CARTONS", "CRATES", "BUNDLES", "OTHER" },
        ["PaymentType"] = new[] { "PRE-PAID", "COLLECT", "THIRD PARTY" },
        ["DeliveryType"] = new[] { "SINGLE", "MULTIPLE", "DE-STUFF", "PEDDLE" },
        ["ServiceLevel"] = new[] { "DROP AT DOCK", "HOLD AT DOCK", "HOT FREIGHT", "REGULAR", "SAME DAY" },
        ["BillTo"] = new[] { "CALLER", "SHIPPER", "CONSIGNEE", "OTHERS" },
        ["CcPaymentStatus"] = new[] { "DO NOT SHIP-AWAITING PAYMENT", "PYMNT RCVD-CC" },
        ["Disposition"] = new[] { "ORDER SUBMITTED", "ORDER PARKED", "ORDER UPDATED" },
        ["ReasonIfMissing"] = new[] { "INFO MISSING FROM CUSTOMER", "NOT APPLICABLE" }
    };
}
