import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Plus, Star, Heart } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product } from '../../../shared/types/product.types';
import { formatCurrency, getDiscountPercentage, getEffectivePrice } from '../../../shared/utils/formatters';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { wishlistApi } from '../services/wishlistApi';
import { showToast } from '../../common/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shared wishlist cache to avoid redundant API calls per card
let wishlistProductIdsCache: Set<string> | null = null;
let wishlistFetchPromise: Promise<Set<string>> | null = null;

export async function getWishlistProductIds(): Promise<Set<string>> {
  if (wishlistProductIdsCache) return wishlistProductIdsCache;
  if (!wishlistFetchPromise) {
    wishlistFetchPromise = wishlistApi
      .getWishlist()
      .then((items) => {
        const set = new Set((items || []).map((item) => item.productId));
        wishlistProductIdsCache = set;
        wishlistFetchPromise = null;
        return set;
      })
      .catch(() => {
        wishlistFetchPromise = null;
        return new Set<string>();
      });
  }
  return wishlistFetchPromise;
}

export function updateWishlistCache(productId: string, isSaved: boolean) {
  if (wishlistProductIdsCache) {
    if (isSaved) {
      wishlistProductIdsCache.add(productId);
    } else {
      wishlistProductIdsCache.delete(productId);
    }
  }
}

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const { colors } = useTheme();
  const { isTablet, isDesktop } = useResponsiveLayout();
  const [isSaved, setIsSaved] = useState(false);
  const discount = getDiscountPercentage(product.price, product.discountPrice);
  const effectivePrice = getEffectivePrice(product.price, product.discountPrice);
  const outOfStock = product.stock === 0;

  useEffect(() => {
    let isMounted = true;
    getWishlistProductIds().then((ids) => {
      if (isMounted) {
        setIsSaved(ids.has(product.id));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  const handleWishlistToggle = async (e: any) => {
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    updateWishlistCache(product.id, nextSaved);
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
      updateWishlistCache(product.id, !nextSaved);
    }
  };

  // Responsive sizing
  const isLargeScreen = isTablet || isDesktop;
  const cardPadding = isLargeScreen ? 'md' : 'none';
  const imageSize = isLargeScreen ? 180 : undefined;
  const buttonSize = isLargeScreen ? 40 : 32;
  const iconSize = isLargeScreen ? 20 : 18;

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onPress(product)}
      style={styles.touchable}
    >
      <Card 
        padding={cardPadding} 
        style={[
          styles.card,
          isLargeScreen && styles.cardTablet,
          { 
            borderRadius: isLargeScreen ? radius.xl : radius.lg,
            marginHorizontal: isLargeScreen ? 8 : 4,
            marginBottom: isLargeScreen ? spacing.lg : spacing.md,
          }
        ].filter(Boolean) as any}
      >
        <View style={[
          styles.imageContainer,
          { 
            backgroundColor: '#F5F5F5',
            borderRadius: isLargeScreen ? radius.lg : 0,
            overflow: 'hidden',
          }
        ]}>
          <Image
            source={{ uri: product.images[0] || 'https://placehold.co/200x200?text=No+Image' }}
            style={[
              styles.image,
              isLargeScreen && { height: imageSize }
            ]}
            resizeMode="cover"
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Badge 
                label={`-${discount}%`} 
                variant="error"
              />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.wishlistCardBtn,
              { backgroundColor: isSaved ? colors.surface : 'rgba(255,255,255,0.9)' }
            ]}
            onPress={handleWishlistToggle}
            accessibilityLabel="Add to Wishlist"
          >
            <Heart size={16} color={isSaved ? '#FF3B30' : colors.textSecondary} fill={isSaved ? '#FF3B30' : 'none'} />
          </TouchableOpacity>
          {outOfStock && (
            <View style={styles.stockOverlay}>
              <Text style={[
                styles.stockText,
                isLargeScreen && styles.stockTextLarge
              ]}>
                Out of Stock
              </Text>
            </View>
          )}
        </View>

        <View style={[
          styles.info,
          { 
            padding: isLargeScreen ? spacing.lg : spacing.md,
            gap: isLargeScreen ? 4 : 2,
          }
        ]}>
          <Text 
            style={[
              styles.name, 
              { 
                color: colors.text,
                fontSize: isLargeScreen ? 16 : 14,
                lineHeight: isLargeScreen ? 22 : 18,
              }
            ]} 
            numberOfLines={isLargeScreen ? 2 : 2}
          >
            {product.name}
          </Text>
          
          <Text 
            style={[
              styles.brand, 
              { 
                color: colors.textSecondary,
                fontSize: isLargeScreen ? 14 : 12,
              }
            ]} 
            numberOfLines={1}
          >
            {product.brand}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[
              styles.price, 
              { 
                color: colors.primary,
                fontSize: isLargeScreen ? 20 : 16,
              }
            ]}>
              {formatCurrency(effectivePrice)}
            </Text>
            {discount > 0 && (
              <Text style={[
                styles.originalPrice, 
                { 
                  color: colors.textTertiary,
                  fontSize: isLargeScreen ? 14 : 13,
                }
              ]}>
                {formatCurrency(product.price)}
              </Text>
            )}
          </View>
          
          {product.rating > 0 && (
            <View style={styles.ratingRow}>
              <Star 
                size={isLargeScreen ? 14 : 12} 
                color={colors.star} 
                fill={colors.star} 
              />
              <Text style={[
                styles.rating, 
                { 
                  color: colors.textSecondary,
                  fontSize: isLargeScreen ? 14 : 12,
                }
              ]}>
                {product.rating.toFixed(1)} ({product.ratingCount})
              </Text>
            </View>
          )}
        </View>

        {onAddToCart && !outOfStock && (
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation?.();
              onAddToCart(product);
            }}
            style={[
              styles.addToCartBtn,
              { 
                backgroundColor: colors.primary,
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                bottom: isLargeScreen ? 16 : 12,
                right: isLargeScreen ? 16 : 12,
                elevation: isLargeScreen ? 6 : 4,
              }
            ]}
          >
            <Plus 
              size={iconSize} 
              color="#FFFFFF" 
              strokeWidth={isLargeScreen ? 2.5 : 2}
            />
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  cardTablet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    zIndex: 1,
  },
  wishlistCardBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeLarge: {
    transform: [{ scale: 1.1 }],
  },
  stockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockTextLarge: {
    fontSize: 16,
    letterSpacing: 1,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 2,
  },
  brand: {
    ...typography.caption,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  price: {
    ...typography.price,
    fontWeight: '700',
  },
  originalPrice: {
    ...typography.bodySmall,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rating: {
    ...typography.caption,
  },
  addToCartBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});