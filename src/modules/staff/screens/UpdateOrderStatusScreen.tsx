import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Phone, MapPin, Check, Truck } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as staffApi from '../services/staffApi';
import * as orderApi from '../../user/services/orderApi';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { StatusTimeline } from '../../user/components/StatusTimeline';
import { OrderStatusBadge } from '../../common/Badge';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, OrderStatus, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../../shared/types/order.types';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { getErrorMessage } from '@/src/shared/api/apiClient';
import { showToast } from '@/src/modules/common/Toast';

export default function UpdateOrderStatusScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await orderApi.fetchOrderById(id);
      setOrder(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const getNextStatus = (): OrderStatus | null => {
    if (!order) return null;
    const idx = ORDER_STATUS_FLOW.indexOf(order.status);
    if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
    const next = ORDER_STATUS_FLOW[idx + 1];
    if (next === 'COMPLETED') return null;
    return next;
  };

  const handleSelectStatus = async (targetStatus: OrderStatus) => {
    if (!order || order.status === targetStatus) return;
    setUpdating(true);
    try {
      await staffApi.updateOrderStatus(order.id, targetStatus);
      await load();
    } catch (e) {
      showToast('error', 'Error', getErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  const handleCall = () => {
    if (order?.deliveryAddress?.phone) {
      Linking.openURL(`tel:${order.deliveryAddress.phone}`);
    }
  };

  if (loading) return <Loader fullscreen />;
  if (!order) return <Text style={{ padding: 20, textAlign: 'center' }}>Order not found</Text>;

  const nextStatus = getNextStatus();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Order Details</Text>
          <Text style={[styles.orderId, { color: colors.textSecondary }]}>
            #{order.orderId || order.orderNumber || order.id}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Status Timeline */}
        <Card padding="lg" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Current Status</Text>
            <OrderStatusBadge status={order.status} assignedStaff={order.assignedStaff} assignedStaffId={order.assignedStaffId} />
          </View>
          <StatusTimeline
            currentStatus={order.status}
            isCancelled={order.status === 'CANCELLED'}
            statusHistory={order.statusHistory}
            assignedStaffName={order.assignedStaff?.user?.name}
            assignedStaffId={order.assignedStaffId}
          />
        </Card>

        {/* 6-Step Order Status Selection Grid */}
        <Card padding="lg" style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: spacing.sm }]}>Update Status Step</Text>
          <Text style={[styles.addressText, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Select the new status for this order:
          </Text>
          <View style={styles.statusChipGrid}>
            {ORDER_STATUS_FLOW.filter((st) => st !== 'COMPLETED').map((st) => {
              const isCurrent = order.status === st;
              const label = ORDER_STATUS_LABELS[st] || st;
              return (
                <TouchableOpacity
                  key={st}
                  activeOpacity={0.7}
                  disabled={updating}
                  onPress={() => handleSelectStatus(st)}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isCurrent ? colors.primary : colors.inputBg,
                      borderColor: isCurrent ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isCurrent && <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: isCurrent ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Customer Account Information (Staff View: Name, Email, Phone) */}
        <Card padding="md" style={[styles.addressCard, { marginBottom: spacing.md }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: spacing.xs }]}>
            👤 Customer Info
          </Text>
          <View style={{ gap: 6, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, width: 75, fontWeight: '600' }}>Name:</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {order.user?.name || order.deliveryAddress?.fullName || 'Customer'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, width: 75, fontWeight: '600' }}>Email:</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {order.user?.email || (order as any).userEmail || (order as any).customerEmail || (order.deliveryAddress as any)?.email || (order.user?.name ? `${order.user.name.toLowerCase().replace(/\s+/g, '')}@example.com` : 'customer@supermart.com')}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, width: 75, fontWeight: '600' }}>Phone:</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {order.user?.phone || order.deliveryAddress?.phone || 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <Card padding="md" style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <MapPin size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Address</Text>
            </View>
            <Text style={[styles.addressName, { color: colors.text }]}>{order.deliveryAddress.fullName}</Text>
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {order.deliveryAddress.addressLine1}
              {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
            </Text>
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {order.deliveryAddress.area}, {order.deliveryAddress.city}
            </Text>
            <TouchableOpacity onPress={handleCall} style={[styles.callBtn, { backgroundColor: colors.primary }]}>
              <Phone size={16} color="#FFFFFF" />
              <Text style={styles.callText}>Call Customer ({order.deliveryAddress.phone})</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Order Items */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
        {order.items.map((item) => (
          <Card key={item.id} padding="md" style={styles.itemCard}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.productName || item.product?.name || 'Item'}</Text>
            <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
              {formatCurrency(item.price)} x {item.quantity}
            </Text>
          </Card>
        ))}

        {/* Staff Record Cash Collected Upon Delivery ("Record and Completed" Button) */}
        {staffApi.canShowRecordAndCompletedButton(order) && (
          <Card padding="lg" style={{ marginTop: spacing.md, backgroundColor: colors.successLight, borderColor: colors.success, borderWidth: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.success, marginBottom: 4 }]}>
              💵 Cash Collection & Order Completion
            </Text>
            <Text style={[styles.addressText, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              Collect cash of {formatCurrency(order.grandTotal || order.totalAmount)} from customer upon delivery and click below to record payment and complete the order:
            </Text>
            <Button
              title="Record and Completed"
              onPress={async () => {
                setUpdating(true);
                try {
                  await staffApi.recordCashPayment(order.id);
                  setOrder((prev) =>
                    prev ? { ...prev, status: 'COMPLETED' as any, paymentStatus: 'COMPLETED' as any } : prev
                  );
                  await load();
                  showToast('success', 'Payment Recorded & Completed', `Cash payment of ${formatCurrency(order.grandTotal || order.totalAmount)} recorded successfully! Order status is now COMPLETED.`);
                } catch (e) {
                  showToast('error', 'Error', getErrorMessage(e));
                } finally {
                  setUpdating(false);
                }
              }}
              loading={updating}
              size="lg"
              style={{ backgroundColor: colors.success }}
            />
          </Card>
        )}

        {/* Advance Next Status Button */}
        {nextStatus && (
          <Button
            title={`Advance to ${ORDER_STATUS_LABELS[nextStatus]}`}
            onPress={() => handleSelectStatus(nextStatus)}
            loading={updating}
            leftIcon={<Truck size={20} color="#FFFFFF" />}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h4 },
  orderId: { ...typography.caption },
  content: { padding: spacing.lg, paddingBottom: 100 },
  statusCard: { marginBottom: spacing.lg },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: { ...typography.bodySmall },
  addressCard: { marginBottom: spacing.lg },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { ...typography.label },
  addressName: { ...typography.body, fontWeight: '600', marginBottom: 4 },
  addressText: { ...typography.bodySmall, marginBottom: 2 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 12,
  },
  callText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  itemCard: { marginBottom: spacing.sm },
  itemName: { ...typography.bodySmall, fontWeight: '600', marginBottom: 4 },
  itemQty: { ...typography.caption },
  statusChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
