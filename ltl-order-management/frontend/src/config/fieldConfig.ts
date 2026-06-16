import type { Order, OrderField } from "../types/order";

// Mirrors the workbook "Config" sheet: which fields are required, and the two
// conditional rules where appointment date/time are required only when the
// matching "Appt Required" field is "Yes". The backend enforces the same rules.

export const REQUIRED_FIELDS: OrderField[] = [
  "paymentType",
  "callerName", "callerAddress", "callerPhone", "callerEmail", "callerHours",
  "shipperName", "shipperAddress", "shipperPhone", "shipperEmail", "shipperHours",
  "consigneeName", "consigneeAddress", "consigneePhone", "consigneeEmail", "consigneeHours",
  "pickupDate", "pickupTime", "pickupAddress", "pickupAddressType", "pickupApptRequired", "pickupApptType",
  "deliveryDate", "deliveryTime", "deliveryAddress", "deliveryAddressType", "deliveryApptRequired",
  "deliveryType", "deliveryApptType",
  "pieces", "piecesUnit", "commodity", "dangerousGoods", "heatRequirement",
  "slc", "stc", "sks", "weightLbs", "lengthIn", "widthIn", "heightIn",
  "pickupEquipmentType", "pickupPtg", "pickupInside", "pickupDock", "pickupPalletJack",
  "deliveryEquipmentType", "deliveryPtg", "deliveryInside", "deliveryDock", "deliveryPalletJack",
  "traceType", "pickupNumbers", "ccn", "po", "rad", "serviceLevel",
  "fbNotes", "shippingInstructions"
];

// Conditionally required fields: predicate -> required.
export const CONDITIONAL_REQUIRED: Array<{ field: OrderField; when: (o: Order) => boolean }> = [
  { field: "pickupApptDate", when: o => isYes(o.pickupApptRequired) },
  { field: "pickupApptTime", when: o => isYes(o.pickupApptRequired) },
  { field: "deliveryApptDate", when: o => isYes(o.deliveryApptRequired) },
  { field: "deliveryApptTime", when: o => isYes(o.deliveryApptRequired) }
];

export function isYes(v?: string): boolean {
  return (v ?? "").trim().toLowerCase() === "yes";
}

export function isFieldRequired(field: OrderField, order: Order): boolean {
  if (REQUIRED_FIELDS.includes(field)) return true;
  const rule = CONDITIONAL_REQUIRED.find(r => r.field === field);
  return rule ? rule.when(order) : false;
}
