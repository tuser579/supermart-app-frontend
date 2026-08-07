import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Heart, Trash2, ShoppingCart, X } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Card } from '../../common/Card';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { wishlistApi, WishlistItem } from '../services/wishlistApi';
import { useCart } from '../hooks/useCart';
import { showToast } from '../../common/Toast';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function WishlistScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { contentMaxWidth, containerPadding, isDesktop, numColumns } = useResponsiveLayout();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [itemToRemove, setItemToRemove] = useState<WishlistItem | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    try {
      const data = await wishlistApi.getWishlist();
      setWishlist(data || []);
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [fetchWishlist])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;
    setIsProcessing(true);
    try {
      setWishlist((prev) => prev.filter((i) => i.productId !== itemToRemove.productId));
      await wishlistApi.removeFromWishlist(itemToRemove.productId);
      await fetchWishlist();
      showToast('info', 'Item Removed', 'Product removed from your wishlist.');
    } catch (error) {
      showToast('error', 'Error', 'Failed to remove product from wishlist.');
      fetchWishlist();
    } finally {
      setItemToRemove(null);
      setIsProcessing(false);
    }
  };

  const confirmClearWishlist = async () => {
    if (wishlist.length === 0) return;
    setIsProcessing(true);
    try {
      const currentList = [...wishlist];
      setWishlist([]);
      setIsClearModalOpen(false);
      await wishlistApi.clearWishlist(currentList);
      await fetchWishlist();
      showToast('info', 'Wishlist Cleared', 'All items removed from wishlist.');
    } catch (error) {
      showToast('error', 'Error', 'Failed to clear wishlist.');
      fetchWishlist();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      const fullProduct = {
        id: item.productId,
        name: item.product.name,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        images: item.product.images || [],
        brand: item.product.brand,
      } as any;

      await addToCart(fullProduct, 1);
      showToast('success', 'Added to Cart 🛒', `${item.product.name} added to your cart!`);
    } catch (e) {
      showToast('error', 'Error', 'Failed to add product to cart.');
    }
  };

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Wishlist</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Item Count & Clear Bar */}
      {wishlist.length > 0 && (
        <View style={[styles.actionBar, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
          <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
            {wishlist.length} Saved Item{wishlist.length > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => setIsClearModalOpen(true)}
            style={[styles.clearBtnBadge, { backgroundColor: colors.error + '15' }]}
          >
            <Trash2 size={13} color={colors.error} />
            <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear Wishlist</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ padding: containerPadding, paddingBottom: spacing.xxl * 2, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {wishlist.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBg, { backgroundColor: colors.primaryLight }]}>
                <Heart size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Your Wishlist is Empty</Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                Explore our catalog and save your favorite items here for easy access.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.exploreBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.grid, { gap: isDesktop ? 20 : 12 }]}>
              {wishlist.map((item) => {
                const effectivePrice = item.product.discountPrice || item.product.price;
                const hasDiscount = Boolean(item.product.discountPrice && item.product.discountPrice < item.product.price);
                const cardWidth = numColumns >= 4 ? '23%' : numColumns === 3 ? '31%' : '48%';

                return (
                  <Card key={item.id} padding="none" style={[styles.productCard, { width: cardWidth }]}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.push(`/product/${item.productId}`)}
                      style={{ flex: 1 }}
                    >
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: item.product.images?.[0] || 'https://via.placeholder.com/180' }}
                          style={styles.productImage}
                        />
                        <TouchableOpacity
                          style={[styles.removeIconBtn, { backgroundColor: colors.surface }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            setItemToRemove(item);
                          }}
                          accessibilityLabel="Remove from wishlist"
                        >
                          <Heart size={16} color="#FF3B30" fill="#FF3B30" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                          {item.product.name}
                        </Text>

                        <View style={styles.priceRow}>
                          <Text style={[styles.productPrice, { color: colors.primary }]}>
                            {formatCurrency(effectivePrice)}
                          </Text>
                          {hasDiscount && (
                            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                              {formatCurrency(item.product.price)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                      onPress={() => handleAddToCart(item)}
                      style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
                    >
                      <ShoppingCart size={15} color="#FFFFFF" />
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Remove Single Item Confirmation Modal */}
      <Modal
        visible={!!itemToRemove}
        transparent
        animationType="fade"
        onRequestClose={() => setItemToRemove(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Remove from Wishlist</Text>
              <TouchableOpacity onPress={() => setItemToRemove(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Remove "{itemToRemove?.product?.name}" from your wishlist?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setItemToRemove(null)}
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
                onPress={confirmRemoveItem}
                disabled={isProcessing}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isProcessing ? 'Removing...' : 'Remove'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Wishlist Confirmation Modal */}
      <Modal
        visible={isClearModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClearModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Clear Wishlist</Text>
              <TouchableOpacity onPress={() => setIsClearModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to remove all {wishlist.length} item{wishlist.length > 1 ? 's' : ''} from your wishlist?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setIsClearModalOpen(false)}
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
                onPress={confirmClearWishlist}
                disabled={isProcessing}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {isProcessing ? 'Clearing...' : 'Clear All'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: spacing.md,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h4 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  exploreBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F7F7F7',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeIconBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  productPrice: {
    ...typography.body,
    fontWeight: '700',
  },
  originalPrice: {
    ...typography.caption,
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    marginTop: 4,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    ...typography.h4,
    fontWeight: '700',
  },
  modalSubtitle: {
    ...typography.bodySmall,
  },
  closeBtn: {
    padding: 4,
  },
});
