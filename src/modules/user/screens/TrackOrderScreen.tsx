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
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, MapPin, CreditCard, XCircle, RotateCcw, X, AlertTriangle, CheckCircle2, Wallet, Banknote, UserCheck, UserPlus, FileText, Download,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import * as orderApi from '../services/orderApi';
import * as adminApi from '../../admin/services/adminApi';
import { showToast } from '../../common/Toast';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from '../components/StatusTimeline';
import { ReceiptModal } from '../components/ReceiptModal';
import { downloadReceiptPdf } from '../../../shared/utils/receiptPdfGenerator';
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
];

export default function TrackOrderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCodConfirmed, setIsCodConfirmed] = useState(false);

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

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Admin Action Confirmation Modals State
  const [isAdminApproveModalOpen, setIsAdminApproveModalOpen] = useState(false);
  const [isAdminRejectModalOpen, setIsAdminRejectModalOpen] = useState(false);
  const [adminRejectReason, setAdminRejectReason] = useState('Order rejected by Admin');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  // Accept Order State
  const [acceptingOrder, setAcceptingOrder] = useState(false);
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

  useEffect(() => {
    if (order?.id && Platform.OS === 'web') {
      try {
        if (localStorage.getItem(`cod_confirmed_${order.id}`) === 'true') {
          setIsCodConfirmed(true);
        }
      } catch (e) {}
    }
  }, [order?.id]);

  const handleAssignStaff = async (staffId: string) => {
    if (!order) return;
    setAssigningStaff(true);
    try {
      await adminApi.assignStaffToOrder(order.id, staffId);
      setIsStaffModalOpen(false);
      await load();
      showToast('success', 'Staff Assigned', 'Delivery staff assigned to order successfully!');
    } catch (e) {
      showToast('error', 'Error', getErrorMessage(e));
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleOpenCancelModal = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.id, 'Order cancelled by customer');
      setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' as any, paymentStatus: 'FAILED' as any, cancellationReason: 'Order cancelled by customer', cancelledBy: 'CUSTOMER' } : prev));
      setIsCancelModalOpen(false);
      await load();
      showToast('success', 'Order Cancelled', 'Order cancelled successfully.');
    } catch (e) {
      setIsCancelModalOpen(false);
      showToast('error', 'Error', getErrorMessage(e));
    } finally {
      setCancelling(false);
    }
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
      if (selectedPayMethod === 'COD') {
        const txnId = `CASH-USER-PAID-${Date.now()}`;
        await orderApi.payOrder(order.id, 'COD', txnId);
        await load();
        if (Platform.OS === 'web') {
          try {
            localStorage.setItem(`cod_confirmed_${order.id}`, 'true');
          } catch (e) {}
        }
        setIsCodConfirmed(true);
        setIsPayModalOpen(false);
        setSuccessMessage({
          title: 'Cash Payment Confirmed 💵',
          message: 'Your payment status is now updated to PAID. Delivery staff will record cash collection and mark your order as Completed.',
        });
        setIsSuccessModalOpen(true);
      } else {
        // Mobile Banking (bKash / Rocket / Nagad) — submit TxnID for Admin verification
        if (!payTxnId.trim()) {
          setPayError('Please enter your Transaction ID (TxnID)');
          setSubmittingPay(false);
          return;
        }
        await orderApi.payOrder(order.id, selectedPayMethod, payTxnId.trim());
        await load();
        setIsPayModalOpen(false);
        setSuccessMessage({
          title: 'Transaction ID Submitted 📱',
          message: 'Your transaction ID has been submitted. Admin will verify your payment and mark your order as Completed.',
        });
        setIsSuccessModalOpen(true);
      }
    } catch (e) {
      setIsPayModalOpen(false);
      showToast('error', 'Payment Error', getErrorMessage(e));
    } finally {
      setSubmittingPay(false);
    }
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
      showToast('success', 'Return Request Submitted', 'Your return report has been submitted and is under review.');
    } catch (e) {
      setReturnError(getErrorMessage(e));
    } finally {
      setSubmittingReturn(false);
    }
  };

  // Accept Order — POST /orders/:id/accept
  const handleAcceptOrder = async () => {
    if (!order) return;
    Alert.alert(
      'Accept Order',
      'Confirm that you have received the order and everything is in order?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, Accept',
          onPress: async () => {
            setAcceptingOrder(true);
            try {
              await orderApi.acceptOrder(order.id);
              await load();
              setSuccessMessage({
                title: 'Order Accepted 🎉',
                message: 'Thank you! Your order has been marked as Completed.',
              });
              setIsSuccessModalOpen(true);
            } catch (e) {
              showToast('error', 'Error', getErrorMessage(e));
            } finally {
              setAcceptingOrder(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader fullscreen />;

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>Order not found</Text>
      </View>
    );
  }

  const normalizedStatus = (order.status || '').toUpperCase().trim();
  const normalizedPaymentStatus = (order.paymentStatus || '').toUpperCase().trim();

  const canCancel = normalizedStatus === 'PENDING' && !isAdmin;
  const isDelivered = normalizedStatus === 'DELIVERED';
  const isCompleted = normalizedStatus === 'COMPLETED';
  const isPaid = ['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL'].includes(normalizedPaymentStatus);
  const isRefunded = ['REFUNDED', 'REFUND', 'REFUND_SUCCESS'].includes(normalizedPaymentStatus);
  const isFailed = ['FAILED', 'FAIL', 'PAYMENT_FAILED', 'DECLINED'].includes(normalizedPaymentStatus) || (normalizedStatus === 'CANCELLED' && !isPaid && !isRefunded);
  const displayPaymentStatus = isFailed ? 'FAILED' : normalizedPaymentStatus || 'UNPAID';
  const isCodActive =
    isCodConfirmed ||
    (order.notes || '').includes('COD_CONFIRMED') ||
    (order.notes || '').includes('COD_PAYMENT_SELECTED') ||
    (Platform.OS === 'web' && order?.id ? localStorage.getItem(`cod_confirmed_${order.id}`) === 'true' : false);
  const canPayNow = isDelivered && !isPaid && !isCodActive;
  const canAcceptNow = isDelivered && isPaid; // Accept = finalize after payment complete
  const canReturn = isDelivered && !isPaid && !['RETURN_REQUESTED', 'RETURNED', 'COMPLETED'].includes(normalizedStatus);

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
            #{order.orderId || order.orderNumber || order.id}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <Card padding="lg" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Order Status</Text>
            <OrderStatusBadge status={order.status} assignedStaff={order.assignedStaff} assignedStaffId={order.assignedStaffId} />
          </View>
          <StatusTimeline
            currentStatus={order.status}
            isCancelled={order.status === 'CANCELLED'}
            cancellationReason={order.cancellationReason}
            cancelledBy={(order as any).cancelledBy}
            statusHistory={order.statusHistory}
            assignedStaffName={order.assignedStaff?.user?.name}
            assignedStaffId={order.assignedStaffId}
          />

          {/* COMPLETED Order Money Receipt Action Buttons */}
          {isCompleted && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsReceiptModalOpen(true)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '35',
                  borderWidth: 1,
                  gap: 6,
                }}
              >
                <FileText size={16} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>View Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => downloadReceiptPdf(order, user)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  gap: 6,
                }}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Download Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Order Items */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
        {order.items.map((item) => {
          // Support both nested backend format (item.product.name) and legacy flat format
          const itemImage = item.product?.images?.[0] || item.productImage || 'https://placehold.co/80x80?text=No+Image';
          const itemName = item.product?.name || item.productName || 'Product';
          const itemSubtotal = item.subtotal ?? (item.price * item.quantity);
          return (
            <Card key={item.id} padding="md" style={styles.itemCard}>
              <Image
                source={{ uri: itemImage }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{itemName}</Text>
                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                  {formatCurrency(item.price)} x {item.quantity}
                </Text>
                <Text style={[styles.itemSubtotal, { color: colors.primary }]}>
                  {formatCurrency(itemSubtotal)}
                </Text>
              </View>
            </Card>
          );
        })}

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

        {/* Customer Account Information */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Account Information</Text>
        <Card padding="md" style={styles.addressCard}>
          <View style={{ gap: 8 }}>
            {isAdmin && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary, width: 80, fontWeight: '600' }}>User ID:</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                  {order.userId || order.user?.id || 'N/A'}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, width: 80, fontWeight: '600' }}>Name:</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {order.user?.name || order.deliveryAddress?.fullName || 'Customer'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, width: 80, fontWeight: '600' }}>Email:</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {order.user?.email || 'N/A'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, width: 80, fontWeight: '600' }}>Phone:</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {order.user?.phone || order.deliveryAddress?.phone || 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

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

                {!['PENDING', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(order.status) && !((order as any).assignedStaff || (order as any).staffName || order.assignedStaffId) && (
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
                      Assign Staff
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Payment Info (Hidden for Staff until Order Status is COMPLETED) */}
        {(!isStaff || order.status === 'COMPLETED') && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Info</Text>
            <Card padding="md" style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <CreditCard size={18} color={colors.primary} />
                {(order.status === 'COMPLETED' || order.paymentMethod !== 'COD') && (
                  <Text style={[styles.paymentMethod, { color: colors.text }]}>
                    Payment Method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : (PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod)}
                  </Text>
                )}
              </View>
              {order.paymentMethod !== 'COD' && Boolean(order.transactionId) && (
                <Text style={[styles.transactionId, { color: colors.textSecondary }]}>
                  Transaction ID: {order.transactionId}
                </Text>
              )}
              <Text style={[styles.paymentStatus, { color: isPaid ? colors.success : colors.warning }]}>
                Payment: {displayPaymentStatus}
              </Text>
            </Card>
          </>
        )}

        {/* Comprehensive Price Breakdown Card */}
        {(() => {
          let originalSubtotal = 0;
          let discountedSubtotal = 0;

          (order.items || []).forEach((item) => {
            const qty = item.quantity || 1;
            const prod = item.product as any;
            const itemPaidPrice = item.price ?? (item.subtotal ? item.subtotal / qty : 0);
            const prodRegPrice = prod?.price || prod?.originalPrice || itemPaidPrice;
            const prodDiscPrice = prod?.discountPrice ?? (itemPaidPrice < prodRegPrice ? itemPaidPrice : prodRegPrice);
            
            const regPrice = Math.max(prodRegPrice, itemPaidPrice);
            const discPrice = Math.min(prodDiscPrice, itemPaidPrice);

            originalSubtotal += regPrice * qty;
            discountedSubtotal += discPrice * qty;
          });

          const totalProductSavings = Math.max(0, originalSubtotal - discountedSubtotal);
          const rawSubtotal = discountedSubtotal > 0 ? discountedSubtotal : (order.totalAmount || 0);
          const deliveryFee = rawSubtotal >= 2000 ? 0 : (order.deliveryCharge ?? 60);
          const grandTotalVal = order.grandTotal ?? (rawSubtotal + deliveryFee);

          return (
            <Card padding="lg" style={styles.summaryCard}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 }}>
                Price Breakdown
              </Text>

              {/* Itemized Products */}
              <View style={{ gap: 6, marginBottom: 6 }}>
                {(order.items || []).map((item, idx) => {
                  const qty = item.quantity || 1;
                  const prod = item.product as any;
                  const itemPaidPrice = item.price ?? (item.subtotal ? item.subtotal / qty : 0);
                  const prodRegPrice = prod?.price || prod?.originalPrice || itemPaidPrice;
                  const prodDiscPrice = prod?.discountPrice ?? (itemPaidPrice < prodRegPrice ? itemPaidPrice : prodRegPrice);
                  
                  const regPrice = Math.max(prodRegPrice, itemPaidPrice);
                  const discPrice = Math.min(prodDiscPrice, itemPaidPrice);
                  const hasDiscount = discPrice < regPrice;

                  return (
                    <View key={item.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {idx + 1}. {item.product?.name || item.productName || 'Product'} ({qty}x)
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {hasDiscount && (
                          <Text style={{ fontSize: 11, color: colors.textTertiary, textDecorationLine: 'line-through' }}>
                            {formatCurrency(regPrice * qty)}
                          </Text>
                        )}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: hasDiscount ? colors.primary : colors.text }}>
                          {formatCurrency(discPrice * qty)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items Regular Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(originalSubtotal > 0 ? originalSubtotal : rawSubtotal)}
                </Text>
              </View>

              {totalProductSavings > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#10B981', fontWeight: '600' }]}>Product Discount Savings</Text>
                  <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: '700' }]}>
                    -{formatCurrency(totalProductSavings)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Charge</Text>
                <Text style={[styles.summaryValue, { color: deliveryFee === 0 ? '#10B981' : colors.text }]}>
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total Amount Paid</Text>
                <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
                  {formatCurrency(grandTotalVal)}
                </Text>
              </View>
            </Card>
          );
        })()}

        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
          Ordered on {formatDateTime(order.createdAt)}
        </Text>

        {/* Admin Action Card (Order Details Page) */}
        {isAdmin && (
          (() => {
            const hasTxnId = order.paymentMethod !== 'COD' && Boolean(order.transactionId && order.transactionId.trim().length > 0);
            const isPending = normalizedStatus === 'PENDING';
            const isNotFinished = !['COMPLETED', 'CANCELLED', 'RETURNED'].includes(normalizedStatus);

            const showApproveOrVerify = isNotFinished && (isPending || (hasTxnId && normalizedPaymentStatus !== 'COMPLETED'));
            const showReject = isNotFinished && (isPending || hasTxnId);

            if (!showApproveOrVerify && !showReject && order.paymentMethod === 'COD') return null;

            return (
              <Card padding="md" style={{ marginTop: spacing.lg, gap: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  Admin Actions
                </Text>

                {order.paymentMethod !== 'COD' && hasTxnId ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.inputBg,
                    padding: 10,
                    borderRadius: radius.md,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      Payment Method: {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                    </Text>
                    <View style={{
                      backgroundColor: colors.primary + '15',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>
                        Transaction ID: {order.transactionId}
                      </Text>
                    </View>
                  </View>
                ) : order.paymentMethod !== 'COD' ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.inputBg,
                    padding: 10,
                    borderRadius: radius.md,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      Payment Method: {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.warning, fontWeight: '600' }}>
                      ⏳ Awaiting Payment
                    </Text>
                  </View>
                ) : null}

                {(showApproveOrVerify || showReject) && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    {showApproveOrVerify && (
                      <TouchableOpacity
                        onPress={() => setIsAdminApproveModalOpen(true)}
                        style={{
                          flex: 1,
                          backgroundColor: '#10B981',
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                          {isPending
                            ? '✓ Confirm Order'
                            : hasTxnId
                            ? '✓ Verify TxnID & Complete'
                            : '✓ Complete Order'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {showReject && (
                      <TouchableOpacity
                        onPress={() => {
                          setAdminRejectReason('Order rejected by Admin');
                          setIsAdminRejectModalOpen(true);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#EF4444',
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                          ✕ Reject & Cancel
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card>
            );
          })()
        )}

        {/* Cancel Button - Customer Only */}
        {canCancel && !isAdmin && (
          <Button
            title="Cancel Order"
            onPress={handleOpenCancelModal}
            variant="danger"
            loading={cancelling}
            leftIcon={<XCircle size={20} color="#FFFFFF" />}
            style={{ marginTop: spacing.lg }}
          />
        )}

        {/* Delivered / Completed Order Actions */}
        {(isDelivered || isCompleted) && !isAdmin && (
          <View style={{ gap: 12, marginTop: spacing.lg }}>
            {isCodActive && isDelivered && !isCompleted && (
              <View style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.primary,
                borderWidth: 1.5,
                padding: 14,
                borderRadius: 14,
                gap: 10,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Banknote size={24} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {order.paymentStatus === 'PAID' ? 'Cash Payment Submitted 💵' : 'Cash Payment 💵'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {order.paymentStatus === 'PAID'
                        ? 'You submitted cash payment. Delivery staff will record and complete your order.'
                        : 'Hand cash to the delivery staff and click below to confirm your cash payment.'}
                    </Text>
                  </View>
                </View>

                {order.paymentStatus !== 'PAID' && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await orderApi.payOrder(order.id, 'COD', `CASH-USER-PAID-${Date.now()}`);
                        await load();
                        showToast('success', 'Cash Payment Confirmed', 'Payment status updated to PAID! Delivery staff will record and complete your order.');
                      } catch (err: any) {
                        showToast('error', 'Error', getErrorMessage(err));
                      }
                    }}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: radius.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                      💵 Confirm Cash Payment (Mark as PAID)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {canPayNow && (
              <Button
                title={`Pay Now (${formatCurrency(order.grandTotal || order.totalAmount)})`}
                onPress={handleOpenPayModal}
                variant="primary"
                leftIcon={<Wallet size={20} color="#FFFFFF" />}
              />
            )}
            {canReturn && (
              <Button
                title="Return Request / Report Issue"
                onPress={handleOpenReturnModal}
                variant="outline"
                leftIcon={<RotateCcw size={20} color={colors.primary} />}
                style={{ borderColor: colors.primary }}
              />
            )}
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
                          showToast('info', 'Copied', 'Send money number copied to clipboard!');
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
                  Please select a reason and provide details to submit your return request for Order #{order.orderId || order.orderNumber || order.id}:
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
              Order #{order.orderId || order.orderNumber || order.id} • {formatCurrency(order.grandTotal || order.totalAmount)}
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
      {/* Cancel Order Confirmation Modal */}
      <Modal
        visible={isCancelModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCancelModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <XCircle size={22} color={colors.error} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Cancel Order</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCancelModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: spacing.md }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 }}>
                Are you sure you want to cancel this order? This action cannot be undone.
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setIsCancelModalOpen(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.inputBg,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>No, Keep Order</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmCancel}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.error,
                    alignItems: 'center',
                    opacity: cancelling ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Approve / Verify Confirmation Modal */}
      {isAdmin && order && (
        <Modal
          visible={isAdminApproveModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAdminApproveModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, padding: 20, borderRadius: 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {normalizedStatus === 'PENDING'
                    ? 'Confirm Order'
                    : order.paymentMethod !== 'COD' && Boolean(order.transactionId)
                    ? 'Verify TxnID & Complete'
                    : 'Complete Order'}
                </Text>
                <TouchableOpacity onPress={() => setIsAdminApproveModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginTop: 8 }]}>
                {normalizedStatus === 'PENDING'
                  ? 'Confirm this pending order so staff can be assigned for delivery? The customer will be notified.'
                  : order.paymentMethod !== 'COD' && Boolean(order.transactionId)
                  ? `Verify transaction ID "${order.transactionId}" and mark this order as COMPLETED?`
                  : 'Mark this order as COMPLETED?'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => setIsAdminApproveModalOpen(false)}
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
                  onPress={async () => {
                    setIsAdminSubmitting(true);
                    try {
                      const hasTxnId = order.paymentMethod !== 'COD' && Boolean(order.transactionId && order.transactionId.trim().length > 0);
                      if (normalizedStatus === 'PENDING') {
                        await adminApi.updateOrderStatus(order.id, 'CONFIRMED');
                        showToast('success', 'Order Confirmed', 'Order status updated to CONFIRMED!');
                      } else if (hasTxnId) {
                        await adminApi.verifyPayment(order.id, true);
                        showToast('success', 'Order Completed', 'Payment & TxnID Verified — Order is now COMPLETED!');
                      } else {
                        await adminApi.updateOrderStatus(order.id, 'COMPLETED');
                        showToast('success', 'Order Completed', 'Order Status updated to COMPLETED!');
                      }
                      setIsAdminApproveModalOpen(false);
                      await load();
                    } catch (e) {
                      showToast('error', 'Error', getErrorMessage(e));
                    } finally {
                      setIsAdminSubmitting(false);
                    }
                  }}
                  disabled={isAdminSubmitting}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.success,
                    opacity: isAdminSubmitting ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>
                    {isAdminSubmitting ? 'Processing...' : '✓ Confirm & Proceed'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Admin Reject Confirmation Modal */}
      {isAdmin && order && (
        <Modal
          visible={isAdminRejectModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAdminRejectModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, padding: 20, borderRadius: 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reject & Cancel Order</Text>
                <TouchableOpacity onPress={() => setIsAdminRejectModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, marginTop: 8, marginBottom: 12 }]}>
                Are you sure you want to reject this order / transaction? The order will be cancelled and the customer notified.
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: 10,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  marginBottom: 16,
                }}
                placeholder="Reason for rejection..."
                placeholderTextColor={colors.textSecondary}
                value={adminRejectReason}
                onChangeText={setAdminRejectReason}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => setIsAdminRejectModalOpen(false)}
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
                  onPress={async () => {
                    setIsAdminSubmitting(true);
                    try {
                      const hasTxnId = order.paymentMethod !== 'COD' && Boolean(order.transactionId && order.transactionId.trim().length > 0);
                      const reason = adminRejectReason.trim() ? `Order cancelled by admin: ${adminRejectReason.trim()}` : 'Order cancelled by admin';
                      if (hasTxnId) {
                        await adminApi.verifyPayment(order.id, false, reason);
                      } else {
                        await adminApi.updateOrderStatus(order.id, 'CANCELLED', reason);
                      }
                      setIsAdminRejectModalOpen(false);
                      await load();
                      showToast('success', 'Order Rejected', 'Order Rejected & Cancelled successfully.');
                    } catch (e) {
                      showToast('error', 'Error', getErrorMessage(e));
                    } finally {
                      setIsAdminSubmitting(false);
                    }
                  }}
                  disabled={isAdminSubmitting}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.error,
                    opacity: isAdminSubmitting ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>
                    {isAdminSubmitting ? 'Rejecting...' : '✕ Reject & Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Official Money Receipt Modal */}
      <ReceiptModal
        visible={isReceiptModalOpen}
        order={order}
        user={user}
        onClose={() => setIsReceiptModalOpen(false)}
      />
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
