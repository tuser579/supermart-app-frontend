import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShoppingCart,
  ArrowRight,
  Tag,
  Check,
  X,
  Sparkles,
  Truck,
  Trash2,
  ShieldCheck,
  Lock,
  ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { CartItemRow } from '../components/CartItemRow';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { EmptyState } from '../../common/EmptyState';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FREE_DELIVERY_THRESHOLD = 2000;

export default function CartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    items,
    totalAmount,
    originalAmount,
    discountSavings,
    couponCode,
    couponDiscount,
    deliveryCharge,
    grandTotal,
    itemCount,
    loadCart,
    updateQuantity,
    removeItemFromCart,
    clearAllCart,
    applyCouponCode,
    removeCouponCode,
  } = useCart();

  const [loading, setLoading] = useState(items.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout() as any;

  useEffect(() => {
    (async () => {
      await loadCart();
      setLoading(false);
    })();
  }, [loadCart]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const handleUpdateQty = async (id: string, qty: number) => {
    if (qty < 1) {
      await removeItemFromCart(id);
    } else {
      await updateQuantity(id, qty);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsClearModalOpen(false);
    await clearAllCart();
  };

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = codeToApply || inputCoupon;
    setCouponError('');
    setCouponSuccess('');
    const res = applyCouponCode(code);
    if (res.success) {
      setCouponSuccess(res.message || 'Coupon applied successfully!');
      setInputCoupon('');
    } else {
      setCouponError(res.message || 'Invalid coupon code');
    }
  };

  if (loading) return <Loader fullscreen />;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1, paddingHorizontal: containerPadding }}>
          <EmptyState
            icon={<ShoppingCart size={52} color={colors.textTertiary} />}
            title="Your Cart is Empty"
            subtitle="Explore our catalog and add your favorite items to your cart"
            ctaTitle="Explore Products"
            onCtaPress={() => router.push('/')}
          />
        </View>
      </View>
    );
  }

  // Free delivery calculation
  const isFreeDeliveryUnlocked = deliveryCharge === 0 || totalAmount >= FREE_DELIVERY_THRESHOLD;
  const neededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - totalAmount);
  const freeDeliveryProgress = Math.min(100, (totalAmount / FREE_DELIVERY_THRESHOLD) * 100);

  // Free Delivery Progress Banner Component
  const renderFreeDeliveryBanner = () => (
    <View
      style={[
        styles.freeDeliveryBox,
        {
          backgroundColor: isFreeDeliveryUnlocked ? 'rgba(34,197,94,0.08)' : colors.inputBg,
          borderColor: isFreeDeliveryUnlocked ? '#22C55E' : colors.border,
        },
      ]}
    >
      <View style={styles.freeDeliveryHeader}>
        <View style={styles.freeDeliveryTitleRow}>
          <Truck size={18} color={isFreeDeliveryUnlocked ? '#22C55E' : colors.primary} />
          <Text
            style={[
              styles.freeDeliveryTitle,
              { color: isFreeDeliveryUnlocked ? '#22C55E' : colors.text },
            ]}
          >
            {isFreeDeliveryUnlocked
              ? '🎉 Congratulations! You unlocked FREE Delivery'
              : `Add ${formatCurrency(neededForFreeDelivery)} more for FREE Delivery!`}
          </Text>
        </View>
        <Text style={[styles.freeDeliveryPercentage, { color: isFreeDeliveryUnlocked ? '#22C55E' : colors.textSecondary }]}>
          {Math.round(freeDeliveryProgress)}%
        </Text>
      </View>

      {/* Progress Track */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fillBar,
            {
              width: `${freeDeliveryProgress}%`,
              backgroundColor: isFreeDeliveryUnlocked ? '#22C55E' : colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );



  // Price Breakdown Summary Card Component
  const renderPriceBreakdownCard = () => (
    <Card padding="lg" style={[styles.summaryCard, { borderColor: colors.border }]}>
      <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>

      {/* Itemized breakdown */}
      <View style={styles.itemizedBox}>
        {items.map((i, idx) => {
          const origPrice = i.product?.price || (i.subtotal / (i.quantity || 1));
          const discPrice = i.product?.discountPrice ?? origPrice;
          const hasDiscount = discPrice < origPrice;
          return (
            <View key={i.id || idx} style={styles.itemizedRow}>
              <Text style={[styles.itemizedName, { color: colors.text }]} numberOfLines={1}>
                {idx + 1}. {i.product?.name || 'Product'} ({i.quantity}x)
              </Text>
              <View style={styles.itemizedPriceGroup}>
                {hasDiscount && (
                  <Text style={[styles.itemizedStrikethrough, { color: colors.textTertiary }]}>
                    {formatCurrency(origPrice * i.quantity)}
                  </Text>
                )}
                <Text style={[styles.itemizedFinal, { color: hasDiscount ? colors.primary : colors.text }]}>
                  {formatCurrency(discPrice * i.quantity)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.miniDivider, { backgroundColor: colors.border }]} />

      {/* Items Subtotal */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal ({itemCount} items)</Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {formatCurrency(originalAmount > 0 ? originalAmount : totalAmount)}
        </Text>
      </View>

      {/* Item Savings */}
      {discountSavings > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.savingsLabelGroup}>
            <Sparkles size={14} color="#10B981" />
            <Text style={[styles.summaryLabel, { color: '#10B981', fontWeight: '600' }]}>Product Savings</Text>
          </View>
          <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: '700' }]}>
            -{formatCurrency(discountSavings)}
          </Text>
        </View>
      )}

      {/* Coupon Savings */}
      {couponDiscount > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.savingsLabelGroup}>
            <Tag size={14} color="#22C55E" />
            <Text style={[styles.summaryLabel, { color: '#22C55E', fontWeight: '600' }]}>Coupon Discount ({couponCode})</Text>
          </View>
          <Text style={[styles.summaryValue, { color: '#22C55E', fontWeight: '700' }]}>
            -{formatCurrency(couponDiscount)}
          </Text>
        </View>
      )}

      {/* Delivery Fee */}
      <View style={styles.summaryRow}>
        <View style={styles.savingsLabelGroup}>
          <Truck size={14} color={colors.textSecondary} />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
        </View>
        <Text style={[styles.summaryValue, { color: deliveryCharge === 0 ? '#10B981' : colors.text }]}>
          {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Final Total */}
      <View style={styles.summaryRow}>
        <View>
          <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total Amount</Text>
          <Text style={[styles.taxInclusiveText, { color: colors.textTertiary }]}>Inclusive of all taxes</Text>
        </View>
        <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
          {formatCurrency(grandTotal)}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1 }}>
        
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingHorizontal: containerPadding,
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <View style={[styles.cartIconBadge, { backgroundColor: colors.primaryLight }]}>
              <ShoppingCart size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Shopping Cart</Text>
              <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
                {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsClearModalOpen(true)}
            style={[styles.clearAllBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '35' }]}
          >
            <Trash2 size={16} color={colors.error} />
            <Text style={[styles.clearAllBtnText, { color: colors.error }]}>Clear Cart</Text>
          </TouchableOpacity>
        </View>

        {isDesktop ? (
          /* Desktop / Laptop 2-Column Split Layout inside Y-axis ScrollView */
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={[styles.desktopSplitLayout, { paddingHorizontal: containerPadding }]}>
              {/* Left Column: Cart Items + Free Delivery Banner */}
              <View style={styles.desktopLeftCol}>
                {renderFreeDeliveryBanner()}

                <View>
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onUpdateQty={handleUpdateQty}
                      onRemove={removeItemFromCart}
                    />
                  ))}
                </View>

                {/* Continue Shopping Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/')}
                  style={[styles.continueShoppingBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <ChevronLeft size={18} color={colors.primary} />
                  <Text style={[styles.continueShoppingText, { color: colors.primary }]}>Continue Shopping</Text>
                </TouchableOpacity>
              </View>

              {/* Right Column: Summary + Checkout */}
              <View style={styles.desktopRightCol}>
                {renderPriceBreakdownCard()}

                <Button
                  title="Proceed to Checkout"
                  onPress={() => router.push('/checkout')}
                  rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
                  size="lg"
                />

                {/* Trust Badges */}
                <View style={[styles.trustBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.trustItem}>
                    <ShieldCheck size={16} color="#10B981" />
                    <Text style={[styles.trustText, { color: colors.textSecondary }]}>Secure Checkout</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Lock size={16} color="#10B981" />
                    <Text style={[styles.trustText, { color: colors.textSecondary }]}>Encrypted Payment</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Mobile & Tablet Vertical Layout */
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderFreeDeliveryBanner()}
              renderItem={({ item }) => (
                <CartItemRow item={item} onUpdateQty={handleUpdateQty} onRemove={removeItemFromCart} />
              )}
              contentContainerStyle={[styles.list, { paddingHorizontal: containerPadding }]}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListFooterComponent={
                <View style={styles.footerComponentContainer}>
                  {renderPriceBreakdownCard()}
                </View>
              }
            />

            {/* Sticky Footer Navigation Bar for Mobile */}
            <View style={[styles.mobileFooter, { backgroundColor: colors.surface, borderColor: colors.border, paddingHorizontal: containerPadding }]}>
              <View style={styles.mobileFooterInfo}>
                <Text style={[styles.mobileFooterLabel, { color: colors.textSecondary }]}>Total Payable</Text>
                <Text style={[styles.mobileFooterPrice, { color: colors.primary }]}>
                  {formatCurrency(grandTotal)}
                </Text>
              </View>
              <Button
                title="Checkout"
                onPress={() => router.push('/checkout')}
                rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
                size="lg"
              />
            </View>
          </>
        )}

        {/* Clear All Confirmation Modal */}
        <Modal
          visible={isClearModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsClearModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setIsClearModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.modalIconWrapper, { backgroundColor: colors.error + '15' }]}>
                <Trash2 size={28} color={colors.error} />
              </View>

              <Text style={[styles.modalTitle, { color: colors.text }]}>Clear Entire Cart?</Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Are you sure you want to delete all <Text style={{ fontWeight: '700', color: colors.text }}>{itemCount}</Text> item{itemCount !== 1 ? 's' : ''} from your cart?
              </Text>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsClearModalOpen(false)}
                  style={[styles.modalCancelBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirmClearAll}
                  style={[styles.modalClearBtn, { backgroundColor: colors.error }]}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={styles.modalClearBtnText}>Yes, Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h3, fontSize: 22, fontWeight: '800' },
  itemCount: { fontSize: 13, marginTop: 2 },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Free delivery banner
  freeDeliveryBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  freeDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  freeDeliveryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  freeDeliveryTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  freeDeliveryPercentage: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 4,
  },

  // Desktop 2-column layout
  desktopSplitLayout: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  desktopLeftCol: {
    flex: 1,
  },
  desktopRightCol: {
    width: 400,
    gap: spacing.lg,
    paddingBottom: 60,
  },
  continueShoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  continueShoppingText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Coupon section
  couponCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  couponMsgText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  appliedCouponTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  appliedCouponText: {
    fontSize: 12,
  },
  removeCouponBtn: {
    padding: 2,
  },

  // Summary Card
  summaryCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  itemizedBox: {
    marginVertical: 4,
    gap: 4,
  },
  itemizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemizedName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  itemizedPriceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemizedStrikethrough: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  itemizedFinal: {
    fontSize: 12,
    fontWeight: '700',
  },
  miniDivider: {
    height: 1,
    marginVertical: 8,
    opacity: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  savingsLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800' },
  taxInclusiveText: { fontSize: 10 },
  grandTotalValue: { fontSize: 22, fontWeight: '800' },

  // Trust box
  trustBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Mobile layout
  list: { paddingBottom: 120 },
  footerComponentContainer: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  mobileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  mobileFooterInfo: { gap: 2 },
  mobileFooterLabel: { fontSize: 11, fontWeight: '500' },
  mobileFooterPrice: { fontSize: 20, fontWeight: '800' },

  // Clear modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  modalIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalClearBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 6,
  },
  modalClearBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
