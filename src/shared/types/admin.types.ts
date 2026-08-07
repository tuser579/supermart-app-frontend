export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
  };
  orders: {
    total: number;
    pending: number;
    delivered: number;
    completed?: number;
    cancelled: number;
    revenue: number;
  };
  cashPayment?: {
    pendingCodAmount: number;
    collectedCodAmount: number;
    totalCodOrders: number;
  };
  products: {
    total: number;
    outOfStock: number;
  };
  staff: {
    total: number;
    available: number;
  };
}

export interface AdminQuickOptions {
  assignedOrdersOptions?: {
    totalAssignedOrders: number;
    unassignedPendingOrders: number;
    availableDeliveryStaff: number;
  };
  orderCancelOptions?: {
    cancellableOrdersCount: number;
    totalCancelledCount: number;
  };
  cashPaymentOptions?: {
    totalCodOrders: number;
    pendingCodOrders: number;
    pendingCodAmount: number;
    collectedCodAmount: number;
  };
  quickActions?: Array<{
    action: string;
    method: string;
    endpoint: string;
  }>;
}

// Backend returns a plain array of daily items — totalRevenue/totalOrders are computed client-side
export type SalesReportItem = {
  date: string;
  revenue: number;
  orders: number;
};

export interface SalesReport {
  data: SalesReportItem[];
  totalRevenue: number;
  totalOrders: number;
}

export interface TopProduct {
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    rating: number;
  };
  totalSold: number;
  totalOrders: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  position: string;
  shift: string;
  totalDeliveries: number;
  rating: number;
  isAvailable: boolean;
}
