import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Phone, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as staffApi from '../services/staffApi';
import { Card } from '../../common/Card';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from '../../user/components/StatusTimeline';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, OrderStatus } from '../../../shared/types/order.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

const TABS = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Return Requested', value: 'RETURN_REQUESTED' },
  { label: 'Returned', value: 'RETURNED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AssignedOrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const statusParam = activeTab || undefined;
      const data = await staffApi.fetchAssignedOrders({ status: statusParam });
      setOrders(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredOrders = orders.filter((order) => {
    if (!activeTab) return true;
    return order.status === activeTab;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/staff/order/${order.id}`);
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => handleOrderPress(item)} activeOpacity={0.8}>
      <Card padding="md" style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={[styles.orderId, { color: colors.text }]}>
            #{item.id.slice(-8).toUpperCase()}
          </Text>
          <OrderStatusBadge status={item.status} />
        </View>
        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
        {item.deliveryAddress && (
          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.deliveryAddress.addressLine1}, {item.deliveryAddress.area}
            </Text>
          </View>
        )}
        <View style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}>
          <StatusTimeline currentStatus={item.status} isCancelled={item.status === 'CANCELLED'} mode="horizontal" />
        </View>
        {(item.status === 'RETURN_REQUESTED' || item.status === 'RETURNED' || (item as any).returnReason) && (
          <View style={{
            marginTop: 6,
            marginBottom: 6,
            padding: 8,
            borderRadius: radius.sm,
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: colors.error,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>
              ↩️ Return Requested
            </Text>
            {(item as any).returnReason && (
              <Text style={{ fontSize: 11, color: colors.text, marginTop: 2 }}>
                Reason: {(item as any).returnReason}
              </Text>
            )}
            {(item as any).returnDetails && (
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                Details: {(item as any).returnDetails}
              </Text>
            )}
          </View>
        )}
        <View style={styles.orderFooter}>
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
            {item.items.length} items
          </Text>
          <Text style={[styles.total, { color: colors.primary }]}>
            {formatCurrency(item.grandTotal || item.totalAmount)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Assigned Orders</Text>
      </View>

      <View style={styles.tabsGrid}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.label} onPress={() => setActiveTab(tab.value)} activeOpacity={0.7}>
            <View style={[styles.tab, { backgroundColor: activeTab === tab.value ? colors.primary : colors.inputBg }]}>
              <Text style={[styles.tabText, { color: activeTab === tab.value ? '#FFFFFF' : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon={<Package size={48} color={colors.textTertiary} />}
              title="No assigned orders"
              subtitle="Orders assigned to you will appear here"
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
  title: { ...typography.h3 },
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabText: { ...typography.caption, fontSize: 12, fontWeight: '600' },
  list: { padding: spacing.lg, paddingBottom: 100 },
  orderCard: { marginBottom: spacing.md },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: { ...typography.label, fontSize: 15 },
  orderDate: { ...typography.caption, marginBottom: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  address: { ...typography.bodySmall, flex: 1 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  itemCount: { ...typography.bodySmall },
  total: { ...typography.body, fontWeight: '700' },
});
