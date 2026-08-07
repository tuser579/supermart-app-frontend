import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FileText, Printer, Download, X, User, MapPin, ShoppingBag, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Order } from '../../../shared/types/order.types';
import { User as AuthUser } from '../../../shared/types/auth.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { printReceiptPdf, downloadReceiptPdf } from '../../../shared/utils/receiptPdfGenerator';
import { spacing, radius } from '../../../shared/theme/spacing';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  user?: AuthUser | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  onClose,
  order,
  user,
}) => {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();

  if (!order) return null;

  const accountId = user?.id || order.userId || 'N/A';
  const accountName = user?.name || order.user?.name || order.deliveryAddress?.fullName || 'Valued Customer';
  const accountEmail = user?.email || order.user?.email || 'customer@supermart.com';
  const accountPhone = user?.phone || order.user?.phone || order.deliveryAddress?.phone || 'N/A';

  const recipientName = order.deliveryAddress?.fullName || accountName;
  const recipientPhone = order.deliveryAddress?.phone || accountPhone;
  const addressLine1 = order.deliveryAddress?.addressLine1 || 'Delivery Address';
  const areaCity = `${order.deliveryAddress?.area || 'Dhaka'}, ${order.deliveryAddress?.city || 'Dhaka'}`;

  const orderItems = order.items || [];

  let originalSubtotal = 0;
  let discountedSubtotal = 0;

  orderItems.forEach((item) => {
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
  const effectiveSubtotal = discountedSubtotal > 0 ? discountedSubtotal : (order.totalAmount || 0);
  const deliveryFee = effectiveSubtotal >= 2000 ? 0 : 60;
  const finalTotal = order.grandTotal ?? order.totalAmount ?? (discountedSubtotal + deliveryFee);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isTablet && styles.modalContentTablet,
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: '#10B98118' }]}>
                <FileText size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  Official Money Receipt
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  Invoice REC-{order.orderId || order.orderNumber || order.id}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Paid Stamp Banner */}
            <View style={styles.paidStampBanner}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.paidStampText}>PAID & COMPLETED</Text>
            </View>

            {/* Account Information Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <User size={15} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Account Information</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>1. Account ID:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{accountId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>2. Name:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{accountName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>3. Email:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{accountEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>4. Phone Number:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{accountPhone}</Text>
              </View>
            </View>

            {/* Delivery Address Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <MapPin size={15} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Address</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Recipient:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{recipientName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{recipientPhone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Address:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{addressLine1}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Area & City:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{areaCity}</Text>
              </View>
            </View>

            {/* Price Breakdown Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <ShoppingBag size={15} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Price Breakdown</Text>
              </View>

              {/* Itemized Items */}
              {orderItems.map((item, idx) => {
                const qty = item.quantity || 1;
                const prod = item.product as any;
                const itemPaidPrice = item.price ?? (item.subtotal ? item.subtotal / qty : 0);
                const prodRegPrice = prod?.price || prod?.originalPrice || itemPaidPrice;
                const prodDiscPrice = prod?.discountPrice ?? (itemPaidPrice < prodRegPrice ? itemPaidPrice : prodRegPrice);
                
                const regPrice = Math.max(prodRegPrice, itemPaidPrice);
                const discPrice = Math.min(prodDiscPrice, itemPaidPrice);
                const unitSavings = Math.max(0, regPrice - discPrice);
                const hasDisc = discPrice < regPrice;

                return (
                  <View key={item.id || idx} style={styles.itemRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                        {idx + 1}. {item.product?.name || item.productName || 'Product'} ({qty}x)
                      </Text>
                      {hasDisc && (
                        <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 1 }}>
                          Disc: {formatCurrency(discPrice)} <Text style={{ color: colors.textTertiary, textDecorationLine: 'line-through' }}>{formatCurrency(regPrice)}</Text> (Save {formatCurrency(unitSavings)})
                        </Text>
                      )}
                    </View>
                    <View style={styles.itemPriceGroup}>
                      <Text style={[styles.finalItemPrice, { color: hasDisc ? colors.primary : colors.text }]}>
                        {formatCurrency(discPrice * qty)}
                      </Text>
                    </View>
                  </View>
                );
              })}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items Subtotal:</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>
                  {formatCurrency(originalSubtotal > 0 ? originalSubtotal : discountedSubtotal)}
                </Text>
              </View>

              {totalProductSavings > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#10B981', fontWeight: '600' }]}>Product Savings:</Text>
                  <Text style={[styles.summaryVal, { color: '#10B981', fontWeight: '700' }]}>
                    -{formatCurrency(totalProductSavings)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Charge:</Text>
                <Text style={[styles.summaryVal, { color: deliveryFee === 0 ? '#10B981' : colors.text }]}>
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Payment Method:</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>
                  {order.paymentMethod === 'BKASH' ? 'bKash Mobile Banking' :
                    order.paymentMethod === 'NOGOD' ? 'Nagad Mobile Banking' :
                    order.paymentMethod === 'ROCKET' ? 'Rocket Mobile Banking' :
                    order.paymentMethod === 'CARD' ? 'Credit / Debit Card' :
                    'Cash on Delivery'}
                </Text>
              </View>

              {Boolean(order.transactionId) && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#10B981', fontWeight: '600' }]}>Transaction ID (TxnID):</Text>
                  <Text style={[styles.summaryVal, { color: '#10B981', fontWeight: '800' }]}>
                    {order.transactionId}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount Paid:</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>{formatCurrency(finalTotal)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons: View / Print & Download */}
          <View style={[styles.actionFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => printReceiptPdf(order, user)}
              style={[styles.actionBtn, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Printer size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Print / View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => downloadReceiptPdf(order, user)}
              style={[styles.actionBtn, styles.downloadBtn, { backgroundColor: colors.primary }]}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  modalContent: {
    width: '96%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalContentTablet: {
    maxWidth: 580,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  paidStampBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  paidStampText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  infoCard: {
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 1,
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    minWidth: 95,
  },
  infoValue: {
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  itemPriceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  finalItemPrice: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 11.5,
  },
  summaryVal: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  totalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  actionFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  downloadBtn: {},
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
