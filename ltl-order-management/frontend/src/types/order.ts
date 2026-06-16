// Order shape exchanged with the API. Field names match the backend OrderDto
// (and ultimately the workbook "Database" sheet) one-to-one.

export interface Order {
  id?: number;
  status?: string;
  timestamp?: string;
  updatedAt?: string;
  freightBillNumber?: string;
  reasonForParking?: string;
  disposition?: string;

  quote?: string;
  paymentType?: string;

  callerName?: string;
  callerAddress?: string;
  callerPhone?: string;
  callerEmail?: string;
  callerHours?: string;

  shipperName?: string;
  shipperAddress?: string;
  shipperPhone?: string;
  shipperEmail?: string;
  shipperHours?: string;

  consigneeName?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consigneeEmail?: string;
  consigneeHours?: string;

  billToName?: string;
  billToAddress?: string;
  billToPhone?: string;
  billToEmail?: string;
  billToHours?: string;

  pickupDate?: string;
  pickupTime?: string;
  pickupAddress?: string;
  pickupAddressType?: string;
  pickupApptRequired?: string;
  pickupApptDate?: string;
  pickupApptTime?: string;
  pickupApptType?: string;

  deliveryDate?: string;
  deliveryTime?: string;
  deliveryAddress?: string;
  deliveryAddressType?: string;
  deliveryApptRequired?: string;
  deliveryApptDate?: string;
  deliveryApptTime?: string;
  deliveryType?: string;
  deliveryApptType?: string;

  pieces?: string;
  piecesUnit?: string;
  commodity?: string;
  dangerousGoods?: string;
  heatRequirement?: string;
  slc?: string;
  stc?: string;
  sks?: string;
  weightLbs?: string;
  lengthIn?: string;
  widthIn?: string;
  heightIn?: string;

  pickupEquipmentType?: string;
  pickupPtg?: string;
  pickupInside?: string;
  pickupDock?: string;
  pickupPalletJack?: string;

  deliveryEquipmentType?: string;
  deliveryPtg?: string;
  deliveryInside?: string;
  deliveryDock?: string;
  deliveryPalletJack?: string;

  traceType?: string;
  pickupNumbers?: string;
  ccn?: string;
  po?: string;
  rad?: string;
  serviceLevel?: string;

  fbNotes?: string;
  shippingInstructions?: string;
}

export type OrderField = keyof Order;

export interface OrderListItem {
  id: number;
  status: string;
  freightBillNumber?: string;
  timestamp: string;
  updatedAt?: string;
  shipperName?: string;
  consigneeName?: string;
  serviceLevel?: string;
  paymentType?: string;
  reasonForParking?: string;
}

export interface ReferenceData {
  lists: Record<string, string[]>;
}

export interface FieldError {
  field: string;
  label: string;
  message: string;
}

export interface ValidationErrorResponse {
  message: string;
  errors: FieldError[];
}
