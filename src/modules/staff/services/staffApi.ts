import { get, patch, post, put } from '../../../shared/api/apiClient';
import { StaffProfile, Attendance, Earnings, StaffQuickOptions } from '../../../shared/types/staff.types';
import { Order } from '../../../shared/types/order.types';

// GET /staff/quick-options — action checking & dashboard summary
export async function fetchStaffQuickOptions(): Promise<StaffQuickOptions> {
  return get<StaffQuickOptions>('/staff/quick-options');
}

// Backend returns the full staff record with nested user object
export async function fetchStaffProfile(): Promise<StaffProfile> {
  return get<StaffProfile>('/staff/profile');
}

// Backend returns paginated: { orders, total, page, limit }
export async function fetchAssignedOrders(params?: { status?: string; page?: number }): Promise<Order[]> {
  try {
    const res = await get<any>(
      '/staff/orders',
      params as Record<string, unknown>
    );
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.orders)) {
      return res.orders;
    }
    return [];
  } catch {
    return [];
  }
}

// PUT /orders/:id/status { status }
export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  return put<Order>(`/orders/${orderId}/status`, { status });
}

// PATCH /staff/availability { isAvailable }
export async function updateAvailability(isAvailable: boolean): Promise<StaffProfile> {
  return patch<StaffProfile>('/staff/availability', { isAvailable });
}

// Backend IMarkAttendanceDTO: { checkIn?, checkOut?, status? }
// type = 'checkIn'  → send { checkIn: new Date().toISOString() }
// type = 'checkOut' → send { checkOut: new Date().toISOString() }
export async function markAttendance(type: 'checkIn' | 'checkOut'): Promise<Attendance> {
  const now = new Date().toISOString();
  const body = type === 'checkIn' ? { checkIn: now } : { checkOut: now };
  return post<Attendance>('/staff/attendance', body);
}

// GET /staff/attendance — returns Attendance[]
export async function fetchAttendance(): Promise<Attendance[]> {
  return get<Attendance[]>('/staff/attendance');
}

// GET /staff/earnings — returns { earnings, totalDeliveries, rating, salary, deliveredOrders }
export async function fetchEarnings(): Promise<Earnings> {
  return get<Earnings>('/staff/earnings');
}
