import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Package,
  MapPin,
  Bell,
  SlidersHorizontal,
  Search as SearchIcon,
  X,
  RotateCcw,
  Check,
  ShoppingBag,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as staffApi from '../services/staffApi';
import { Card } from '../../common/Card';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from '../../user/components/StatusTimeline';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, OrderStatus, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../../shared/types/order.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { showToast } from '@/src/modules/common/Toast';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

const TABS = [
  { label: 'All Orders', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Return Requested', value: 'RETURN_REQUESTED' },
  { label: 'Returned', value: 'RETURNED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AssignedOrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout() as any;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempActiveTab, setTempActiveTab] = useState<string | null>(null);

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

  const handleOrderPress = (order: Order) => {
    router.push(`/staff/order/${order.id}`);
  };

  // Helper function to render payment status badge (matching admin & user panel)
  const renderPaymentStatusBadge = (order: Order) => {
    const status = order.paymentStatus || '';
    const normalizedStatus = String(status).toUpperCase().trim();

    let label = 'UNPAID';
    let bgColor = 'rgba(234,179,8,0.12)';
    let borderColor = '#EAB308';
    let textColor = '#EAB308';

    if (['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL'].includes(normalizedStatus)) {
      label = 'PAID';
      bgColor = 'rgba(34,197,94,0.12)';
      borderColor = '#22C55E';
      textColor = '#22C55E';
    } else if (['REFUNDED', 'REFUND', 'REFUND_SUCCESS'].includes(normalizedStatus)) {
      label = 'REFUNDED';
      bgColor = 'rgba(59,130,246,0.12)';
      borderColor = '#3B82F6';
      textColor = '#3B82F6';
    } else if (['FAILED', 'FAIL', 'PAYMENT_FAILED', 'DECLINED'].includes(normalizedStatus)) {
      label = 'FAILED';
      bgColor = 'rgba(239,68,68,0.12)';
      borderColor = '#EF4444';
      textColor = '#EF4444';
    } else if (['PENDING', 'WAITING', 'IN_PROGRESS'].includes(normalizedStatus)) {
      label = 'PENDING';
      bgColor = 'rgba(234,179,8,0.12)';
      borderColor = '#EAB308';
      textColor = '#EAB308';
    }

    return (
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: bgColor,
          borderColor: borderColor,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '800', color: textColor }}>{label}</Text>
      </View>
    );
  };

  // Filter orders locally by Order ID, Invoice/Ref ID, Trx ID, Customer Name, Item
  const filteredOrders = useMemo(() => {
    let list = orders;

    // Filter by tab if selected
    if (activeTab) {
      list = list.filter((ord) => ord.status === activeTab);
    }

    // Filter by search query (Order ID, Invoice, Trx ID, Customer, Item name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((ord) => {
        const idMatch = ord.id?.toLowerCase().includes(q);
        const refMatch = ord.orderId?.toLowerCase().includes(q) || ord.orderNumber?.toLowerCase().includes(q);
        const trxMatch = ord.transactionId?.toLowerCase().includes(q);
        const userMatch = ord.user?.name?.toLowerCase().includes(q) || ord.user?.email?.toLowerCase().includes(q);
        const itemMatch = ord.items?.some((i) =>
          (i.product?.name || i.productName || '').toLowerCase().includes(q)
        );
        return idMatch || refMatch || trxMatch || userMatch || itemMatch;
      });
    }

    return list;
  }, [orders, activeTab, searchQuery]);

  const activeFilterCount = (activeTab ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const handleOpenFilterModal = () => {
    setTempSearchQuery(searchQuery);
    setTempActiveTab(activeTab);
    setIsFilterModalOpen(true);
  };

  const handleApplyModalFilters = () => {
    setSearchQuery(tempSearchQuery);
    setActiveTab(tempActiveTab);
    setIsFilterModalOpen(false);
  };

  const handleResetModalFilters = () => {
    setTempSearchQuery('');
    setTempActiveTab(null);
  };

  const renderOrderItemCard = (item: Order) => {
    const orderIdRef = `#${item.orderId || item.orderNumber || item.id}`;

    return (
      <TouchableOpacity onPress={() => handleOrderPress(item)} activeOpacity={0.8} style={{ flex: 1 }}>
        <Card
          padding="md"
          style={[
            styles.orderCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Card Top Row: Order ID Pill + Payment Badge + Status Badge */}
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <View style={[styles.orderIdPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.orderIdText, { color: colors.primary }]}>{orderIdRef}</Text>
              </View>
              {renderPaymentStatusBadge(item)}
            </View>

            <OrderStatusBadge
              status={item.status}
              assignedStaff={item.assignedStaff}
              assignedStaffId={item.assignedStaffId}
            />
          </View>

          {/* Date Row */}
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>

          {/* Payment Method & TrxID Info Box (Shown ONLY when status is COMPLETED for Staff) */}
          {item.status === 'COMPLETED' && (
            <View
              style={{
                marginVertical: 4,
                padding: 8,
                borderRadius: radius.md,
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                  Payment Method:{' '}
                  {item.paymentMethod === 'COD'
                    ? 'Cash on Delivery'
                    : (PAYMENT_METHOD_LABELS[item.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || item.paymentMethod || 'Digital Payment')}
                </Text>

                {item.paymentMethod !== 'COD' && Boolean(item.transactionId && item.transactionId.trim().length > 0) && (
                  <View
                    style={{
                      backgroundColor: colors.primary + '15',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 }}>
                      TrxID: {item.transactionId}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Horizontal Status Timeline */}
          <View style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}>
            <StatusTimeline
              currentStatus={item.status}
              isCancelled={item.status === 'CANCELLED'}
              cancellationReason={item.cancellationReason}
              cancelledBy={(item as any).cancelledBy}
              mode="horizontal"
              assignedStaffName={item.assignedStaff?.user?.name}
              assignedStaffId={item.assignedStaffId}
            />
          </View>

          {/* Return Request Information */}
          {(item.status === 'RETURN_REQUESTED' || item.status === 'RETURNED' || (item as any).returnReason) && (
            <View
              style={{
                marginTop: 6,
                marginBottom: 6,
                padding: 8,
                borderRadius: radius.sm,
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.error,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>↩️ Return Requested</Text>
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

          {/* Cash Collection Prompt & Action Button */}
          {staffApi.canShowRecordAndCompletedButton(item) && (
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              <View
                style={{
                  backgroundColor: colors.successLight,
                  borderColor: colors.success,
                  borderWidth: 1,
                  padding: 10,
                  borderRadius: radius.md,
                  marginBottom: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Bell size={14} color={colors.success} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                    💵 Cash Collection Required
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  Collect cash of {formatCurrency(item.grandTotal || item.totalAmount)} from customer upon delivery,
                  then click below to record and complete order.
                </Text>
              </View>

              <TouchableOpacity
                onPress={async (e) => {
                  e.stopPropagation();
                  try {
                    await staffApi.recordCashPayment(item.id);
                    setOrders((prev) =>
                      prev.map((o) =>
                        o.id === item.id ? { ...o, status: 'COMPLETED' as any, paymentStatus: 'COMPLETED' as any } : o
                      )
                    );
                    await load();
                    showToast('success', 'Payment Recorded', 'Cash payment recorded and order is now COMPLETED!');
                  } catch (err) {
                    showToast('error', 'Error', getErrorMessage(err));
                  }
                }}
                style={{
                  backgroundColor: colors.success,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: radius.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓ Record and Completed</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Delivery Address */}
          {item.deliveryAddress && (
            <View
              style={{
                marginTop: 6,
                padding: 8,
                borderRadius: radius.md,
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                  Delivery Address: {item.deliveryAddress.fullName}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 20 }}>
                {item.deliveryAddress.addressLine1}
                {item.deliveryAddress.addressLine2 ? `, ${item.deliveryAddress.addressLine2}` : ''}, {item.deliveryAddress.area}, {item.deliveryAddress.city}
              </Text>
              {item.deliveryAddress.phone && (
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 20, fontWeight: '600' }}>
                  📞 {item.deliveryAddress.phone}
                </Text>
              )}
            </View>
          )}

          {/* Card Footer: Items Count & Total */}
          <View style={styles.orderFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ShoppingBag size={14} color={colors.textSecondary} />
              <Text style={[styles.itemCount, { color: colors.textSecondary }]}>{item.items.length} items</Text>
            </View>
            <Text style={[styles.total, { color: colors.primary }]}>
              {formatCurrency(item.grandTotal || item.totalAmount)}
            </Text>
          </View>

          {/* Single Next Status Action Button (e.g., Confirmed -> Processing -> Shipped) */}
          {(() => {
            const idx = ORDER_STATUS_FLOW.indexOf(item.status);
            if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
            const nextStatus = ORDER_STATUS_FLOW[idx + 1];
            if (nextStatus === 'COMPLETED' || ['COMPLETED', 'CANCELLED', 'RETURNED'].includes(item.status)) return null;
            const label = ORDER_STATUS_LABELS[nextStatus] || nextStatus;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async (e) => {
                  e.stopPropagation();
                  try {
                    await staffApi.updateOrderStatus(item.id, nextStatus);
                    setOrders((prev) =>
                      prev.map((o) => (o.id === item.id ? { ...o, status: nextStatus as any } : o))
                    );
                    await load();
                    showToast('success', 'Status Updated', `Order updated to ${label}`);
                  } catch (err) {
                    showToast('error', 'Error', getErrorMessage(err));
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                  Mark as {label} →
                </Text>
              </TouchableOpacity>
            );
          })()}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: containerPadding,
          },
        ]}
      >
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Package size={isDesktop ? 26 : 22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Assigned Orders</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {filteredOrders.length} orders assigned for delivery
              </Text>
            </View>
          </View>

          {/* Filter Modal Trigger Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenFilterModal}
            style={[
              styles.filterTriggerBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.inputBg,
                borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
              },
            ]}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? colors.primary : colors.text} />
            <Text style={[styles.filterTriggerText, { color: activeFilterCount > 0 ? colors.primary : colors.text }]}>
              Filter & Search
            </Text>
            {activeFilterCount > 0 && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <View style={[styles.activeChipsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.activeChipsInner, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
            <Text style={[styles.activeChipsLabel, { color: colors.textSecondary }]}>Active Filters:</Text>

            {Boolean(searchQuery.trim()) && (
              <View style={[styles.activeChipPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <SearchIcon size={12} color={colors.primary} />
                <Text style={[styles.activeChipText, { color: colors.primary }]}>"{searchQuery}"</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {Boolean(activeTab) && (
              <View style={[styles.activeChipPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.activeChipText, { color: colors.primary }]}>
                  Status: {TABS.find((t) => t.value === activeTab)?.label}
                </Text>
                <TouchableOpacity onPress={() => setActiveTab(null)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setActiveTab(null);
              }}
            >
              <Text style={[styles.clearAllFiltersText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Orders Grid/List */}
      <View style={{ flex: 1, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'desktop-staff-grid-2' : 'mobile-staff-list-1'}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <View style={isDesktop ? styles.gridCardWrap : styles.fullWidthCardWrap}>
              {renderOrderItemCard(item)}
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: containerPadding },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <EmptyState
                icon={<Package size={52} color={colors.textTertiary} />}
                title="No assigned orders found"
                subtitle={
                  activeFilterCount > 0
                    ? 'No orders match your filter criteria or search query.'
                    : 'Orders assigned to you for delivery will appear here.'
                }
              />
            )
          }
        />
      </View>

      {/* Filter Modal Dialog */}
      <Modal
        visible={isFilterModalOpen}
        animationType={isDesktop ? 'fade' : 'slide'}
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsFilterModalOpen(false)} />

          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
              isDesktop && styles.modalContentDesktop,
            ]}
            onPress={(e) => e.stopPropagation?.()}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <SlidersHorizontal size={16} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Orders</Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Search Section */}
              <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <SearchIcon size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                    Search Order ID / Invoice ID / Item
                  </Text>
                </View>

                <View style={[styles.searchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <SearchIcon size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search Order ID, Invoice, Customer, Item..."
                    placeholderTextColor={colors.textTertiary}
                    value={tempSearchQuery}
                    onChangeText={setTempSearchQuery}
                  />
                  {Boolean(tempSearchQuery) && (
                    <TouchableOpacity onPress={() => setTempSearchQuery('')}>
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Status Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Package size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Order Status</Text>
                </View>

                <View style={styles.statusGrid}>
                  {TABS.map((tab) => {
                    const isSelected = tempActiveTab === tab.value;
                    return (
                      <TouchableOpacity
                        key={tab.label}
                        onPress={() => setTempActiveTab(tab.value)}
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.statusPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {tab.label}
                        </Text>
                        {isSelected && <Check size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={handleResetModalFilters}
                style={[styles.resetBtn, { borderColor: colors.border }]}
              >
                <RotateCcw size={16} color={colors.textSecondary} />
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Button title="Apply Filters" onPress={handleApplyModalFilters} size="md" />
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header styles
  header: {
    paddingVertical: spacing.lg,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 220,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Filter Trigger Button
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Active filter chips bar
  activeChipsBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    width: '100%',
  },
  activeChipsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  activeChipsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  // Grid layout styles
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  gridCardWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 320,
  },
  fullWidthCardWrap: {
    width: '100%',
    marginBottom: spacing.md,
    minHeight: 320,
  },

  // Card Internal Styles
  orderCard: {
    flex: 1,
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  itemCount: {
    fontSize: 12,
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  modalContentDesktop: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '82%',
    maxWidth: 680,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h4,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
