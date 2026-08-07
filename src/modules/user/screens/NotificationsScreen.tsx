import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as notificationApi from '../services/notificationApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { AppNotification } from '../../../shared/types/notification.types';
import { timeAgo } from '../../../shared/utils/formatters';
import { showToast } from '../../common/Toast';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, containerPadding } = useResponsiveLayout();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await notificationApi.fetchNotifications();
      setNotifications(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await load();
    } catch (e) {
      // ignore
    }
  };

  // Modal states
  const [notificationToDelete, setNotificationToDelete] = useState<AppNotification | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteOne = async () => {
    if (!notificationToDelete) return;
    const targetId = notificationToDelete.id;
    setIsDeleting(true);
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== targetId));
      setNotificationToDelete(null);

      await notificationApi.deleteNotification(targetId);
      showToast('info', 'Notification Deleted', 'Notification removed successfully.');
    } catch (e) {
      showToast('error', 'Error', 'Failed to delete notification.');
      await load();
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAll = async () => {
    if (notifications.length === 0) return;
    setIsDeleting(true);
    try {
      const currentIds = notifications.map((n) => n.id);
      setNotifications([]);
      setIsClearAllModalOpen(false);

      await notificationApi.clearAllNotifications(currentIds);
      showToast('info', 'Notifications Cleared', 'All notifications cleared successfully.');
    } catch (e) {
      showToast('error', 'Error', 'Failed to clear notifications.');
      await load();
    } finally {
      setIsDeleting(false);
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={async () => {
        if (!item.isRead) {
          try {
            await notificationApi.markNotificationRead(item.id);
            setNotifications((prev) =>
              prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
            );
          } catch (e) {}
        }
      }}
    >
      <Card
        padding="md"
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.isRead ? colors.card : colors.primaryLight,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.notificationRow}>
          <View style={[styles.icon, { backgroundColor: item.isRead ? colors.inputBg : colors.primary }]}>
            <Bell size={18} color={item.isRead ? colors.textSecondary : '#FFFFFF'} />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
          </View>
          <View style={styles.rightActions}>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            <TouchableOpacity 
              onPress={(e) => { e.stopPropagation(); setNotificationToDelete(item); }}
              style={styles.deleteBtn}
              accessibilityLabel="Delete notification"
            >
              <Trash2 size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: Math.max((insets?.top || 0), spacing.md) }]}>
        <View style={[styles.headerRow, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={[styles.backBtn, { backgroundColor: colors.inputBg }]}
                accessibilityLabel="Mark all as read"
              >
                <CheckCheck size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: containerPadding, paddingTop: spacing.md, paddingBottom: 4 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
            {notifications.length} Notification{notifications.length > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => setIsClearAllModalOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.error + '15',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
            }}
          >
            <Trash2 size={14} color={colors.error} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <Loader fullscreen />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingHorizontal: containerPadding, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={48} color={colors.textTertiary} />}
              title="No notifications"
              subtitle="You're all caught up!"
            />
          }
        />
      )}
      {/* Delete Single Notification Modal */}
      <Modal
        visible={!!notificationToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Notification</Text>
              <TouchableOpacity onPress={() => setNotificationToDelete(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to delete this notification?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setNotificationToDelete(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.inputBg,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteOne}
                disabled={isDeleting}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Notifications Modal */}
      <Modal
        visible={isClearAllModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClearAllModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Clear All Notifications</Text>
              <TouchableOpacity onPress={() => setIsClearAllModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to clear all {notifications.length} notification{notifications.length > 1 ? 's' : ''}? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setIsClearAllModalOpen(false)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.inputBg,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmClearAll}
                disabled={isDeleting}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isDeleting ? 'Clearing...' : 'Clear All'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h4 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  notificationCard: {
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationInfo: { flex: 1 },
  notificationTitle: { ...typography.label, marginBottom: 4 },
  notificationMessage: { ...typography.bodySmall, marginBottom: 4 },
  notificationTime: { ...typography.caption },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  deleteBtn: {
    padding: 4,
    marginTop: 8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    ...typography.h4,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...typography.bodySmall,
  },
  closeBtn: {
    padding: 4,
  },
});
