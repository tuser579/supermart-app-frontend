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
  try {
    return await del<{ message: string }>(`/notifications/${id}`);
  } catch (e) {
    try {
      return await del<{ message: string }>(`/notifications/delete/${id}`);
    } catch (err) {
      return { message: 'Deleted' };
    }
  }
}

export async function clearAllNotifications(ids?: string[]): Promise<{ message: string }> {
  if (ids && ids.length > 0) {
    await Promise.allSettled(ids.map((id) => deleteNotification(id)));
  }
  try {
    await del<{ message: string }>('/notifications');
  } catch (e) {
    try {
      await del<{ message: string }>('/notifications/clear-all');
    } catch (err) {}
  }
  return { message: 'Cleared' };
}
