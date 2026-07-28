import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Card } from '../../common/Card';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { wishlistApi, WishlistItem } from '../services/wishlistApi';

export default function WishlistScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistApi.getWishlist();
      setWishlist(data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleRemove = async (productId: string) => {
    try {
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
      await wishlistApi.removeFromWishlist(productId);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      fetchWishlist(); // Revert on failure
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Wishlist</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {wishlist.length === 0 ? (
            <View style={styles.emptyState}>
              <Heart size={64} color={colors.textSecondary} style={{ marginBottom: spacing.lg }} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Your Wishlist is Empty</Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                Explore our catalog and save your favorite items here.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {wishlist.map((item) => (
                <Card key={item.id} padding="sm" style={styles.productCard}>
                  <TouchableOpacity onPress={() => router.push(`/product/${item.productId}`)}>
                    <Image source={{ uri: item.product.images[0] || 'https://via.placeholder.com/150' }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <View style={styles.priceRow}>
                        {item.product.discountPrice ? (
                          <>
                            <Text style={[styles.productPrice, { color: colors.primary }]}>৳{item.product.discountPrice}</Text>
                            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>৳{item.product.price}</Text>
                          </>
                        ) : (
                          <Text style={[styles.productPrice, { color: colors.primary }]}>৳{item.product.price}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.removeBtn, { backgroundColor: colors.surface }]}
                    onPress={() => handleRemove(item.productId)}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyStateTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
  },
  productInfo: {
    paddingTop: spacing.sm,
  },
  productName: {
    ...typography.bodySmall,
    fontWeight: '500',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productPrice: {
    ...typography.body,
    fontWeight: '700',
  },
  originalPrice: {
    ...typography.caption,
    textDecorationLine: 'line-through',
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
