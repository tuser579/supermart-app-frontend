import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCheck, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as notificationApi from '../services/notificationApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { AppNotification } from '../../../shared/types/notification.types';
import { timeAgo } from '../../../shared/utils/formatters';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      // ignore
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
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
          <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary, marginBottom: 8 }]} />}
            <TouchableOpacity 
              onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }}
              style={{ padding: 4 }}
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
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <CheckCheck size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Loader fullscreen />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
});
