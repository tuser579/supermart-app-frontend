import { get, put, del } from '../../../shared/api/apiClient';
import { AppNotification } from '../../../shared/types/notification.types';

export async function fetchNotifications(): Promise<AppNotification[]> {
  return get<AppNotification[]>('/notifications');
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return put<{ message: string }>('/notifications/read-all');
}

export async function markNotificationRead(id: string): Promise<{ message: string }> {
  return put<{ message: string }>(`/notifications/${id}/read`);
}

export async function deleteNotification(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/notifications/${id}`);
}
