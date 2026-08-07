import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Trash2, Minus, Plus, Tag } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { CartItem } from '../../../shared/types/cart.types';
import { formatCurrency, getEffectivePrice } from '../../../shared/utils/formatters';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ item, onUpdateQty, onRemove }: CartItemRowProps) {
  const { colors } = useTheme();
  if (!item || !item.product) return null;

  const originalPrice = item.product.price || 0;
  const discountPrice = item.product.discountPrice;
  const effectivePrice = getEffectivePrice(originalPrice, discountPrice);
  const hasDiscount = discountPrice !== undefined && discountPrice !== null && discountPrice < originalPrice;
  const subtotal = item.subtotal ?? (effectivePrice * (item.quantity || 1));
  const imageUrl = (item.product.images && item.product.images[0]) || 'https://placehold.co/100x100?text=No+Image';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Product Image */}
      <View style={[styles.imageWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {hasDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.discountBadgeText}>
              -{Math.round(((originalPrice - discountPrice!) / originalPrice) * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Main Info */}
      <View style={styles.infoCol}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
              {(item.product as any).category || 'Grocery'}
            </Text>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {item.product.name}
            </Text>
          </View>

          {/* Remove Item Trash Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onRemove(item.id)}
            style={[styles.removeBtn, { backgroundColor: colors.error + '10' }]}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Pricing & Quantity Controls Row */}
        <View style={styles.bottomRow}>
          {/* Unit Price */}
          <View style={styles.priceGroup}>
            <Text style={[styles.unitPrice, { color: colors.primary }]}>
              {formatCurrency(effectivePrice)}
            </Text>
            {hasDiscount && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                {formatCurrency(originalPrice)}
              </Text>
            )}
          </View>

          {/* Quantity Controls */}
          <View style={styles.controlsGroup}>
            <View style={[styles.qtyBox, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onUpdateQty(item.id, item.quantity - 1)}
                style={styles.qtyBtn}
              >
                {item.quantity > 1 ? (
                  <Minus size={14} color={colors.text} />
                ) : (
                  <Trash2 size={14} color={colors.error} />
                )}
              </TouchableOpacity>

              <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onUpdateQty(item.id, item.quantity + 1)}
                style={styles.qtyBtn}
              >
                <Plus size={14} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Subtotal */}
            <Text style={[styles.subtotalText, { color: colors.text }]}>
              {formatCurrency(subtotal)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    gap: 8,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  unitPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  subtotalText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
