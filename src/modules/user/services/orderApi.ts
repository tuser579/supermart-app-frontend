import { get, getFull, post, put, ApiResponse } from '../../../shared/api/apiClient';
import { Order, CreateOrderPayload, OrderPagination } from '../../../shared/types/order.types';

export async function fetchOrders(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Order[]; meta: OrderPagination }> {
  const response = await getFull<any>(`/orders`, params as Record<string, unknown>);
  const rawData = response.data;

  // Handle standard paginated response: { data: Order[], meta: { page, limit, total, totalPages, hasNext, hasPrev } }
  let ordersList: Order[] = [];
  let metaRaw: any = {};

  if (rawData && Array.isArray(rawData.data)) {
    // Standard format: { data: [], meta: {} }
    ordersList = rawData.data;
    metaRaw = rawData.meta || {};
  } else if (Array.isArray(rawData)) {
    ordersList = rawData;
  } else if (rawData && Array.isArray(rawData.orders)) {
    ordersList = rawData.orders;
    metaRaw = rawData;
  }

  const page = metaRaw.page || rawData?.page || 1;
  const limit = metaRaw.limit || rawData?.limit || 20;
  const total = metaRaw.total || rawData?.total || ordersList.length;
  const totalPages = metaRaw.totalPages || Math.ceil(total / limit);
  const hasNext = metaRaw.hasNext ?? (page * limit < total);
  const hasPrev = metaRaw.hasPrev ?? (page > 1);

  return {
    data: ordersList,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    } as OrderPagination,
  };
}

export async function fetchOrderById(id: string): Promise<Order> {
  return get<Order>(`/orders/${id}`);
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return post<Order>('/orders', payload as unknown as Record<string, unknown>);
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  try {
    return await post<Order>(`/orders/${id}/cancel`, { reason });
  } catch (e) {
    return await put<Order>(`/orders/${id}/status`, { status: 'CANCELLED', paymentStatus: 'FAILED', cancellationReason: reason });
  }
}

export async function updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
  return put<Order>(`/orders/${id}/status`, { status, notes });
}

export async function acceptOrder(id: string): Promise<Order> {
  return post<Order>(`/orders/${id}/accept`, {});
}

export async function payOrder(id: string, paymentMethod?: string, transactionId?: string): Promise<Order> {
  return post<Order>(`/orders/${id}/pay`, { paymentMethod, transactionId });
}

export async function returnOrder(
  id: string,
  payload: { reason: string; details?: string; images?: string[] }
): Promise<Order> {
  return post<Order>(`/orders/${id}/return`, payload as unknown as Record<string, unknown>);
}
