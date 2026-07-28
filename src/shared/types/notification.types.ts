export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}
