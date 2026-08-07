import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Switch, Alert, Image, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Users, Shield, Search, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { AdminUser } from '../../../shared/types/admin.types';
import { formatDate } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { showToast } from '../../common/Toast';

function UserAvatarItem({ item, colors }: { item: AdminUser; colors: any }) {
  const [imageError, setImageError] = useState(false);
  const rawImage = item.profileImage || item.avatar;

  if (rawImage && !imageError) {
    return (
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight, overflow: 'hidden' }]}>
        <Image
          source={{ uri: rawImage }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
      <Text style={[styles.avatarText, { color: colors.primary }]}>
        {item.name?.charAt(0).toUpperCase() || 'U'}
      </Text>
    </View>
  );
}

export default function UsersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  const load = useCallback(async () => {
    try {
      const data = await adminApi.fetchAdminUsers();
      setUsers(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const updatedStatus = !user.isActive;
    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: updatedStatus } : u))
    );
    try {
      await adminApi.updateUserStatus(user.id, updatedStatus);
      await load();
    } catch (e) {
      // Revert status on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u))
      );
      showToast('error', 'Error', getErrorMessage(e));
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    // Status tab filter
    if (activeTab === 'ACTIVE' && !u.isActive) return false;
    if (activeTab === 'BLOCKED' && u.isActive) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const blockedCount = users.filter((u) => !u.isActive).length;

  const renderItem = ({ item }: { item: AdminUser }) => (
    <Card padding="md" style={styles.userCard}>
      <View style={styles.userRow}>
        <UserAvatarItem item={item} colors={colors} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
          <Text style={[styles.userPhone, { color: colors.textTertiary }]}>{item.phone}</Text>
          <View style={styles.userMeta}>
            <Badge label={item.role} variant={item.role === 'ADMIN' ? 'primary' : 'default'} />
            <Text style={[styles.userDate, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.toggleContainer}>
          <Switch
            value={item.isActive}
            onValueChange={() => handleToggleStatus(item)}
            trackColor={{ false: colors.error, true: colors.success }}
            thumbColor="#FFFFFF"
          />
          <Text style={[styles.toggleLabel, { color: item.isActive ? colors.success : colors.error }]}>
            {item.isActive ? 'Active' : 'Blocked'}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Users Management</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {users.length} total • {activeCount} active • {blockedCount} blocked
        </Text>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('ALL')}
            style={[
              styles.tabBtn,
              { backgroundColor: activeTab === 'ALL' ? colors.primary : colors.inputBg },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'ALL' ? '#FFFFFF' : colors.text }]}>
              All ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('ACTIVE')}
            style={[
              styles.tabBtn,
              { backgroundColor: activeTab === 'ACTIVE' ? colors.success : colors.inputBg },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'ACTIVE' ? '#FFFFFF' : colors.text }]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('BLOCKED')}
            style={[
              styles.tabBtn,
              { backgroundColor: activeTab === 'BLOCKED' ? colors.error : colors.inputBg },
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'BLOCKED' ? '#FFFFFF' : colors.text }]}>
              Blocked ({blockedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon={<Users size={48} color={colors.textTertiary} />}
              title="No users found"
              subtitle={searchQuery ? 'Try matching another name, email, or phone' : 'No users in this filter tab'}
            />
          )
        }
      />
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
  title: { ...typography.h3, marginBottom: 4 },
  subtitle: { ...typography.bodySmall, marginBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: { padding: spacing.lg, paddingBottom: 100 },
  userCard: { marginBottom: spacing.sm },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h4, fontSize: 18 },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  userInfo: { flex: 1 },
  userName: { ...typography.bodySmall, fontWeight: '600', marginBottom: 2 },
  userEmail: { ...typography.caption, marginBottom: 2 },
  userPhone: { ...typography.caption, marginBottom: 6 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userDate: { ...typography.caption },
  toggleContainer: { alignItems: 'center', gap: 4 },
  toggleLabel: { ...typography.caption, fontSize: 11, fontWeight: '700' },
});
