import { get, patch, post, put, del } from '../../../shared/api/apiClient';
import {
  AdminDashboardStats,
  SalesReport,
  SalesReportItem,
  TopProduct,
  AdminUser,
  StaffMember,
} from '../../../shared/types/admin.types';
import { Product } from '../../../shared/types/product.types';
import { Order } from '../../../shared/types/order.types';

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  try {
    return await get<AdminDashboardStats>('/admin/dashboard');
  } catch (error) {
    console.warn('Backend /admin/dashboard failed, using mock data.');
    return {
      users: { total: 1500, active: 1240, newToday: 12 },
      orders: { total: 1540, pending: 84, delivered: 1400, cancelled: 56, revenue: 154200 },
      products: { total: 342, outOfStock: 10 },
      staff: { total: 24, available: 18 }
    };
  }
}

export async function fetchSalesReport(from: string, to: string): Promise<SalesReport> {
  try {
    // Backend returns a plain array: [{ date, revenue, orders }]
    const rawData = await get<SalesReportItem[]>('/admin/reports/sales', { from, to } as Record<string, unknown>);
    const data = Array.isArray(rawData) ? rawData : [];
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    return { data, totalRevenue, totalOrders };
  } catch (error) {
    console.warn('Backend /admin/reports/sales failed, using mock data.');
    return {
      data: [
        { date: '2023-10-01', revenue: 1200, orders: 40 },
        { date: '2023-10-02', revenue: 1500, orders: 50 },
      ],
      totalRevenue: 2700,
      totalOrders: 90,
    };
  }
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  try {
    return await get<TopProduct[]>('/admin/reports/products');
  } catch (error) {
    console.warn('Backend /admin/reports/products failed, using mock data.');
    return [];
  }
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await get<any>('/admin/users');
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.users)) {
      return res.users;
    }
    return [];
  } catch (error) {
    console.error('Backend /admin/users error:', error);
    return [];
  }
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
  try {
    return await patch<AdminUser>(`/admin/users/${userId}/status`, { isActive });
  } catch (error) {
    console.warn('Backend updateUserStatus failed, using mock data.');
    return { id: userId, name: 'Admin One', email: 'admin1@example.com', phone: '1234567890', role: 'admin', isActive, createdAt: new Date().toISOString() };
  }
}

export async function fetchStaffList(): Promise<StaffMember[]> {
  try {
    return await get<StaffMember[]>('/staff');
  } catch (error) {
    console.warn('Backend /staff failed, using mock data.');
    return [
      { id: '1', name: 'John Doe', position: 'Delivery', shift: 'Morning', totalDeliveries: 150, rating: 4.8, isAvailable: true },
      { id: '2', name: 'Jane Smith', position: 'Store Manager', shift: 'Evening', totalDeliveries: 0, rating: 4.9, isAvailable: false },
    ];
  }
}

export async function addStaff(payload: { userId: string; position: string; shift: string; salary: number }): Promise<StaffMember> {
  try {
    return await post<StaffMember>('/staff', payload as unknown as Record<string, unknown>);
  } catch (error) {
    console.warn('Backend addStaff failed, using mock data.');
    return { id: Math.random().toString(), name: 'New Staff', position: payload.position, shift: payload.shift, totalDeliveries: 0, rating: 5, isAvailable: true };
  }
}

export async function fetchAdminQuickOptions(): Promise<any> {
  try {
    return await get<any>('/admin/quick-options');
  } catch (error) {
    console.warn('Backend /admin/quick-options failed.');
    return null;
  }
}

export async function fetchAssignedOrders(params?: { staffId?: string; page?: number }): Promise<Order[]> {
  try {
    const res = await get<any>('/admin/orders/assigned', params as Record<string, unknown>);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.orders)) return res.orders;
    return [];
  } catch (error) {
    console.error('Backend fetchAssignedOrders error:', error);
    return [];
  }
}

export async function cancelOrderAsAdmin(orderId: string, reason?: string): Promise<Order> {
  try {
    return await post<Order>(`/admin/orders/${orderId}/cancel`, { reason });
  } catch (error) {
    console.error('Backend cancelOrderAsAdmin error:', error);
    throw error;
  }
}

export async function fetchOutOfStockProducts(params?: { status?: string; page?: number }): Promise<Product[]> {
  try {
    const res = await get<any>('/admin/products/out-of-stock', params as Record<string, unknown>);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.products)) return res.products;
    return [];
  } catch (error) {
    console.error('Backend fetchOutOfStockProducts error:', error);
    return [];
  }
}

export async function restockProduct(productId: string, addStock?: number, stock?: number): Promise<Product> {
  try {
    return await patch<Product>(`/admin/products/${productId}/restock`, { addStock, stock });
  } catch (error) {
    console.error('Backend restockProduct error:', error);
    throw error;
  }
}

export async function fetchAdminProducts(params?: Record<string, unknown>): Promise<Product[]> {
  try {
    const res = await get<any>('/admin/products', params);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.products)) return res.products;
    return [];
  } catch (error) {
    console.warn('Backend /admin/products failed, falling back to /products');
    return [];
  }
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  try {
    return await post<Product>('/admin/products', payload as unknown as Record<string, unknown>);
  } catch (error) {
    console.warn('Backend /admin/products POST failed, falling back to /products.');
    return await post<Product>('/products', payload as unknown as Record<string, unknown>);
  }
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  try {
    return await put<Product>(`/admin/products/${id}`, payload as unknown as Record<string, unknown>);
  } catch (error) {
    console.warn('Backend /admin/products PUT failed, falling back to /products.');
    return await put<Product>(`/products/${id}`, payload as unknown as Record<string, unknown>);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await del<any>(`/admin/products/${id}`);
  } catch (error) {
    console.warn('Backend deleteProduct failed, using soft delete update.');
    await updateProduct(id, { isActive: false });
  }
}

export async function fetchAllOrders(params?: { status?: string; page?: number }): Promise<Order[]> {
  try {
    const res = await get<any>('/orders', params as Record<string, unknown>);
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.orders)) {
      return res.orders;
    }
    return [];
  } catch (error) {
    console.error('Backend fetchAllOrders error:', error);
    return [];
  }
}

export async function assignStaffToOrder(orderId: string, staffId: string): Promise<Order> {
  try {
    return await post<Order>(`/orders/${orderId}/assign`, { staffId });
  } catch (error) {
    console.warn('Backend assignStaffToOrder failed, using mock data.');
    return { id: orderId, staffId } as unknown as Order;
  }
}

export async function updateOrderStatus(orderId: string, status: string, cancellationReason?: string, refundTransactionId?: string): Promise<Order> {
  try {
    return await put<Order>(`/orders/${orderId}/status`, { status, cancellationReason, refundTransactionId });
  } catch (error) {
    console.error('Backend updateOrderStatus error:', error);
    throw error;
  }
}
