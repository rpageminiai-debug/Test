import { useMemo, useState } from "react";
import type { Order, OrderField, ReferenceData } from "../types/order";
import { Field } from "./Field";
import { FormSection } from "./FormSection";
import { isFieldRequired } from "../config/fieldConfig";
import { validateOrder, labelFor } from "../validation/validateOrder";
import { api, ApiValidationError } from "../api/client";

interface Props {
  referenceData: ReferenceData;
  onSaved: (order: Order, message: string) => void;
}

type Errors = Partial<Record<OrderField, string>>;

export function OrderForm({ referenceData, onSaved }: Props) {
  const [order, setOrder] = useState<Order>({});
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const lists = referenceData.lists;

  const setField = (field: OrderField, value: string) => {
    setOrder(prev => ({ ...prev, [field]: value }));
    // Clear a field error as soon as the user edits it.
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Bound <Field/> factory so each call stays terse and consistent.
  const f = (
    field: OrderField,
    type: "text" | "date" | "time" | "number" | "email" | "textarea" | "select" = "text",
    options?: string[],
    placeholder?: string
  ) => {
    const common = {
      field,
      label: labelFor(field),
      value: (order[field] as string) ?? "",
      required: isFieldRequired(field, order),
      error: errors[field],
      onChange: setField,
      placeholder
    };
    if (type === "select") return <Field {...common} type="select" options={options ?? []} />;
    if (type === "textarea") return <Field {...common} type="textarea" />;
    return <Field {...common} type={type} />;
  };

  const errorCount = useMemo(
    () => Object.values(errors).filter(Boolean).length,
    [errors]
  );

  const handleSubmit = async () => {
    const found = validateOrder(order);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setBanner(`Please complete ${Object.keys(found).length} required field(s) before submitting.`);
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const saved = await api.submitOrder(order);
      onSaved(saved, `Order submitted — Freight Bill ${saved.freightBillNumber}.`);
      setOrder({});
      setErrors({});
    } catch (e) {
      handleApiError(e);
    } finally {
      setBusy(false);
    }
  };

  const handlePark = async () => {
    const reason = window.prompt("Reason for parking this order (optional):") ?? undefined;
    setBusy(true);
    setBanner(null);
    try {
      // Parking intentionally bypasses required-field validation.
      const saved = await api.parkOrder(order, reason);
      onSaved(saved, "Order parked. You can resume it from the Parked Orders tab.");
      setOrder({});
      setErrors({});
    } catch (e) {
      handleApiError(e);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Clear all fields on this form?")) {
      setOrder({});
      setErrors({});
      setBanner(null);
    }
  };

  const handleApiError = (e: unknown) => {
    if (e instanceof ApiValidationError) {
      const mapped: Errors = {};
      for (const err of e.response.errors) mapped[err.field as OrderField] = err.message;
      setErrors(mapped);
      setBanner(e.response.message);
    } else {
      setBanner(e instanceof Error ? e.message : "Unexpected error.");
    }
  };

  return (
    <div className="order-form">
      <div className="order-form__toolbar">
        <h1>LTL Order Management — Single New FB</h1>
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={handleReset} disabled={busy}>
            Reset
          </button>
          <button type="button" className="btn btn--secondary" onClick={handlePark} disabled={busy}>
            Park Order
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSubmit} disabled={busy}>
            {busy ? "Working…" : "Submit Order"}
          </button>
        </div>
      </div>

      {banner && (
        <div className={`banner ${errorCount ? "banner--error" : "banner--info"}`} role="status">
          {banner}
        </div>
      )}

      <p className="legend">
        Fields marked <span className="req">*</span> are required to submit. Required fields follow the
        original workbook rules; appointment date &amp; time become required only when the matching
        “Appt Required” is set to <strong>YES</strong>.
      </p>

      <FormSection title="Header">
        {f("quote", "text", undefined, "Optional quote #")}
        {f("paymentType", "select", lists.PaymentType)}
      </FormSection>

      <FormSection title="Caller">
        {f("callerName")}
        {f("callerAddress")}
        {f("callerPhone")}
        {f("callerEmail", "email")}
        {f("callerHours", "text", undefined, "e.g. 08:00–17:00")}
      </FormSection>

      <FormSection title="Shipper">
        {f("shipperName")}
        {f("shipperAddress")}
        {f("shipperPhone")}
        {f("shipperEmail", "email")}
        {f("shipperHours")}
      </FormSection>

      <FormSection title="Consignee">
        {f("consigneeName")}
        {f("consigneeAddress")}
        {f("consigneePhone")}
        {f("consigneeEmail", "email")}
        {f("consigneeHours")}
      </FormSection>

      <FormSection title="Bill To" subtitle="Optional — leave blank to bill the caller.">
        {f("billToName")}
        {f("billToAddress")}
        {f("billToPhone")}
        {f("billToEmail", "email")}
        {f("billToHours")}
      </FormSection>

      <FormSection title="Pickup">
        {f("pickupDate", "date")}
        {f("pickupTime", "time")}
        {f("pickupAddress")}
        {f("pickupAddressType", "select", lists.AddressType)}
        {f("pickupApptRequired", "select", lists.YesNo)}
        {f("pickupApptDate", "date")}
        {f("pickupApptTime", "time")}
        {f("pickupApptType", "select", lists.AppointmentType)}
      </FormSection>

      <FormSection title="Delivery">
        {f("deliveryDate", "date")}
        {f("deliveryTime", "time")}
        {f("deliveryAddress")}
        {f("deliveryAddressType", "select", lists.AddressType)}
        {f("deliveryApptRequired", "select", lists.YesNo)}
        {f("deliveryApptDate", "date")}
        {f("deliveryApptTime", "time")}
        {f("deliveryType", "select", lists.DeliveryType)}
        {f("deliveryApptType", "select", lists.AppointmentType)}
      </FormSection>

      <FormSection title="Freight Description">
        {f("pieces", "number")}
        {f("piecesUnit", "select", lists.PiecesUnit)}
        {f("commodity")}
        {f("dangerousGoods", "select", lists.YesNo)}
        {f("heatRequirement", "select", lists.YesNo)}
        {f("slc", "select", lists.YesNo)}
        {f("stc")}
        {f("sks")}
        {f("weightLbs", "number")}
        {f("lengthIn", "number")}
        {f("widthIn", "number")}
        {f("heightIn", "number")}
      </FormSection>

      <FormSection title="Requested Equipment — Pickup">
        {f("pickupEquipmentType")}
        {f("pickupPtg", "select", lists.YesNo)}
        {f("pickupInside", "select", lists.YesNo)}
        {f("pickupDock", "select", lists.YesNo)}
        {f("pickupPalletJack", "select", lists.YesNo)}
      </FormSection>

      <FormSection title="Requested Equipment — Delivery">
        {f("deliveryEquipmentType")}
        {f("deliveryPtg", "select", lists.YesNo)}
        {f("deliveryInside", "select", lists.YesNo)}
        {f("deliveryDock", "select", lists.YesNo)}
        {f("deliveryPalletJack", "select", lists.YesNo)}
      </FormSection>

      <FormSection title="Reference Numbers">
        {f("traceType")}
        {f("pickupNumbers")}
        {f("ccn")}
        {f("po")}
        {f("rad", "date")}
        {f("serviceLevel", "select", lists.ServiceLevel)}
      </FormSection>

      <FormSection title="Notes & Instructions">
        {f("fbNotes", "textarea")}
        {f("shippingInstructions", "textarea")}
      </FormSection>
    </div>
  );
}
