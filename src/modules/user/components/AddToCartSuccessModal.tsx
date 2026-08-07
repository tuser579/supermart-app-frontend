import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle2, ShoppingBag, X, ArrowRight, Minus, Plus } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product } from '../../../shared/types/product.types';
import { formatCurrency, getEffectivePrice } from '../../../shared/utils/formatters';

interface AddToCartSuccessModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirmAdd: (product: Product, quantity: number) => Promise<void>;
  onViewCart: () => void;
}

export function AddToCartSuccessModal({
  visible,
  product,
  onClose,
  onConfirmAdd,
  onViewCart,
}: AddToCartSuccessModalProps) {
  const { colors } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setAdding(false);
      setIsAdded(false);
    }
  }, [visible]);

  if (!product) return null;

  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const totalItemPrice = effectivePrice * quantity;

  const handleAddPress = async () => {
    setAdding(true);
    try {
      await onConfirmAdd(product, quantity);
      setIsAdded(true);
    } catch (e) {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isAdded ? colors.primary + '15' : colors.inputBg },
                  ]}
                >
                  {isAdded ? (
                    <CheckCircle2 size={32} color={colors.primary} />
                  ) : (
                    <ShoppingBag size={30} color={colors.primary} />
                  )}
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isAdded ? 'Added to Cart!' : 'Add to Cart'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isAdded
                    ? 'Item successfully added to your shopping cart.'
                    : 'Confirm quantity before adding to your cart.'}
                </Text>
              </View>

              {/* Product Info Box */}
              <View style={[styles.productBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Image
                  source={{ uri: product.images[0] || 'https://placehold.co/100x100?text=No+Image' }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productDetails}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productBrand, { color: colors.textSecondary }]}>
                    {product.brand}
                  </Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>
                    {formatCurrency(effectivePrice)}
                  </Text>
                </View>
              </View>

              {/* Quantity Picker (Shown BEFORE adding) */}
              {!isAdded && (
                <View style={[styles.quantitySection, { borderColor: colors.border }]}>
                  <Text style={[styles.quantityLabel, { color: colors.text }]}>Quantity</Text>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || adding}
                      style={[
                        styles.qtyBtn,
                        {
                          backgroundColor: quantity <= 1 ? colors.inputBg : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Minus size={16} color={quantity <= 1 ? colors.textTertiary : colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.qtyText, { color: colors.text }]}>{quantity}</Text>

                    <TouchableOpacity
                      onPress={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                      disabled={adding || quantity >= (product.stock || 99)}
                      style={[
                        styles.qtyBtn,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Plus size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Total Calculation Row */}
              {!isAdded && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Price</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    {formatCurrency(totalItemPrice)}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actions}>
                {!isAdded ? (
                  <>
                    <TouchableOpacity
                      onPress={handleAddPress}
                      disabled={adding}
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    >
                      {adding ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <ShoppingBag size={18} color="#FFFFFF" />
                          <Text style={styles.primaryBtnText}>Confirm Add to Cart</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onClose}
                      disabled={adding}
                      style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onViewCart();
                      }}
                      style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    >
                      <ShoppingBag size={18} color="#FFFFFF" />
                      <Text style={styles.primaryBtnText}>View Shopping Cart</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onClose}
                      style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                        Continue Shopping
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  productBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    ...typography.label,
    fontSize: 14,
    marginBottom: 2,
  },
  productBrand: {
    ...typography.caption,
    marginBottom: 4,
  },
  productPrice: {
    ...typography.price,
    fontSize: 15,
    fontWeight: '700',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: spacing.xs,
  },
  quantityLabel: {
    ...typography.label,
    fontSize: 14,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  totalLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  totalValue: {
    ...typography.h4,
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
