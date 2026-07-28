export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'ACCEPTED'
  | 'COMPLETED';

export type PaymentMethod =
  | 'COD'
  | 'BKASH'
  | 'ROCKET'
  | 'NOGOD'
  | 'BANK_TRANSFER'
  | 'CARD';

export type PaymentStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  // Nested product from backend
  product?: {
    id: string;
    name: string;
    images: string[];
    price: number;
  };
  // Legacy flat fields (kept for compatibility)
  productName?: string;
  productImage?: string;
  subtotal?: number;
}

export interface Order {
  id: string;
  orderId?: string;         // backend friendly order ref like SM-ABC-XYZ
  orderNumber?: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  grandTotal?: number;      // frontend alias — use totalAmount if missing
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  deliveryAddress?: AddressOnOrder;
  user?: { id: string; name: string; email: string; phone: string };
  assignedStaff?: { user: { name: string; phone: string } } | null;
  deliveredAt?: string;
  cancellationReason?: string;
  returnReason?: string;
  returnDetails?: string;
  returnImages?: string[];
  statusHistory?: { status: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface AddressOnOrder {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area: string;
  postalCode?: string;
}

export interface CreateOrderPayload {
  deliveryAddressId?: string;
  deliveryAddress?: AddressOnOrder;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  items?: Array<{ productId: string; quantity: number }>;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  BKASH: 'bKash',
  ROCKET: 'Rocket',
  NOGOD: 'Nagad',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card (Visa/MC)',
};
