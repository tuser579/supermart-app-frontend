import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, ArrowRight } from 'lucide-react-native';
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

const DELIVERY_CHARGE = 60;

export default function CartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, totalAmount, itemCount, loadCart, updateQuantity, removeItemFromCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { contentMaxWidth, containerPadding } = useResponsiveLayout();

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

  const grandTotal = totalAmount + (itemCount > 0 ? DELIVERY_CHARGE : 0);

  if (loading) return <Loader fullscreen />;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1 }}>
          <EmptyState
            icon={<ShoppingCart size={48} color={colors.textTertiary} />}
            title="Your cart is empty"
            subtitle="Browse products and add items to your cart"
            ctaTitle="Shop Now"
            onCtaPress={() => router.push('/')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>My Cart</Text>
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CartItemRow item={item} onUpdateQty={handleUpdateQty} onRemove={removeItemFromCart} />
          )}
          contentContainerStyle={[styles.list, { paddingHorizontal: containerPadding }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            <Card padding="lg" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Charge</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(DELIVERY_CHARGE)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
                  {formatCurrency(grandTotal)}
                </Text>
              </View>
            </Card>
          }
        />

        <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border, paddingHorizontal: containerPadding }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.footerPrice, { color: colors.primary }]}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { ...typography.h3 },
  itemCount: { ...typography.bodySmall },
  list: { padding: spacing.lg, paddingBottom: 100 },
  summaryCard: { marginTop: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: { ...typography.bodySmall },
  summaryValue: { ...typography.body, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  grandTotalLabel: { ...typography.h4, fontSize: 16 },
  grandTotalValue: { ...typography.priceLarge, fontSize: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerInfo: { flex: 1, marginRight: spacing.md },
  footerLabel: { ...typography.caption },
  footerPrice: { ...typography.price },
});
