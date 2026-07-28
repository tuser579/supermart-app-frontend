import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Trash2, Minus, Plus } from 'lucide-react-native';
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

  const effectivePrice = getEffectivePrice(item.product.price, item.product.discountPrice);
  const subtotal = item.subtotal ?? (effectivePrice * (item.quantity || 1));
  const imageUrl = (item.product.images && item.product.images[0]) || 'https://placehold.co/100x100?text=No+Image';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatCurrency(effectivePrice)}
        </Text>

        <View style={styles.controls}>
          <View style={[styles.qtyContainer, { borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => onUpdateQty(item.id, item.quantity - 1)}
              style={styles.qtyBtn}
            >
              {item.quantity > 1 ? (
                <Minus size={16} color={colors.text} />
              ) : (
                <Trash2 size={16} color={colors.error} />
              )}
            </TouchableOpacity>
            <Text style={[styles.qty, { color: colors.text }]}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => onUpdateQty(item.id, item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <Plus size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtotal, { color: colors.textSecondary }]}>
            {formatCurrency(subtotal)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  qtyBtn: {
    padding: 8,
  },
  qty: {
    ...typography.bodySmall,
    fontWeight: '700',
    paddingHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  subtotal: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
