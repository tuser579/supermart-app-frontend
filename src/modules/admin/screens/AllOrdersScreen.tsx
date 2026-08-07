import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Package,
  ChevronRight,
  Filter,
  Calendar,
  DollarSign,
  ShoppingBag,
  UserCheck,
  UserPlus,
  X,
  SlidersHorizontal,
  Search as SearchIcon,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import { Card } from '../../common/Card';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from '../../user/components/StatusTimeline';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, PAYMENT_METHOD_LABELS } from '../../../shared/types/order.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { showToast } from '../../common/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { label: 'All', value: null, icon: '📋' },
  { label: 'Assigned Staff', value: 'ASSIGNED', icon: '👤' },
  { label: 'Pending', value: 'PENDING', icon: '⏳' },
  { label: 'Confirmed', value: 'CONFIRMED', icon: '✅' },
  { label: 'Processing', value: 'PROCESSING', icon: '⚙️' },
  { label: 'Shipped', value: 'SHIPPED', icon: '🚚' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY', icon: '🛵' },
  { label: 'Delivered', value: 'DELIVERED', icon: '📦' },
  { label: 'Completed', value: 'COMPLETED', icon: '🎉' },
  { label: 'Cancelled', value: 'CANCELLED', icon: '❌' },
  { label: 'Return Requested', value: 'RETURN_REQUESTED', icon: '↩️' },
  { label: 'Returned', value: 'RETURNED', icon: '🔄' },
];

export default function AllOrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isTablet, isDesktop, contentMaxWidth, containerPadding } = useResponsiveLayout() as any;
  const isLargeScreen = isTablet || isDesktop;

  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempActiveTab, setTempActiveTab] = useState<string | null>(null);

  const [orderToReject, setOrderToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid Transaction ID submitted');
  const [isRejecting, setIsRejecting] = useState(false);
  const [orderToApproveReturn, setOrderToApproveReturn] = useState<string | null>(null);
  const [isApprovingReturn, setIsApprovingReturn] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      if (activeTab === 'ASSIGNED') {
        const data = await adminApi.fetchAssignedOrders();
        setOrders(data);
      } else {
        const data = await adminApi.fetchAllOrders({ status: activeTab || undefined });
        setOrders(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await adminApi.fetchStaffList();
        setStaffList(list || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Filter orders locally by Order ID, Invoice/Ref ID, Trx ID, Customer Name, Item
  const filteredOrders = useMemo(() => {
    let list = orders;
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
  }, [orders, searchQuery]);

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

  const handleAssignStaff = async (staffId: string) => {
    if (!selectedOrderForAssign) return;
    const targetStaff = staffList.find((s: any) => s.id === staffId);
    const staffName = targetStaff?.user?.name || targetStaff?.name || 'This staff member';

    const isAvailable = targetStaff?.isAvailable !== false;
    const isCheckedIn = targetStaff?.isCheckedIn !== false && targetStaff?.attendanceStatus !== 'ABSENT';
    const isAttendanceCompleted = targetStaff?.isCheckedOut === true || targetStaff?.attendanceStatus === 'COMPLETED';

    if (!isAvailable) {
      showToast(
        'warning',
        'Staff Offline',
        `${staffName} is currently marked as Offline or Unavailable for deliveries.`
      );
      return;
    }

    if (!isCheckedIn) {
      showToast(
        'warning',
        'Staff Not Checked In',
        `${staffName} has not checked in for today's shift yet. Orders require active checked-in staff.`
      );
      return;
    }

    if (isAttendanceCompleted) {
      showToast(
        'warning',
        'Attendance Completed',
        `${staffName} has already checked out and completed today's duty shift. Cannot assign new orders.`
      );
      return;
    }

    setAssigning(true);
    try {
      await adminApi.assignStaffToOrder(selectedOrderForAssign.id, staffId);
      setSelectedOrderForAssign(null);
      await load();
      showToast(
        'success',
        'Staff Assigned',
        `Assigned ${staffName} to order #${selectedOrderForAssign.id.slice(-8).toUpperCase()} successfully!`
      );
    } catch (e) {
      showToast(
        'error',
        'Assignment Failed',
        getErrorMessage(e) || 'Staff is not available at this moment. Unable to assign order.'
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleOpenAssignModal = (order: Order) => {
    if (!staffList || staffList.length === 0) {
      showToast(
        'warning',
        'Staff Unavailable',
        'No delivery staff members are active at this moment. Please register staff in Users management.'
      );
    } else {
      const readyStaff = staffList.filter(
        (s: any) =>
          s.isAvailable !== false &&
          s.isCheckedIn !== false &&
          s.attendanceStatus !== 'ABSENT' &&
          s.isCheckedOut !== true &&
          s.attendanceStatus !== 'COMPLETED'
      );
      if (readyStaff.length === 0) {
        showToast(
          'warning',
          'No Staff Ready On Duty',
          'All delivery staff are currently either Offline, Not Checked In, or Completed today\'s shift.'
        );
      }
    }
    setSelectedOrderForAssign(order);
  };

  const handleApproveOrder = (orderId: string) => {
    setOrderToApprove(orderId);
  };

  const confirmApproveOrder = async () => {
    if (!orderToApprove) return;
    setIsApproving(true);
    try {
      const targetOrder = orders.find((o) => o.id === orderToApprove);
      const isMobileBankingTxn = targetOrder?.paymentMethod !== 'COD' && Boolean(targetOrder?.transactionId && targetOrder.transactionId.trim().length > 0) && targetOrder?.status !== 'PENDING';

      if (isMobileBankingTxn) {
        await adminApi.verifyPayment(orderToApprove, true);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderToApprove ? { ...o, status: 'COMPLETED' as any, paymentStatus: 'COMPLETED' as any } : o
          )
        );
        showToast('success', 'Order Completed', 'Payment & TxnID Verified — Order is now COMPLETED!');
      } else {
        await adminApi.updateOrderStatus(orderToApprove, 'CONFIRMED');
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderToApprove ? { ...o, status: 'CONFIRMED' as any } : o
          )
        );
        showToast('success', 'Order Confirmed', 'Order status updated to CONFIRMED!');
      }
      await load();
      setOrderToApprove(null);
    } catch (e) {
      showToast('error', 'Error', getErrorMessage(e));
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setRejectReason('Order rejected by Admin');
    setOrderToReject(orderId);
  };

  const confirmRejectOrder = async () => {
    if (!orderToReject) return;
    setIsRejecting(true);
    try {
      const targetOrder = orders.find((o) => o.id === orderToReject);
      const reason = rejectReason.trim() ? `Order cancelled by admin: ${rejectReason.trim()}` : 'Order cancelled by admin';
      if (targetOrder?.paymentMethod !== 'COD' && Boolean(targetOrder?.transactionId && targetOrder.transactionId.trim().length > 0)) {
        await adminApi.verifyPayment(orderToReject, false, reason);
      } else {
        await adminApi.updateOrderStatus(orderToReject, 'CANCELLED', reason);
      }
      await load();
      setOrderToReject(null);
      showToast('success', 'Order Rejected', 'Order has been cancelled and customer notified.');
    } catch (e) {
      showToast('error', 'Error', getErrorMessage(e));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveReturn = (orderId: string) => {
    setOrderToApproveReturn(orderId);
  };

  const confirmApproveReturn = async () => {
    if (!orderToApproveReturn) return;
    setIsApprovingReturn(true);
    try {
      await adminApi.updateOrderStatus(orderToApproveReturn, 'RETURNED');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderToApproveReturn ? { ...o, status: 'RETURNED' as any } : o))
      );
      await load();
      setOrderToApproveReturn(null);
      showToast('success', 'Return Approved', 'Order status updated to RETURNED.');
    } catch (e) {
      showToast('error', 'Error', getErrorMessage(e));
    } finally {
      setIsApprovingReturn(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Calculate order stats
  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
    const processing = orders.filter((o) => o.status === 'PROCESSING').length;
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
    const outForDelivery = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const completed = orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length;
    const assigned = orders.filter(
      (o) => (o as any).assignedStaff || (o as any).assignedStaffId || (o as any).staffId
    ).length;
    return { total, assigned, pending, confirmed, processing, shipped, outForDelivery, delivered, completed };
  };

  const stats = getOrderStats();

  // Helper function to render payment status badge
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
    } else if (['REFUNDED', 'REFUND', 'REFUND_SUCCESS', 'REFUNDED_SUCCESS'].includes(normalizedStatus)) {
      label = 'REFUNDED';
      bgColor = 'rgba(59,130,246,0.12)';
      borderColor = '#3B82F6';
      textColor = '#3B82F6';
    } else if (['FAILED', 'FAIL', 'PAYMENT_FAILED', 'DECLINED'].includes(normalizedStatus)) {
      label = 'FAILED';
      bgColor = 'rgba(239,68,68,0.12)';
      borderColor = '#EF4444';
      textColor = '#EF4444';
    } else if (['PENDING', 'WAITING', 'IN_PROGRESS', 'PROCESSING'].includes(normalizedStatus)) {
      label = 'PENDING';
      bgColor = 'rgba(234,179,8,0.12)';
      borderColor = '#EAB308';
      textColor = '#EAB308';
    }

    return (
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: bgColor,
          borderColor: borderColor,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>{label}</Text>
      </View>
    );
  };

  const renderOrderItemCard = (item: Order) => {
    const assignedStaffName =
      (item as any).assignedStaff?.user?.name || (item as any).assignedStaff?.name || (item as any).staffName;
    const orderIdRef = `#${item.orderId || item.id.slice(-8).toUpperCase()}`;

    const hasTxnId =
      item.paymentMethod !== 'COD' && Boolean(item.transactionId && item.transactionId.trim().length > 0);
    const isPending = item.status === 'PENDING';
    const isNotFinished = !['COMPLETED', 'CANCELLED', 'RETURNED'].includes(item.status);

    const showApproveOrVerify =
      isNotFinished && (isPending || (hasTxnId && item.paymentStatus !== 'COMPLETED'));
    const showReject = isNotFinished && (isPending || hasTxnId);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/order/${item.id}`)}
        activeOpacity={0.7}
        style={{ flex: 1 }}
      >
        <Card
          padding="md"
          style={[
            styles.orderCard,
            {
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Card Top Row: Order ID Pill + Items count + Payment Badge */}
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <View style={[styles.orderIdPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.orderIdText, { color: colors.primary }]}>{orderIdRef}</Text>
              </View>

              <View style={[styles.orderItems, { backgroundColor: colors.inputBg }]}>
                <ShoppingBag size={12} color={colors.textSecondary} />
                <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
                  {item.items.length} items
                </Text>
              </View>
            </View>

            {renderPaymentStatusBadge(item)}
          </View>


          {/* Date & Grand Total Row */}
          <View style={styles.orderDetails}>
            <View style={styles.orderInfoRow}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>

            <View style={styles.orderInfoRow}>
              <DollarSign size={14} color={colors.primary} />
              <Text style={[styles.orderTotal, { color: colors.primary }]}>
                {formatCurrency(item.grandTotal || item.totalAmount)}
              </Text>
            </View>
          </View>
          {/* Customer Account Information */}
          <View
            style={{
              marginTop: 6,
              padding: 10,
              borderRadius: radius.md,
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 }}>
              👤 Customer Account Info
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                User ID: <Text style={{ fontWeight: '700', color: colors.text }}>{item.userId || item.user?.id || 'N/A'}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Name: <Text style={{ fontWeight: '700', color: colors.text }}>{item.user?.name || item.deliveryAddress?.fullName || 'Customer'}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Email: <Text style={{ fontWeight: '700', color: colors.text }}>{item.user?.email || (item as any).userEmail || (item as any).customerEmail || (item.deliveryAddress as any)?.email || (item.user?.name ? `${item.user.name.toLowerCase().replace(/\s+/g, '')}@example.com` : 'customer@supermart.com')}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Phone: <Text style={{ fontWeight: '700', color: colors.text }}>{item.user?.phone || item.deliveryAddress?.phone || 'N/A'}</Text>
              </Text>
            </View>
          </View>

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

          {/* Mobile Banking Transaction ID Validation Card */}
          {!['RETURNED'].includes(item.status) && (
            <View
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: radius.md,
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 6,
              }}
            >
              {item.paymentMethod !== 'COD' && Boolean(item.transactionId && item.transactionId.trim().length > 0) ? (
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
                    Method: {PAYMENT_METHOD_LABELS[item.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || item.paymentMethod || 'bKash'}
                  </Text>
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
                </View>
              ) : item.paymentMethod !== 'COD' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                    Method: {PAYMENT_METHOD_LABELS[item.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || item.paymentMethod}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.warning, fontWeight: '600' }}>
                    ⏳ Awaiting Payment
                  </Text>
                </View>
              ) : (item.paymentStatus === 'PAID' || item.paymentStatus === 'COMPLETED') ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                    💵 Cash Collected
                  </Text>
                </View>
              ) : null}

              {(showApproveOrVerify || showReject) && (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {showApproveOrVerify && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleApproveOrder(item.id);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#10B981',
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                        {isPending ? '✓ Confirm' : hasTxnId ? '✓ Verify & Complete' : '✓ Complete'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showReject && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRejectOrder(item.id);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#EF4444',
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                        ✕ Reject
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Return Request Details Card */}
          {(item.status === 'RETURN_REQUESTED' || item.status === 'RETURNED' || (item as any).returnReason) && (
            <View
              style={{
                marginTop: 8,
                padding: 8,
                borderRadius: radius.md,
                backgroundColor: colors.inputBg,
                borderWidth: 1,
                borderColor: colors.error,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.error }}>
                ↩️ Return Request Details
              </Text>
              {(item as any).returnReason && (
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                  Reason: {(item as any).returnReason}
                </Text>
              )}

              {item.status === 'RETURN_REQUESTED' && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleApproveReturn(item.id);
                  }}
                  style={{
                    backgroundColor: colors.error,
                    paddingVertical: 6,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                    Approve Return (Mark Returned)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Staff Assignment Row - Shown ONLY after order is confirmed */}
          {!['PENDING', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(item.status) && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <UserCheck size={14} color={assignedStaffName ? colors.success : colors.textTertiary} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: assignedStaffName ? colors.success : colors.textSecondary,
                  }}
                >
                  {assignedStaffName ? `Staff: ${assignedStaffName}` : 'No Staff'}
                </Text>
              </View>
              {!assignedStaffName && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenAssignModal(item);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: colors.primaryLight,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                  }}
                >
                  <UserPlus size={12} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                    Assign
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  // Header Overview Stats Cards
  const renderStatsCards = () => {
    if (!isLargeScreen) return null;

    const statItems = [
      { label: 'Total', value: stats.total, color: colors.primary },
      { label: 'Pending', value: stats.pending, color: '#FFA94D' },
      { label: 'Confirmed', value: stats.confirmed, color: '#4DABF7' },
      { label: 'Delivered', value: stats.delivered, color: '#20C997' },
      { label: 'Completed', value: stats.completed, color: '#22C55E' },
    ];

    return (
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: containerPadding, marginTop: spacing.md }}>
        <View style={styles.statsGrid}>
          {statItems.map((stat, index) => (
            <Card
              key={index}
              padding="sm"
              style={[
                styles.statCardItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: stat.color,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>
      </View>
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
              <Text style={[styles.title, { color: colors.text }]}>All Orders</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Manage, assign delivery staff, and track {filteredOrders.length} customer orders
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

      {/* Header Stats Overview Cards */}
      {renderStatsCards()}

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
          key={isDesktop ? 'desktop-admin-grid-2' : 'mobile-admin-list-1'}
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
                title="No orders found"
                subtitle={
                  activeFilterCount > 0
                    ? 'No orders match your filter parameters or search query.'
                    : 'Customer orders will appear here.'
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
                    Search Order ID / Invoice ID / Customer / Item
                  </Text>
                </View>

                <View style={[styles.searchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <SearchIcon size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search Order ID (e.g. #ORD-1234), TrxID, Name..."
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
                          {tab.icon} {tab.label}
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

      {/* Staff Assignment Modal */}
      <Modal
        visible={Boolean(selectedOrderForAssign)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrderForAssign(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.assignModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.assignModalTitle, { color: colors.text }]}>Assign Delivery Staff</Text>
              <TouchableOpacity onPress={() => setSelectedOrderForAssign(null)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.assignModalSub, { color: colors.textSecondary }]}>
              Select staff to deliver Order #{selectedOrderForAssign?.id.slice(-8).toUpperCase()}
            </Text>

            <ScrollView style={{ maxHeight: 280, marginTop: 12 }}>
              {staffList.map((staff: any) => {
                const isAvailable = staff.isAvailable !== false;
                const isCheckedIn = staff.isCheckedIn !== false && staff.attendanceStatus !== 'ABSENT';
                const isAttendanceCompleted = staff.isCheckedOut === true || staff.attendanceStatus === 'COMPLETED';
                const canAssign = isAvailable && isCheckedIn && !isAttendanceCompleted;
                const staffName = staff.user?.name || staff.name || 'Delivery Staff';

                return (
                  <TouchableOpacity
                    key={staff.id}
                    disabled={assigning}
                    onPress={() => handleAssignStaff(staff.id)}
                    style={[
                      styles.staffSelectItem,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                        opacity: canAssign ? 1 : 0.6,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.staffNameText, { color: colors.text }]}>{staffName}</Text>
                        <ChevronRight size={16} color={colors.textSecondary} />
                      </View>

                      {/* Status Badges: Availability & Shift Attendance Status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Availability Status Badge */}
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: isAvailable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            borderWidth: 1,
                            borderColor: isAvailable ? '#22C55E' : '#EF4444',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: isAvailable ? '#22C55E' : '#EF4444' }}>
                            {isAvailable ? '● Available' : '○ Offline'}
                          </Text>
                        </View>

                        {/* Shift Attendance Status Badge */}
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: isAttendanceCompleted
                              ? 'rgba(107,114,128,0.12)'
                              : isCheckedIn
                              ? 'rgba(59,130,246,0.12)'
                              : 'rgba(234,179,8,0.12)',
                            borderWidth: 1,
                            borderColor: isAttendanceCompleted
                              ? '#6B7280'
                              : isCheckedIn
                              ? '#3B82F6'
                              : '#EAB308',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: isAttendanceCompleted
                                ? '#6B7280'
                                : isCheckedIn
                                ? '#3B82F6'
                                : '#EAB308',
                            }}
                          >
                            {isAttendanceCompleted
                              ? '🏁 Duty Completed'
                              : isCheckedIn
                              ? '✓ On Shift (Checked In)'
                              : '⏳ Not Checked In'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reject Order Modal */}
      <Modal
        visible={Boolean(orderToReject)}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToReject(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.actionModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.actionModalTitle, { color: colors.text }]}>Reject Order</Text>
            <Text style={[styles.actionModalSub, { color: colors.textSecondary }]}>
              This will cancel the order, set status to CANCELLED, and restore product inventory stock.
            </Text>

            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Rejection Reason"
              placeholderTextColor={colors.textTertiary}
              style={[styles.modalTextInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setOrderToReject(null)}
                style={[styles.modalActionBtn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRejectOrder}
                disabled={isRejecting}
                style={[styles.modalActionBtn, { backgroundColor: colors.error }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {isRejecting ? 'Rejecting...' : 'Reject & Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Return Modal */}
      <Modal
        visible={Boolean(orderToApproveReturn)}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToApproveReturn(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.actionModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.actionModalTitle, { color: colors.text }]}>Approve Return</Text>
            <Text style={[styles.actionModalSub, { color: colors.textSecondary }]}>
              Approve this return request? Order status will be updated to RETURNED.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setOrderToApproveReturn(null)}
                style={[styles.modalActionBtn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmApproveReturn}
                disabled={isApprovingReturn}
                style={[styles.modalActionBtn, { backgroundColor: colors.error }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {isApprovingReturn ? 'Approving...' : 'Approve Return'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve / Accept Order Modal */}
      <Modal
        visible={Boolean(orderToApprove)}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToApprove(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.actionModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.actionModalTitle, { color: colors.text }]}>Confirm / Complete Order</Text>
            <Text style={[styles.actionModalSub, { color: colors.textSecondary }]}>
              Confirm or verify payment and complete this order?
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setOrderToApprove(null)}
                style={[styles.modalActionBtn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmApproveOrder}
                disabled={isApproving}
                style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {isApproving ? 'Updating...' : 'Yes, Confirm'}
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

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statCardItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
    minHeight: 340,
  },
  fullWidthCardWrap: {
    width: '100%',
    marginBottom: spacing.md,
    minHeight: 340,
  },

  // Card Internal Styles
  orderCard: {
    flex: 1,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderIdContainer: {
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
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  itemsCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: 12,
  },
  orderTotal: {
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

  // Modal Center Action Styles
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  assignModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignModalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  assignModalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  staffSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  staffNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  staffStatusText: {
    fontSize: 11,
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionModalSub: {
    fontSize: 13,
    marginBottom: 14,
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
});