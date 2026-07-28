import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Package } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as orderApi from '../services/orderApi';
import { OrderCard } from '../components/OrderCard';
import { EmptyState } from '../../common/EmptyState';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order } from '../../../shared/types/order.types';

const TABS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const load = useCallback(async (status?: string | null) => {
    setLoading(true);
    try {
      const response = await orderApi.fetchOrders({ status: status || undefined, limit: 20 });
      setOrders(response.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [load, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(activeTab);
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/order/${order.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Orders</Text>
      </View>

      {/* Tabs Bar - Wrapped Grid showing ALL order step tabs directly on screen */}
      <View style={[styles.tabsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.tabsWrapGrid}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.label}
                onPress={() => setActiveTab(tab.value)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.inputBg,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} onPress={handleOrderPress} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon={<Package size={48} color={colors.textTertiary} />}
              title="No orders yet"
              subtitle="Your orders will appear here"
              ctaTitle="Start Shopping"
              onCtaPress={() => router.push('/')}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h3 },
  tabsBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    width: '100%',
  },
  tabsWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
  },
  list: { padding: spacing.lg, paddingBottom: 100 },
});
