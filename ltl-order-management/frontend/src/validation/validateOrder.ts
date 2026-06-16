import type { Order, OrderField } from "../types/order";
import { REQUIRED_FIELDS, CONDITIONAL_REQUIRED } from "../config/fieldConfig";

export const FIELD_LABELS: Partial<Record<OrderField, string>> = {
  quote: "Quote",
  paymentType: "Payment Type",
  billToName: "Bill To Name", billToAddress: "Bill To Address", billToPhone: "Bill To Phone",
  billToEmail: "Bill To Email", billToHours: "Bill To Hours",
  callerName: "Caller Name", callerAddress: "Caller Address", callerPhone: "Caller Phone",
  callerEmail: "Caller Email", callerHours: "Caller Hours",
  shipperName: "Shipper Name", shipperAddress: "Shipper Address", shipperPhone: "Shipper Phone",
  shipperEmail: "Shipper Email", shipperHours: "Shipper Hours",
  consigneeName: "Consignee Name", consigneeAddress: "Consignee Address", consigneePhone: "Consignee Phone",
  consigneeEmail: "Consignee Email", consigneeHours: "Consignee Hours",
  pickupDate: "Pickup Date", pickupTime: "Pickup Time", pickupAddress: "Pickup Address",
  pickupAddressType: "Pickup Address Type", pickupApptRequired: "Pickup Appt Required",
  pickupApptDate: "Pickup Appt Date", pickupApptTime: "Pickup Appt Time", pickupApptType: "Pickup Appt Type",
  deliveryDate: "Delivery Date", deliveryTime: "Delivery Time", deliveryAddress: "Delivery Address",
  deliveryAddressType: "Delivery Address Type", deliveryApptRequired: "Delivery Appt Required",
  deliveryApptDate: "Delivery Appt Date", deliveryApptTime: "Delivery Appt Time",
  deliveryType: "Delivery Type", deliveryApptType: "Delivery Appt Type",
  pieces: "Pieces", piecesUnit: "Pieces Unit", commodity: "Commodity", dangerousGoods: "Dangerous goods",
  heatRequirement: "Heat Requirement", slc: "SLC", stc: "STC", sks: "SKS",
  weightLbs: "Weight (lbs)", lengthIn: "Length (in)", widthIn: "Width (in)", heightIn: "Height (in)",
  pickupEquipmentType: "Pickup Equipment Type", pickupPtg: "Pickup PTG", pickupInside: "Pickup Inside",
  pickupDock: "Pickup Dock", pickupPalletJack: "Pickup Pallet jack",
  deliveryEquipmentType: "Delivery Equipment Type", deliveryPtg: "Delivery PTG",
  deliveryInside: "Delivery Inside", deliveryDock: "Delivery Dock", deliveryPalletJack: "Delivery Pallet jack",
  traceType: "Trace Type", pickupNumbers: "Pick-up numbers", ccn: "Cargo control (CCN)",
  po: "Purchase Order (PO)", rad: "Required Arrival Date (RAD)", serviceLevel: "Service Level",
  fbNotes: "FB Notes", shippingInstructions: "Shipping Instructions"
};

export function labelFor(field: OrderField): string {
  return FIELD_LABELS[field] ?? field;
}

/**
 * Returns a map of field -> error message for every required field that is empty.
 * Used to validate before "Submit" / "Update" (not for "Park").
 */
export function validateOrder(order: Order): Partial<Record<OrderField, string>> {
  const errors: Partial<Record<OrderField, string>> = {};

  const isEmpty = (f: OrderField) => {
    const v = order[f];
    return v === undefined || v === null || String(v).trim() === "";
  };

  for (const field of REQUIRED_FIELDS) {
    if (isEmpty(field)) errors[field] = `${labelFor(field)} is required.`;
  }
  for (const { field, when } of CONDITIONAL_REQUIRED) {
    if (when(order) && isEmpty(field)) errors[field] = `${labelFor(field)} is required.`;
  }
  return errors;
}
