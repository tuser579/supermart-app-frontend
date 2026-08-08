import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Truck, Shield, Package, Heart } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useCart } from '../hooks/useCart';
import * as productApi from '../services/productApi';
import { wishlistApi } from '../services/wishlistApi';
import { showToast } from '../../common/Toast';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product, Review } from '../../../shared/types/product.types';
import { formatCurrency, getDiscountPercentage, getEffectivePrice } from '../../../shared/utils/formatters';
import { AddToCartSuccessModal } from '../components/AddToCartSuccessModal';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, containerPadding } = useResponsiveLayout();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, userWishlist] = await Promise.all([
        productApi.fetchProductById(id),
        wishlistApi.getWishlist().catch(() => []),
      ]);
      setProduct(p);
      if (p.reviews) setReviews(p.reviews);
      if (userWishlist && Array.isArray(userWishlist)) {
        setIsSaved(userWishlist.some((w) => w.productId === id));
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    await addToCart(product, quantity);
    setAdding(false);
    setShowAddSuccessModal(true);
  };

  if (loading) return <Loader fullscreen />;

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>
          Product not found
        </Text>
      </View>
    );
  }

  const discount = getDiscountPercentage(product.price, product.discountPrice);
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const outOfStock = product.stock === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
          <View style={[styles.header, { backgroundColor: colors.surface, paddingHorizontal: containerPadding, paddingTop: Math.max(insets.top, 8) }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={async () => {
                if (!product) return;
                const nextSaved = !isSaved;
                setIsSaved(nextSaved);
                try {
                  if (nextSaved) {
                    await wishlistApi.addToWishlist(product.id);
                    showToast('success', 'Saved to Wishlist ❤️', `${product.name} saved to wishlist!`);
                  } else {
                    await wishlistApi.removeFromWishlist(product.id);
                    showToast('info', 'Wishlist', 'Product removed from wishlist.');
                  }
                } catch (err) {
                  setIsSaved(!nextSaved);
                }
              }}
              style={[styles.backBtn, { backgroundColor: isSaved ? colors.error + '18' : colors.inputBg }]}
              accessibilityLabel="Wishlist"
            >
              <Heart size={20} color={isSaved ? colors.error : colors.text} fill={isSaved ? colors.error : 'none'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/cart')} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
              <ShoppingCart size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          </View>
        </View>

        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
          <View style={styles.imageSection}>
            <FlatList
              data={product.images.length > 0 ? product.images : ['https://placehold.co/400x400?text=No+Image']}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.productImage} resizeMode="contain" />
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            />
            <View style={styles.dotsContainer}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: index === activeImageIndex ? colors.primary : colors.border },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={[styles.content, { backgroundColor: colors.surface }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.brand, { color: colors.textSecondary }]}>{product.brand}</Text>
            </View>
            {discount > 0 && <Badge label={`-${discount}%`} variant="error" size="md" />}
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(effectivePrice)}</Text>
            {discount > 0 && (
              <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                {formatCurrency(product.price)}
              </Text>
            )}
          </View>

          <View style={[styles.stockRow, { backgroundColor: outOfStock ? colors.errorLight : colors.successLight }]}>
            <Text style={[styles.stockText, { color: outOfStock ? colors.error : colors.success }]}>
              {outOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)`}
            </Text>
          </View>

          <Text style={[styles.descriptionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>

          <View style={styles.featuresRow}>
            <View style={[styles.featureCard, { backgroundColor: colors.inputBg }]}>
              <Truck size={22} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Free Delivery</Text>
            </View>
            <View style={[styles.featureCard, { backgroundColor: colors.inputBg }]}>
              <Shield size={22} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Quality Assured</Text>
            </View>
            <View style={[styles.featureCard, { backgroundColor: colors.inputBg }]}>
              <Package size={22} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Easy Returns</Text>
            </View>
          </View>

          <Text style={[styles.descriptionTitle, { color: colors.text }]}>Quantity</Text>
          <View style={[styles.qtyContainer, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={styles.qtyBtn}
              disabled={outOfStock}
            >
              <Minus size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyValue, { color: colors.text }]}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              style={styles.qtyBtn}
              disabled={outOfStock || quantity >= product.stock}
            >
              <Plus size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {reviews.length > 0 && (
            <>
              <Text style={[styles.descriptionTitle, { color: colors.text }]}>Reviews</Text>
              <View style={styles.ratingSummary}>
                <Text style={[styles.ratingValue, { color: colors.text }]}>{product.rating.toFixed(1)}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color={colors.star}
                      fill={star <= Math.round(product.rating) ? colors.star : 'none'}
                    />
                  ))}
                </View>
                <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>
                  {product.ratingCount} reviews
                </Text>
              </View>
              {reviews.slice(0, 3).map((review) => (
                <Card key={review.id} padding="md" style={{ marginBottom: spacing.sm }}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewName, { color: colors.text }]}>{review.userName}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          color={colors.star}
                          fill={star <= review.rating ? colors.star : 'none'}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                    {review.comment}
                  </Text>
                </Card>
              ))}
            </>
          )}
        </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: containerPadding }}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total Price</Text>
            <Text style={[styles.footerPrice, { color: colors.primary }]}>
              {formatCurrency(effectivePrice * quantity)}
            </Text>
          </View>
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            loading={adding}
            disabled={outOfStock}
            leftIcon={<ShoppingCart size={20} color="#FFFFFF" />}
            size="lg"
          />
        </View>
      </View>

      <AddToCartSuccessModal
        visible={showAddSuccessModal}
        product={product}
        onClose={() => setShowAddSuccessModal(false)}
        onConfirmAdd={async (p, q) => { await addToCart(p, q); }}
        onViewCart={() => router.push('/(tabs)/cart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
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
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.md,
  },
  brand: {
    ...typography.bodySmall,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  price: {
    ...typography.priceLarge,
  },
  originalPrice: {
    ...typography.body,
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  stockText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  descriptionTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  featureText: {
    ...typography.caption,
    textAlign: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  qtyBtn: {
    padding: 14,
  },
  qtyValue: {
    ...typography.h4,
    paddingHorizontal: 20,
    minWidth: 50,
    textAlign: 'center',
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  ratingValue: {
    ...typography.h3,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingCount: {
    ...typography.bodySmall,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewName: {
    ...typography.label,
  },
  reviewComment: {
    ...typography.bodySmall,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  footerLabel: {
    ...typography.caption,
  },
  footerPrice: {
    ...typography.price,
  },
});
