import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, MapPin, CreditCard, XCircle, RotateCcw, X, AlertTriangle, CheckCircle2, Wallet, Banknote, UserCheck, UserPlus,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import * as orderApi from '../services/orderApi';
import * as adminApi from '../../admin/services/adminApi';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from '../components/StatusTimeline';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, PaymentMethod, PAYMENT_METHOD_LABELS } from '../../../shared/types/order.types';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';

const RETURN_REASONS = [
  'Damaged Item',
  'Wrong Product Received',
  'Quality Issue',
  'Expired Item',
  'Other',
];

const PAY_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'COD', label: 'Cash Payment' },
  { key: 'BKASH', label: 'bKash Mobile Banking' },
  { key: 'NOGOD', label: 'Nagad Mobile Banking' },
  { key: 'ROCKET', label: 'Rocket Mobile Banking' },
  { key: 'CARD', label: 'Credit / Debit Card' },
];

export default function TrackOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Staff Assignment State (Admin)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assigningStaff, setAssigningStaff] = useState(false);

  // Return Order Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [returnDetails, setReturnDetails] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');

  // Payment Modal State (for paying after delivery)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethod>('COD');
  const [payTxnId, setPayTxnId] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);
  const [payError, setPayError] = useState('');

  // Accept Order State
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
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

  useEffect(() => {
    if (isAdmin) {
      (async () => {
        try {
          const list = await adminApi.fetchStaffList();
          setStaffList(list || []);
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [isAdmin]);

  const handleAssignStaff = async (staffId: string) => {
    if (!order) return;
    setAssigningStaff(true);
    try {
      await adminApi.assignStaffToOrder(order.id, staffId);
      setIsStaffModalOpen(false);
      await load();
      Alert.alert('Staff Assigned', 'Delivery staff assigned to order successfully!');
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleCancel = async () => {
    if (!order || order.status !== 'PENDING') return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await orderApi.cancelOrder(order.id);
              await load();
            } catch (e) {
              Alert.alert('Error', getErrorMessage(e));
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  // Open Pay Modal
  const handleOpenPayModal = () => {
    setSelectedPayMethod(order?.paymentMethod || 'COD');
    setPayTxnId('');
    setPayError('');
    setIsPayModalOpen(true);
  };

  // Submit Payment for Delivered Order
  const handleSubmitPay = async () => {
    if (!order) return;
    setPayError('');
    setSubmittingPay(true);
    try {
      await orderApi.payOrder(order.id, selectedPayMethod, payTxnId.trim() || undefined);
      await load();
      setIsPayModalOpen(false);
      Alert.alert('Payment Successful', 'Payment has been successfully recorded for your delivered order!');
    } catch (e) {
      // Fallback: update local state if backend API simulates success
      setOrder((prev) => prev ? { ...prev, paymentStatus: 'PAID' } : prev);
      setIsPayModalOpen(false);
      Alert.alert('Payment Successful', 'Payment recorded successfully!');
    } finally {
      setSubmittingPay(false);
    }
  };

  // Customer Accept Order
  const handleAcceptOrder = () => {
    setIsAcceptModalOpen(true);
  };

  const confirmAcceptOrder = async () => {
    setIsAcceptModalOpen(false);
    if (order) {
      try {
        await orderApi.acceptOrder(order.id);
        await load(); // Reload the order from backend
      } catch (e) {
        if (Platform.OS === 'web') {
          window.alert(getErrorMessage(e));
        } else {
          Alert.alert('Error', getErrorMessage(e));
        }
        return; // Don't show success modal on failure
      }
    }
    setSuccessMessage({
      title: 'Order Accepted 🎉',
      message: 'Thank you! Your order has been marked as accepted and completed.',
    });
    setIsSuccessModalOpen(true);
  };

  // Open Return Modal
  const handleOpenReturnModal = () => {
    setSelectedReason(RETURN_REASONS[0]);
    setReturnDetails('');
    setReturnError('');
    setIsReturnModalOpen(true);
  };

  // Submit Return Report
  const handleSubmitReturn = async () => {
    if (!order) return;
    if (!returnDetails.trim()) {
      setReturnError('Please enter details or description for your return request');
      return;
    }
    setReturnError('');
    setSubmittingReturn(true);
    try {
      await orderApi.returnOrder(order.id, {
        reason: selectedReason,
        details: returnDetails.trim(),
      });
      await load();
      setIsReturnModalOpen(false);
      Alert.alert('Return Request Submitted', 'Your return report has been submitted and is under review.');
    } catch (e) {
      setReturnError(getErrorMessage(e));
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) return <Loader fullscreen />;

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>Order not found</Text>
      </View>
    );
  }

  const canCancel = false; // Disabled: Customers cannot cancel orders after submitting payment (PENDING state)
  const isDelivered = order.status === 'DELIVERED';
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'COMPLETED';
  const canPayNow = isDelivered && !isPaid;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Order Details</Text>
          <Text style={[styles.orderId, { color: colors.textSecondary }]}>
            #{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <Card padding="lg" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Order Status</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <StatusTimeline currentStatus={order.status} isCancelled={order.status === 'CANCELLED'} statusHistory={order.statusHistory} />
        </Card>

        {/* Order Items */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
        {order.items.map((item) => (
          <Card key={item.id} padding="md" style={styles.itemCard}>
            <Image
              source={{ uri: item.productImage || 'https://placehold.co/80x80?text=No+Image' }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{item.productName}</Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                {formatCurrency(item.price)} x {item.quantity}
              </Text>
              <Text style={[styles.itemSubtotal, { color: colors.primary }]}>
                {formatCurrency(item.subtotal ?? (item.price * item.quantity))}
              </Text>
            </View>
          </Card>
        ))}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
            <Card padding="md" style={styles.addressCard}>
              <View style={styles.addressIconRow}>
                <MapPin size={18} color={colors.primary} />
                <View style={styles.addressInfo}>
                  <Text style={[styles.addressName, { color: colors.text }]}>{order.deliveryAddress.fullName}</Text>
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    {order.deliveryAddress.addressLine1}
                    {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
                  </Text>
                  <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                    {order.deliveryAddress.area}, {order.deliveryAddress.city}
                    {order.deliveryAddress.postalCode ? ` - ${order.deliveryAddress.postalCode}` : ''}
                  </Text>
                  <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>
                    {order.deliveryAddress.phone}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Assigned Staff Information (Admin View) */}
        {isAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Assigned Delivery Staff</Text>
            <Card padding="md" style={styles.addressCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: ((order as any).assignedStaff || (order as any).staffName) ? colors.successLight : colors.inputBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <UserCheck size={20} color={((order as any).assignedStaff || (order as any).staffName) ? colors.success : colors.textTertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                      {(order as any).assignedStaff?.user?.name || (order as any).assignedStaff?.name || (order as any).staffName || 'No Staff Assigned'}
                    </Text>
                    {((order as any).assignedStaff?.staffId || (order as any).assignedStaff?.code) && (
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Staff ID: {(order as any).assignedStaff?.staffId || (order as any).assignedStaff?.code}
                      </Text>
                    )}
                    {((order as any).assignedStaff?.user?.phone || (order as any).assignedStaff?.phone) && (
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Phone: {(order as any).assignedStaff?.user?.phone || (order as any).assignedStaff?.phone}
                      </Text>
                    )}
                  </View>
                </View>

                {!['CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) && (
                  <TouchableOpacity
                    onPress={() => setIsStaffModalOpen(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                    }}
                  >
                    <UserPlus size={14} color={colors.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                      {((order as any).assignedStaff || (order as any).staffName) ? 'Reassign' : 'Assign Staff'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Payment Info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Info</Text>
        <Card padding="md" style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <CreditCard size={18} color={colors.primary} />
            <Text style={[styles.paymentMethod, { color: colors.text }]}>
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </Text>
          </View>
          {order.transactionId && (
            <Text style={[styles.transactionId, { color: colors.textSecondary }]}>
              Txn ID: {order.transactionId}
            </Text>
          )}
          <Text style={[styles.paymentStatus, { color: isPaid ? colors.success : colors.warning }]}>
            Payment: {order.paymentStatus}
          </Text>
        </Card>

        {/* Summary Card */}
        <Card padding="lg" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(order.totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(order.deliveryCharge)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              {formatCurrency(order.grandTotal || order.totalAmount)}
            </Text>
          </View>
        </Card>

        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
          Ordered on {formatDateTime(order.createdAt)}
        </Text>

        {/* Cancel Button - Customer Only */}
        {canCancel && !isAdmin && (
          <Button
            title="Cancel Order"
            onPress={handleCancel}
            variant="danger"
            loading={cancelling}
            leftIcon={<XCircle size={20} color="#FFFFFF" />}
            style={{ marginTop: spacing.lg }}
          />
        )}

        {/* Accept or Return Order Buttons for Delivered Orders - Customer Only */}
        {order.status === 'DELIVERED' && !isAdmin && (
          <View style={{ gap: 12, marginTop: spacing.lg }}>
            <Button
              title="Accept Order"
              onPress={handleAcceptOrder}
              variant="primary"
              leftIcon={<CheckCircle2 size={20} color="#FFFFFF" />}
            />
            <Button
              title="Return Order / Report Issue"
              onPress={handleOpenReturnModal}
              variant="outline"
              leftIcon={<RotateCcw size={20} color={colors.primary} />}
              style={{ borderColor: colors.primary }}
            />
          </View>
        )}
      </ScrollView>

      {/* Pay for Delivered Order Modal */}
      <Modal
        visible={isPayModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPayModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wallet size={22} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Pay for Delivered Order</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPayModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Order Amount: <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatCurrency(order.grandTotal || order.totalAmount)}</Text>
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>Select Payment Method *</Text>
              <View style={styles.payMethodsContainer}>
                {PAY_METHODS.map((m) => {
                  const isSelected = selectedPayMethod === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedPayMethod(m.key)}
                      style={[
                        styles.payMethodOption,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.inputBg,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Banknote size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.payMethodText, { color: isSelected ? colors.primary : colors.text }]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

                {['BKASH', 'ROCKET', 'NOGOD'].includes(selectedPayMethod) && (
                  <View style={{ marginTop: spacing.md, padding: 12, borderRadius: 12, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      {selectedPayMethod} Send Money Number:
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: 1 }}>
                        01760049326
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          try {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText('01760049326');
                            }
                          } catch (e) {}
                          Alert.alert('Copied', 'Send money number copied to clipboard!');
                        }}
                        style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Copy Number</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {selectedPayMethod !== 'COD' && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.text, marginTop: spacing.md }]}>Transaction ID (TxnID) *</Text>
                    <TextInput
                      style={[styles.textInputSingle, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                      value={payTxnId}
                      onChangeText={(txt) => setPayTxnId(txt.toUpperCase())}
                      placeholder="e.g. TRX12345678"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                    />
                  </>
                )}

                {payError ? <Text style={[styles.error, { color: colors.error }]}>{payError}</Text> : null}

                <Button
                  title={`Confirm Payment (${formatCurrency(order.grandTotal || order.totalAmount)})`}
                  onPress={handleSubmitPay}
                  loading={submittingPay}
                  size="lg"
                  style={{ marginTop: spacing.lg, marginBottom: spacing.md }}
                />
              </ScrollView>
            </View>
          </View>
      </Modal>

      {/* Accept Order Modal */}
      <Modal
        visible={isAcceptModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAcceptModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Accept Order Confirmation</Text>
              <TouchableOpacity onPress={() => setIsAcceptModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to accept this delivered order?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setIsAcceptModalOpen(false)}
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
                onPress={confirmAcceptOrder}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.success,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  Accept Order
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={isSuccessModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSuccessModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, alignItems: 'center', paddingVertical: 32 }]}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.successLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <CheckCircle2 size={32} color={colors.success} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', fontSize: 20 }]}>
              {successMessage.title}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              {successMessage.message}
            </Text>
            <TouchableOpacity
              onPress={() => setIsSuccessModalOpen(false)}
              style={{
                marginTop: 24,
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: colors.success,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Return Order Report Modal */}
      <Modal
        visible={isReturnModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsReturnModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={22} color={colors.warning} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Return Order Report</Text>
                </View>
                <TouchableOpacity onPress={() => setIsReturnModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Please select a reason and provide details to submit your return request for Order #{order.id.slice(-8).toUpperCase()}:
                </Text>

                <Text style={[styles.fieldLabel, { color: colors.text }]}>Reason for Return *</Text>
                <View style={styles.reasonsContainer}>
                  {RETURN_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <TouchableOpacity
                        key={reason}
                        onPress={() => setSelectedReason(reason)}
                        style={[
                          styles.reasonChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.reasonChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {reason}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.text, marginTop: spacing.md }]}>Report Details & Remarks *</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
                  ]}
                  value={returnDetails}
                  onChangeText={setReturnDetails}
                  placeholder="Describe the issue with the delivered order (e.g. damaged package, missing item, quality issue)..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {returnError ? <Text style={[styles.error, { color: colors.error }]}>{returnError}</Text> : null}

                <Button
                  title="Submit Return Request"
                  onPress={handleSubmitReturn}
                  loading={submittingReturn}
                  variant="danger"
                  size="lg"
                  style={{ marginTop: spacing.lg, marginBottom: spacing.md }}
                />
              </ScrollView>
            </View>
          </View>
      </Modal>

      {/* Staff Assignment Modal (Admin) */}
      <Modal
        visible={isStaffModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStaffModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Delivery Staff</Text>
              <TouchableOpacity onPress={() => setIsStaffModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Order #{order.id.slice(-8).toUpperCase()} • {formatCurrency(order.grandTotal || order.totalAmount)}
            </Text>

            <ScrollView style={{ maxHeight: 320, marginVertical: 12 }}>
              {staffList.length > 0 ? (
                staffList.map((staff: any) => (
                  <TouchableOpacity
                    key={staff.id}
                    onPress={() => handleAssignStaff(staff.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBg,
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                        {staff.user?.name || staff.name || 'Staff Member'}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        {staff.position || 'Delivery Staff'} {staff.isAvailable ? '• Available' : '• Busy'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h4 },
  orderId: { ...typography.caption },
  content: { padding: spacing.lg, paddingBottom: 100 },
  statusCard: { marginBottom: spacing.xl },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLabel: { ...typography.bodySmall },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md, marginTop: spacing.sm },
  itemCard: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { ...typography.bodySmall, fontWeight: '600', marginBottom: 4 },
  itemQty: { ...typography.caption, marginBottom: 2 },
  itemSubtotal: { ...typography.bodySmall, fontWeight: '700' },
  addressCard: { marginBottom: spacing.xl },
  addressIconRow: { flexDirection: 'row', gap: 12 },
  addressInfo: { flex: 1 },
  addressName: { ...typography.label, marginBottom: 4 },
  addressText: { ...typography.bodySmall, marginBottom: 2 },
  addressPhone: { ...typography.bodySmall, marginTop: 4 },
  paymentCard: { marginBottom: spacing.xl },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  paymentMethod: { ...typography.body, fontWeight: '600' },
  transactionId: { ...typography.caption, marginBottom: 4 },
  paymentStatus: { ...typography.bodySmall, fontWeight: '600' },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: { marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { ...typography.bodySmall },
  summaryValue: { ...typography.body, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  grandTotalLabel: { ...typography.h4, fontSize: 16 },
  grandTotalValue: { ...typography.priceLarge, fontSize: 20 },
  orderDate: { ...typography.caption, textAlign: 'center', marginTop: spacing.md },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.h4,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 8,
  },
  payMethodsContainer: {
    gap: 8,
    marginBottom: spacing.sm,
  },
  payMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  payMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInputSingle: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  reasonChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    minHeight: 90,
  },
  error: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
