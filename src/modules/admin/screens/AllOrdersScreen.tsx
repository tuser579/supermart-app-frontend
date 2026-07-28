import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Platform,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Package, ChevronRight, Filter, Calendar, DollarSign, ShoppingBag, UserCheck, UserPlus, X } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import { Card } from '../../common/Card';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from '../../user/components/StatusTimeline';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order } from '../../../shared/types/order.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { getErrorMessage } from '../../../shared/api/apiClient';

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
  { label: 'Return Requested', value: 'RETURN_REQUESTED', icon: '↩️' },
  { label: 'Returned', value: 'RETURNED', icon: '🔄' },
];

export default function AllOrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isTablet, isDesktop } = useResponsiveLayout();
  const isLargeScreen = isTablet || isDesktop;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [refundTxnIds, setRefundTxnIds] = useState<Record<string, string>>({});
  const [orderToReject, setOrderToReject] = useState<string | null>(null);
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

  const handleAssignStaff = async (staffId: string) => {
    if (!selectedOrderForAssign) return;
    setAssigning(true);
    try {
      await adminApi.assignStaffToOrder(selectedOrderForAssign.id, staffId);
      setSelectedOrderForAssign(null);
      await load();
      Alert.alert('Success', 'Delivery staff assigned to order successfully!');
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setAssigning(false);
    }
  };

  const handleApproveOrder = (orderId: string) => {
    setOrderToApprove(orderId);
  };

  const confirmApproveOrder = async () => {
    if (!orderToApprove) return;
    setIsApproving(true);
    try {
      await adminApi.updateOrderStatus(orderToApprove, 'CONFIRMED');
      await load();
      setOrderToApprove(null);
      if (Platform.OS === 'web') {
        window.alert('Payment Verified: Transaction ID approved and order confirmed successfully!');
      } else {
        Alert.alert('Payment Verified', 'Transaction ID approved and order confirmed successfully!');
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert(getErrorMessage(e));
      } else {
        Alert.alert('Error', getErrorMessage(e));
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    setOrderToReject(orderId);
  };

  const confirmRejectOrder = async () => {
    if (!orderToReject) return;
    setIsRejecting(true);
    try {
      await adminApi.updateOrderStatus(orderToReject, 'CANCELLED', 'Invalid Transaction ID submitted');
      await load();
      setOrderToReject(null);
    } catch (e) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', getErrorMessage(e));
      } else {
        window.alert(getErrorMessage(e));
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveReturn = (orderId: string) => {
    const refundTxnId = refundTxnIds[orderId];
    if (!refundTxnId?.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Validation Error: Please enter a Refund Transaction ID.');
      } else {
        Alert.alert('Validation Error', 'Please enter a Refund Transaction ID.');
      }
      return;
    }
    setOrderToApproveReturn(orderId);
  };

  const confirmApproveReturn = async () => {
    if (!orderToApproveReturn) return;
    const refundTxnId = refundTxnIds[orderToApproveReturn];
    setIsApprovingReturn(true);
    try {
      // This will update order status to 'RETURNED' and paymentStatus to 'REFUNDED'
      await adminApi.updateOrderStatus(orderToApproveReturn, 'RETURNED', undefined, refundTxnId.trim());
      await load();
      setRefundTxnIds(prev => { const next = {...prev}; delete next[orderToApproveReturn]; return next; });
      setOrderToApproveReturn(null);
      if (Platform.OS === 'web') {
        window.alert('Return approved and refund processed successfully!');
      } else {
        Alert.alert('Success', 'Return approved and refund processed successfully!');
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert(getErrorMessage(e));
      } else {
        Alert.alert('Error', getErrorMessage(e));
      }
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
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const confirmed = orders.filter(o => o.status === 'CONFIRMED').length;
    const processing = orders.filter(o => o.status === 'PROCESSING').length;
    const shipped = orders.filter(o => o.status === 'SHIPPED').length;
    const outForDelivery = orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const assigned = orders.filter(o => (o as any).assignedStaff || (o as any).assignedStaffId || (o as any).staffId).length;
    return { total, assigned, pending, confirmed, processing, shipped, outForDelivery, delivered };
  };

  const stats = getOrderStats();

  // Helper function to render payment status badge
  const renderPaymentStatusBadge = (order: Order) => {
    // Get payment status and handle null/undefined
    const status = order.paymentStatus || '';
    // Convert to uppercase and trim for consistent comparison
    const normalizedStatus = String(status).toUpperCase().trim();
    
    // Log the actual payment status for debugging (remove in production)
    console.log(`Order ${order.id.slice(-8)} - Payment Status:`, normalizedStatus);
    
    let label = 'UNPAID';
    let bgColor = 'rgba(234,179,8,0.12)';
    let borderColor = '#EAB308';
    let textColor = '#EAB308';

    // Check for PAID status
    if (['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL'].includes(normalizedStatus)) {
      label = 'PAID';
      bgColor = 'rgba(34,197,94,0.12)';
      borderColor = '#22C55E';
      textColor = '#22C55E';
    } 
    // Check for REFUNDED status - This is what we need for returned orders
    else if (['REFUNDED', 'REFUND', 'REFUND_SUCCESS', 'REFUNDED_SUCCESS'].includes(normalizedStatus)) {
      label = 'REFUNDED';
      bgColor = 'rgba(59,130,246,0.12)';
      borderColor = '#3B82F6';
      textColor = '#3B82F6';
    } 
    // Check for FAILED status
    else if (['FAILED', 'FAIL', 'PAYMENT_FAILED', 'DECLINED'].includes(normalizedStatus)) {
      label = 'FAILED';
      bgColor = 'rgba(239,68,68,0.12)';
      borderColor = '#EF4444';
      textColor = '#EF4444';
    } 
    // Check for PENDING status
    else if (['PENDING', 'WAITING', 'IN_PROGRESS', 'PROCESSING'].includes(normalizedStatus)) {
      label = 'PENDING';
      bgColor = 'rgba(234,179,8,0.12)';
      borderColor = '#EAB308';
      textColor = '#EAB308';
    }
    // Default to UNPAID

    return (
      <View style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>
          {label}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Order }) => {
    const assignedStaffName = (item as any).assignedStaff?.user?.name || (item as any).assignedStaff?.name || (item as any).staffName;

    return (
      <TouchableOpacity 
        onPress={() => router.push(`/order/${item.id}`)} 
        activeOpacity={0.7}
        style={styles.orderItemWrapper}
      >
        <Card 
          padding={isLargeScreen ? 'lg' : 'md'} 
          style={[
            styles.orderCard,
            { 
              borderRadius: isLargeScreen ? radius.xl : radius.lg,
              marginBottom: isLargeScreen ? spacing.md : spacing.md,
            }
          ]}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <Text style={[styles.orderId, { color: colors.text, fontSize: isLargeScreen ? 16 : 15 }]}>
                #{item.id.slice(-8).toUpperCase()}
              </Text>
              <View style={[styles.orderItems, { backgroundColor: colors.inputBg }]}>
                <ShoppingBag size={isLargeScreen ? 14 : 12} color={colors.textSecondary} />
                <Text style={[styles.itemsCount, { color: colors.textSecondary, fontSize: isLargeScreen ? 12 : 11 }]}>
                  {item.items.length}
                </Text>
              </View>
            </View>
            {/* Payment Status Badge - top right */}
            {renderPaymentStatusBadge(item)}
          </View>

          {/* Order Status Badge */}
          <View style={{ marginBottom: 4 }}>
            <OrderStatusBadge status={item.status} />
          </View>
          
          <View style={styles.orderDetails}>
            <View style={styles.orderInfoRow}>
              <Calendar size={isLargeScreen ? 16 : 14} color={colors.textSecondary} />
              <Text style={[styles.orderDate, { color: colors.textSecondary, fontSize: isLargeScreen ? 14 : 12 }]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>

            <View style={styles.orderInfoRow}>
              <DollarSign size={isLargeScreen ? 16 : 14} color={colors.primary} />
              <Text style={[styles.orderTotal, { color: colors.primary, fontSize: isLargeScreen ? 18 : 16 }]}>
                {formatCurrency(item.grandTotal || item.totalAmount)}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}>
            <StatusTimeline currentStatus={item.status} isCancelled={item.status === 'CANCELLED'} mode="horizontal" />
          </View>

          {/* Mobile Banking Transaction Validation Card (Admin) */}
          {!['RETURNED'].includes(item.status) && (
            <View style={{
              marginTop: 8,
              padding: 10,
              borderRadius: radius.md,
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 6,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                  Payment Method: {item.paymentMethod || 'BKASH'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 }}>
                  TxnID: {item.transactionId || 'No TxnID'}
                </Text>
              </View>

              {item.status === 'PENDING' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApproveOrder(item.id);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#10B981',
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      ✓ Approve Txn & Confirm
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRejectOrder(item.id);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#EF4444',
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      ✕ Reject & Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Return Order Information Card (Admin) */}
          {(item.status === 'RETURN_REQUESTED' || item.status === 'RETURNED' || (item as any).returnReason) && (
            <View style={{
              marginTop: 8,
              padding: 10,
              borderRadius: radius.md,
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.error,
              gap: 4,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>
                ↩️ Return Request Details
              </Text>
              {(item as any).returnReason && (
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                  Reason: {(item as any).returnReason}
                </Text>
              )}
              {(item as any).returnDetails && (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Details: {(item as any).returnDetails}
                </Text>
              )}

              {item.status === 'RETURN_REQUESTED' && (
                <View>
                  <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                    <TextInput
                      placeholder="Enter Refund TxnID"
                      placeholderTextColor={colors.textTertiary}
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 8,
                        color: colors.text,
                        fontSize: 12
                      }}
                      value={refundTxnIds[item.id] || ''}
                      onChangeText={(txt) => setRefundTxnIds(prev => ({ ...prev, [item.id]: txt }))}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApproveReturn(item.id);
                    }}
                    style={{
                      backgroundColor: colors.error,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                      Approve Return & Refund Customer
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Staff Assignment Control Row */}
          {!['CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(item.status) && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <UserCheck size={14} color={assignedStaffName ? colors.success : colors.textTertiary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: assignedStaffName ? colors.success : colors.textSecondary }}>
                  {assignedStaffName ? `Staff: ${assignedStaffName}` : 'No Staff Assigned'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedOrderForAssign(item);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: colors.primaryLight,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 14,
                }}
              >
                <UserPlus size={12} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  {assignedStaffName ? 'Reassign' : 'Assign Staff'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ChevronRight 
            size={isLargeScreen ? 24 : 20} 
            color={colors.textTertiary} 
            style={styles.chevronIcon}
          />
        </Card>
      </TouchableOpacity>
    );
  };

  // Stats Cards for Tablet/Desktop
  const renderStatsCards = () => {
    if (!isLargeScreen) return null;
    
    const statItems = [
      { label: 'Total', value: stats.total, color: colors.primary },
      { label: 'Pending', value: stats.pending, color: '#FFA94D' },
      { label: 'Confirmed', value: stats.confirmed, color: '#4DABF7' },
      { label: 'Shipped', value: stats.shipped, color: '#51CF66' },
      { label: 'Delivered', value: stats.delivered, color: '#20C997' },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        {statItems.map((stat, index) => (
          <Card 
            key={index}
            padding="md"
            style={[
              styles.statCard,
              { 
                backgroundColor: colors.surface,
                borderColor: stat.color,
                borderWidth: 1.5,
                borderRadius: radius.lg,
                minWidth: isLargeScreen ? 120 : 100,
              }
            ]}
          >
            <Text style={[styles.statValue, { color: stat.color, fontSize: isLargeScreen ? 24 : 20 }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: isLargeScreen ? 14 : 12 }]}>
              {stat.label}
            </Text>
          </Card>
        ))}
      </ScrollView>
    );
  };

  // Responsive Tab rendering - Completely fixed for mobile
  const renderTabs = () => {
    // For tablet and desktop, show tabs in a grid/row with equal distribution
    if (isLargeScreen) {
      return (
        <View style={[
          styles.tabsWrapper,
          { 
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
          }
        ]}>
          <View style={styles.tabsGrid}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const tabCount = tab.value ? stats[tab.value.toLowerCase() as keyof typeof stats] : stats.total;
              
              return (
                <TouchableOpacity 
                  key={tab.label} 
                  onPress={() => setActiveTab(tab.value)} 
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={[
                    styles.tabGridItem,
                    { 
                      backgroundColor: isActive ? colors.primary : colors.inputBg,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: radius.lg,
                      marginHorizontal: 4,
                    }
                  ]}>
                    <Text style={[styles.tabIcon, { fontSize: 18 }]}>
                      {tab.icon}
                    </Text>
                    <Text style={[
                      styles.tabText, 
                      { 
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 13,
                        fontWeight: '600',
                        marginTop: 2,
                      }
                    ]}>
                      {tab.label}
                    </Text>
                    {tabCount > 0 && (
                      <View style={[
                        styles.tabBadge,
                        { 
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.primary,
                          paddingHorizontal: 8,
                          borderRadius: 12,
                          marginTop: 2,
                        }
                      ]}>
                        <Text style={[
                          styles.tabBadgeText,
                          { 
                            color: isActive ? '#FFFFFF' : '#FFFFFF',
                            fontSize: 11,
                            fontWeight: '700',
                          }
                        ]}>
                          {tabCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // For mobile - Completely redesigned to prevent cutting
    // Use flex-wrap for small screens
    const shouldWrap = SCREEN_WIDTH < 420;
    
    if (shouldWrap) {
      // Wrap tabs into 2 rows for very small screens
      return (
        <View style={[
          styles.mobileTabsWrapper,
          { 
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }
        ]}>
          <View style={styles.tabsWrapGrid}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              const tabCount = tab.value ? stats[tab.value.toLowerCase() as keyof typeof stats] : stats.total;
              
              return (
                <TouchableOpacity 
                  key={tab.label} 
                  onPress={() => setActiveTab(tab.value)} 
                  activeOpacity={0.8}
                  style={styles.wrapTabTouchable}
                >
                  <View style={[
                    styles.wrapTab,
                    { 
                      backgroundColor: isActive ? colors.primary : colors.inputBg,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'center',
                    }
                  ]}>
                    <Text style={[styles.tabIcon, { fontSize: 12 }]}>
                      {tab.icon}
                    </Text>
                    <Text style={[
                      styles.tabText, 
                      { 
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 10,
                        fontWeight: '600',
                      }
                    ]}>
                      {tab.label}
                    </Text>
                    {tabCount > 0 && (
                      <View style={[
                        styles.tabBadge,
                        { 
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.primary,
                          paddingHorizontal: 4,
                          borderRadius: 10,
                          minWidth: 14,
                          height: 14,
                        }
                      ]}>
                        <Text style={[
                          styles.tabBadgeText,
                          { 
                            color: isActive ? '#FFFFFF' : '#FFFFFF',
                            fontSize: 8,
                            fontWeight: '700',
                          }
                        ]}>
                          {tabCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // For medium screens, use horizontal scroll with proper padding
    return (
      <View style={styles.mobileTabsWrapper}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileTabsContainer}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToAlignment="start"
          bounces={true}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const tabCount = tab.value ? stats[tab.value.toLowerCase() as keyof typeof stats] : stats.total;
            
            return (
              <TouchableOpacity 
                key={tab.label} 
                onPress={() => setActiveTab(tab.value)} 
                activeOpacity={0.8}
                style={styles.mobileTabTouchable}
              >
                <View style={[
                  styles.mobileTab,
                  { 
                    backgroundColor: isActive ? colors.primary : colors.inputBg,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 70,
                    justifyContent: 'center',
                  }
                ]}>
                  <Text style={[styles.tabIcon, { fontSize: 14 }]}>
                    {tab.icon}
                  </Text>
                  <Text style={[
                    styles.tabText, 
                    { 
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontSize: 12,
                      fontWeight: '600',
                    }
                  ]}>
                    {tab.label}
                  </Text>
                  {tabCount > 0 && (
                    <View style={[
                      styles.tabBadge,
                      { 
                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.primary,
                        paddingHorizontal: 6,
                        borderRadius: 12,
                      }
                    ]}>
                      <Text style={[
                        styles.tabBadgeText,
                        { 
                          color: isActive ? '#FFFFFF' : '#FFFFFF',
                          fontSize: 10,
                          fontWeight: '700',
                        }
                      ]}>
                        {tabCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface,
          paddingHorizontal: isLargeScreen ? spacing.xl : spacing.lg,
          paddingVertical: isLargeScreen ? spacing.lg : spacing.md,
          borderBottomLeftRadius: isLargeScreen ? 28 : 20,
          borderBottomRightRadius: isLargeScreen ? 28 : 20,
        }
      ]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.title, { color: colors.text, fontSize: isLargeScreen ? 28 : 22 }]}>
              All Orders
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: isLargeScreen ? 14 : 12 }]}>
              {orders.length} orders total
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => console.log('Filter orders')}
            style={[styles.filterButton, { backgroundColor: colors.inputBg }]}
          >
            <Filter size={isLargeScreen ? 22 : 20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards - Tablet/Desktop */}
      {renderStatsCards()}

      {/* Tabs - Responsive */}
      {renderTabs()}

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { 
            padding: isLargeScreen ? spacing.xl : spacing.lg,
            paddingBottom: isLargeScreen ? 120 : 100,
          }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon={<Package size={isLargeScreen ? 64 : 48} color={colors.textTertiary} />}
              title="No orders found"
              subtitle="Orders will appear here"
            />
          )
        }
      />

      {/* Reject Order Modal */}
      <Modal
        visible={!!orderToReject}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToReject(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Reject Transaction ID</Text>
              <TouchableOpacity onPress={() => setOrderToReject(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to reject this payment and cancel the order?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setOrderToReject(null)}
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
                onPress={confirmRejectOrder}
                disabled={isRejecting}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isRejecting ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isRejecting ? 'Rejecting...' : 'Reject & Cancel Order'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Return Modal */}
      <Modal
        visible={!!orderToApproveReturn}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToApproveReturn(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Approve Return</Text>
              <TouchableOpacity onPress={() => setOrderToApproveReturn(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to approve this return and process the refund?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setOrderToApproveReturn(null)}
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
                onPress={confirmApproveReturn}
                disabled={isApprovingReturn}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isApprovingReturn ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isApprovingReturn ? 'Approving...' : 'Approve & Refund'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Payment Confirmation Modal */}
      <Modal
        visible={!!orderToApprove}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderToApprove(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Approve Payment</Text>
              <TouchableOpacity onPress={() => setOrderToApprove(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to approve this payment and confirm the order? This will update the order status to Confirmed.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setOrderToApprove(null)}
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
                onPress={confirmApproveOrder}
                disabled={isApproving}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.success,
                  opacity: isApproving ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isApproving ? 'Approving...' : 'Approve Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Staff Assignment Modal */}
      <Modal
        visible={!!selectedOrderForAssign}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrderForAssign(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Staff to Order</Text>
              <TouchableOpacity onPress={() => setSelectedOrderForAssign(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Order #{selectedOrderForAssign?.id.slice(-8).toUpperCase()} • {formatCurrency(selectedOrderForAssign?.grandTotal || selectedOrderForAssign?.totalAmount || 0)}
            </Text>

            <ScrollView style={{ maxHeight: 320, marginVertical: 12 }}>
              {staffList.length > 0 ? (
                staffList.map((staff: any) => (
                  <TouchableOpacity
                    key={staff.id}
                    onPress={() => handleAssignStaff(staff.id)}
                    style={[styles.staffItem, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.staffItemName, { color: colors.text }]}>
                        {staff.user?.name || staff.name || 'Staff Member'}
                      </Text>
                      <Text style={[styles.staffItemRole, { color: colors.textSecondary }]}>
                        {staff.position || 'Delivery Staff'} {staff.isAvailable ? '• Available' : '• Busy'}
                      </Text>
                    </View>
                    <View style={[styles.selectBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Assign</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ textAlign: 'center', color: colors.textSecondary, padding: 20 }}>No delivery staff found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.xl,
    padding: spacing.lg,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    ...typography.h4,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  closeBtn: {
    padding: 4,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  staffItemName: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  staffItemRole: {
    ...typography.caption,
    marginTop: 2,
  },
  selectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  container: { flex: 1 },
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsScroll: {
    marginTop: spacing.md,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  // Mobile Tabs - Wrapped grid for very small screens
  mobileTabsWrapper: {
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  },
  mobileTabsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingRight: spacing.lg, // Extra padding for right side
  },
  mobileTabTouchable: {
    flexShrink: 0,
  },
  mobileTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    minWidth: 70,
  },
  // Wrapped tabs for very small screens
  tabsWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  wrapTabTouchable: {
    flexShrink: 0,
  },
  wrapTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    minWidth: 50,
  },
  tabIcon: {
    marginRight: 0,
  },
  tabText: {
    ...typography.bodySmall,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    ...typography.caption,
  },
  // Tablet/Desktop Tabs (Grid)
  tabsWrapper: {
    width: '100%',
  },
  tabsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 4,
  },
  tabGridItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  orderItemWrapper: {
    width: '100%',
  },
  orderCard: {
    position: 'relative',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderId: {
    ...typography.label,
    fontWeight: '600',
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  itemsCount: {
    fontWeight: '600',
  },
  orderDetails: {
    gap: 4,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    ...typography.caption,
  },
  orderTotal: {
    ...typography.body,
    fontWeight: '700',
  },
  chevronIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});