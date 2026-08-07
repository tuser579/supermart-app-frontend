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

// Backend returns paginated assigned orders list: { data: Order[], meta: { ... } } or Order[]
export async function fetchAssignedOrders(params?: { status?: string; page?: number; limit?: number }): Promise<Order[]> {
  try {
    const res = await get<any>(
      '/staff/orders',
      params as Record<string, unknown>
    );
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.data)) {
      return res.data;
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

// POST /orders/:id/pay { paymentMethod: 'COD', transactionId: ... }
// Automatically sets paymentStatus = COMPLETED, status = COMPLETED, updates staff earnings (+1 delivery count)
export async function recordCashPayment(orderId: string, transactionId?: string): Promise<Order> {
  const payload = {
    paymentMethod: 'COD',
    transactionId: transactionId || `CASH-REC-STAFF-${Date.now()}`
  };
  return post<Order>(`/orders/${orderId}/pay`, payload);
}

export const recordCashAndComplete = recordCashPayment;

// UI Condition helper to show "Record and Completed" button in Staff App
export const canShowRecordAndCompletedButton = (order: {
  status: string;
  paymentMethod: string;
  paymentStatus: string;
}) => {
  if (!order) return false;
  const status = (order.status || '').toUpperCase();
  const paymentMethod = (order.paymentMethod || 'COD').toUpperCase();
  const paymentStatus = (order.paymentStatus || '').toUpperCase();

  return (
    status === 'DELIVERED' &&
    (paymentMethod === 'COD' || paymentMethod === 'CASH') &&
    paymentStatus === 'PAID'
  );
};

// PATCH /staff/availability { isAvailable }
export async function updateAvailability(isAvailable: boolean): Promise<StaffProfile> {
  return patch<StaffProfile>('/staff/availability', { isAvailable });
}

// Backend IMarkAttendanceDTO: { checkIn?, checkOut?, status? }
export async function markAttendance(type: 'checkIn' | 'checkOut'): Promise<Attendance> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const existingList = await fetchAttendance().catch(() => []);
  const todayRecord = existingList.find((a) => {
    if (!a || !a.date) return false;
    const dStr = String(a.date).slice(0, 10);
    return dStr === todayStr || String(a.date).startsWith(todayStr);
  });

  if (type === 'checkIn' && todayRecord?.checkIn) {
    // Already checked in today — DO NOT update checkIn timestamp!
    return todayRecord;
  }

  if (type === 'checkOut' && todayRecord?.checkOut) {
    // Already checked out today — DO NOT update checkOut timestamp!
    return todayRecord;
  }

  const now = new Date().toISOString();
  const body = type === 'checkIn' ? { checkIn: now, status: 'PRESENT' } : { checkOut: now };
  const res = await post<Attendance>('/staff/attendance', body);

  // Automatically update staff availability: Check-In -> true, Check-Out -> false
  try {
    await updateAvailability(type === 'checkIn');
  } catch (e) {
    // ignore
  }

  return res;
}

// GET /staff/attendance — returns Attendance[]
// Note: get() already unwraps ApiResponse.data, so res IS the array directly
export async function fetchAttendance(): Promise<Attendance[]> {
  const res = await get<any>('/staff/attendance');
  // Handle if backend wraps in array or returns array directly
  if (Array.isArray(res)) return res;
  return [];
}

// GET /staff/earnings — returns { earnings, totalDeliveries, rating, salary, deliveredOrders }
// Note: get() already unwraps ApiResponse.data, so res IS the earnings object directly
export async function fetchEarnings(): Promise<Earnings> {
  return get<Earnings>('/staff/earnings');
}
