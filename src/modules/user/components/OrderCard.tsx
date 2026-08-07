import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  Eye,
  Download,
  ShoppingBag,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Card } from '../../common/Card';
import { StatusTimeline } from './StatusTimeline';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, PAYMENT_METHOD_LABELS } from '../../../shared/types/order.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  onViewReceipt?: (order: Order) => void;
  onDownloadReceipt?: (order: Order) => void;
}

export function OrderCard({ order, onPress, onViewReceipt, onDownloadReceipt }: OrderCardProps) {
  const { colors } = useTheme();

  // Normalize payment status
  const paymentStatus = (order.paymentStatus || '').toUpperCase().trim();

  const isPaid = ['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL'].includes(paymentStatus);
  const isRefunded = ['REFUNDED', 'REFUND', 'REFUND_SUCCESS', 'REFUNDED_SUCCESS'].includes(paymentStatus);
  const isFailed = ['FAILED', 'FAIL', 'PAYMENT_FAILED', 'DECLINED'].includes(paymentStatus) || (order.status === 'CANCELLED' && !isPaid && !isRefunded);
  const isPending = ['PENDING', 'WAITING', 'IN_PROGRESS', 'PROCESSING'].includes(paymentStatus) && !isFailed;

  // Badge styling
  let badgeLabel = 'UNPAID';
  let badgeBgColor = 'rgba(234,179,8,0.12)';
  let badgeBorderColor = '#EAB308';
  let badgeTextColor = '#EAB308';

  if (isPaid) {
    badgeLabel = 'PAID';
    badgeBgColor = 'rgba(34,197,94,0.12)';
    badgeBorderColor = '#22C55E';
    badgeTextColor = '#22C55E';
  } else if (isRefunded) {
    badgeLabel = 'REFUNDED';
    badgeBgColor = 'rgba(59,130,246,0.12)';
    badgeBorderColor = '#3B82F6';
    badgeTextColor = '#3B82F6';
  } else if (isFailed) {
    badgeLabel = 'FAILED';
    badgeBgColor = 'rgba(239,68,68,0.12)';
    badgeBorderColor = '#EF4444';
    badgeTextColor = '#EF4444';
  } else if (isPending) {
    badgeLabel = 'PENDING';
    badgeBgColor = 'rgba(234,179,8,0.12)';
    badgeBorderColor = '#EAB308';
    badgeTextColor = '#EAB308';
  }

  const isCompleted = order.status === 'COMPLETED';

  // Preview up to 3 items
  const previewItems = (order.items || []).slice(0, 3);
  const extraItemsCount = Math.max(0, (order.items || []).length - 3);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(order)} style={styles.cardTouchable}>
      <Card padding="md" style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        
        {/* Top Section */}
        <View>
          {/* Header: Order ID & Date + Badges */}
          <View style={styles.header}>
            <View style={styles.orderIdGroup}>
              <View style={[styles.orderRefBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.orderRefText, { color: colors.primary }]}>
                  #{order.orderId || order.orderNumber || order.id}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Calendar size={12} color={colors.textSecondary} />
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
            </View>

            {/* Status Badges */}
            <View style={styles.badgesColumn}>
              <View
                style={[
                  styles.paymentBadge,
                  {
                    backgroundColor: badgeBgColor,
                    borderColor: badgeBorderColor,
                  },
                ]}
              >
                <Text style={[styles.paymentBadgeText, { color: badgeTextColor }]}>
                  {badgeLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* Action alert if Delivered & Unpaid */}
          {order.status === 'DELIVERED' && !isPaid && (
            <View style={styles.statusRow}>
              <View style={{ flex: 1 }} />
              <View style={[styles.payNowTag, { backgroundColor: colors.primary }]}>
                <CreditCard size={12} color="#FFFFFF" />
                <Text style={styles.payNowTagText}>Pay Now</Text>
              </View>
            </View>
          )}

          {/* Items Summary Preview (Fixed height container) */}
          <View style={[styles.itemsPreviewBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            {previewItems.length > 0 ? (
              <>
                <View style={styles.itemsImagesRow}>
                  {previewItems.map((item, idx) => {
                    const imgUri = item.product?.images?.[0] || item.productImage;
                    return (
                      <View key={item.id || idx} style={[styles.itemImgWrap, { borderColor: colors.border }]}>
                        {imgUri ? (
                          <Image source={{ uri: imgUri }} style={styles.itemImg} resizeMode="cover" />
                        ) : (
                          <View style={[styles.itemImgPlaceholder, { backgroundColor: colors.surface }]}>
                            <ShoppingBag size={14} color={colors.textSecondary} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {extraItemsCount > 0 && (
                    <View style={[styles.extraItemsBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.extraItemsText, { color: colors.primary }]}>
                        +{extraItemsCount}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.itemsSummaryText, { color: colors.text }]} numberOfLines={1}>
                  {previewItems.map((i) => i.product?.name || i.productName || 'Item').join(', ')}
                  {extraItemsCount > 0 ? ` +${extraItemsCount} more` : ''}
                </Text>
              </>
            ) : (
              <Text style={[styles.itemsSummaryText, { color: colors.textSecondary }]}>
                View order item details
              </Text>
            )}
          </View>

          {/* Step Progress Timeline */}
          <View style={styles.timelineBox}>
            <StatusTimeline
              currentStatus={order.status}
              isCancelled={order.status === 'CANCELLED'}
              cancellationReason={order.cancellationReason}
              cancelledBy={(order as any).cancelledBy}
              mode="horizontal"
              statusHistory={order.statusHistory}
              assignedStaffName={order.assignedStaff?.user?.name}
              assignedStaffId={order.assignedStaffId}
            />
          </View>
        </View>

        {/* Bottom Section */}
        <View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Footer info: Total amount & Payment Method */}
          <View style={styles.footer}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Amount</Text>
              <Text style={[styles.totalPrice, { color: colors.primary }]}>
                {formatCurrency(order.grandTotal || order.totalAmount)}
              </Text>
            </View>

            <View style={styles.footerRight}>
              {(isCompleted || order.paymentMethod !== 'COD') && (
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <View style={[styles.paymentMethodPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <CreditCard size={12} color={colors.textSecondary} />
                    <Text style={[styles.paymentMethodText, { color: colors.textSecondary }]}>
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery' : (PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod)}
                    </Text>
                  </View>
                  {order.paymentMethod !== 'COD' && Boolean(order.transactionId) && (
                    <Text style={[styles.trxIdText, { color: colors.textSecondary }]}>
                      TrxID: {order.transactionId}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons Bar - Fixed Height Uniform Row */}
          <View style={[styles.actionsBar, { borderTopColor: colors.border }]}>
            {isCompleted ? (
              <View style={styles.receiptButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onViewReceipt?.(order);
                  }}
                  style={[styles.receiptBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Eye size={14} color={colors.primary} />
                  <Text style={[styles.receiptBtnText, { color: colors.primary }]}>Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onDownloadReceipt?.(order);
                  }}
                  style={[styles.receiptBtn, { backgroundColor: colors.primary }]}
                >
                  <Download size={14} color="#FFFFFF" />
                  <Text style={[styles.receiptBtnText, { color: '#FFFFFF' }]}>PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onPress(order)}
                  style={[styles.detailsBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                >
                  <Text style={[styles.detailsBtnText, { color: colors.text }]}>Details</Text>
                  <ChevronRight size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onPress(order)}
                style={[styles.viewDetailsFullBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Text style={[styles.viewDetailsFullText, { color: colors.primary }]}>View Order Details</Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardTouchable: {
    flex: 1,
    minHeight: 320,
  },
  card: {
    flex: 1,
    minHeight: 320,
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  orderIdGroup: {
    gap: 4,
  },
  orderRefBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  orderRefText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgesColumn: {
    alignItems: 'flex-end',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
    height: 26,
  },
  payNowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  payNowTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  itemsPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 42,
    paddingHorizontal: spacing.xs + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  itemsImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImgWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: -6,
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraItemsBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  extraItemsText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsSummaryText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  timelineBox: {
    marginVertical: spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs + 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalPrice: {
    ...typography.price,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trxIdText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsBar: {
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    height: 44,
    justifyContent: 'center',
  },
  receiptButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    height: 36,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  receiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  viewDetailsFullText: {
    fontSize: 13,
    fontWeight: '700',
  },
});