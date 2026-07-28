import { get, getFull, post, put, ApiResponse } from '../../../shared/api/apiClient';
import { Order, CreateOrderPayload, OrderPagination } from '../../../shared/types/order.types';

export async function fetchOrders(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Order[]; meta: OrderPagination }> {
  const response = await getFull<any>(`/orders`, params as Record<string, unknown>);
  const rawData = response.data;
  const ordersList: Order[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.orders)
    ? rawData.orders
    : [];

  const page = rawData?.page || 1;
  const limit = rawData?.limit || 20;
  const total = rawData?.total || ordersList.length;

  return {
    data: ordersList,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    } as unknown as OrderPagination,
  };
}

export async function fetchOrderById(id: string): Promise<Order> {
  return get<Order>(`/orders/${id}`);
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return post<Order>('/orders', payload as unknown as Record<string, unknown>);
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  return post<Order>(`/orders/${id}/cancel`, { reason });
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  return put<Order>(`/orders/${id}/status`, { status });
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
