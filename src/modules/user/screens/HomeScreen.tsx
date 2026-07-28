import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ShoppingBag, Bell, Search, Truck, Clock, Zap, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../../common/SearchBar';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product } from '../../../shared/types/product.types';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_BANNERS = [
  {
    id: '1',
    title: 'Fresh Fruits & Veggies',
    subtitle: 'Farm to your door',
    color: '#E8F5E9',
    image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '2',
    title: 'Dairy Delights',
    subtitle: 'Fresh every morning',
    color: '#FFF3E0',
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '3',
    title: 'Bakery Specials',
    subtitle: 'Baked with love',
    color: '#FFF8E1',
    image: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

const CATEGORIES = [
  { id: '1', name: 'Fruits', icon: '🍎', color: '#FF6B6B' },
  { id: '2', name: 'Vegetables', icon: '🥬', color: '#51CF66' },
  { id: '3', name: 'Dairy', icon: '🥛', color: '#4DABF7' },
  { id: '4', name: 'Bakery', icon: '🍞', color: '#FFA94D' },
  { id: '5', name: 'Beverages', icon: '🥤', color: '#845EF7' },
  { id: '6', name: 'Meat', icon: '🥩', color: '#FF6B6B' },
  { id: '7', name: 'Seafood', icon: '🦐', color: '#20C997' },
  { id: '8', name: 'Snacks', icon: '🍿', color: '#FFD43B' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { fetchProducts, products, loading, pagination } = useProducts();
  const { addToCart, itemCount } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { numColumns, contentMaxWidth, containerPadding, isTablet, isDesktop } = useResponsiveLayout();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const load = useCallback(async (pageNum = 1, category?: string | null) => {
    await fetchProducts({
      page: pageNum,
      limit: 10,
      category: category || undefined,
    });
    setPage(pageNum);
  }, [fetchProducts]);

  useFocusEffect(
    useCallback(() => {
      load(1, selectedCategory);
    }, [load, selectedCategory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(1, selectedCategory);
    setRefreshing(false);
  }, [load, selectedCategory]);

  const handleCategoryPress = (category: string) => {
    const newCat = selectedCategory === category ? null : category;
    setSelectedCategory(newCat);
    load(1, newCat);
  };

  // Clear category selection
  const clearCategorySelection = () => {
    setSelectedCategory(null);
    load(1, null);
  };

  // Navigate to all categories
  // const handleViewAllCategories = () => {
  //   router.push('/categories');
  // };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = async (product: Product) => {
    await addToCart(product, 1);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard product={item} onPress={handleProductPress} onAddToCart={handleAddToCart} />
  );

  // Banner slider handlers
  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (bannerWidth + 12));
    setCurrentBannerIndex(index);
  };

  const scrollToBanner = (index: number) => {
    const maxIndex = HERO_BANNERS.length - 1;
    const targetIndex = Math.max(0, Math.min(index, maxIndex));
    scrollViewRef.current?.scrollTo({
      x: targetIndex * (bannerWidth + 12),
      animated: true,
    });
    setCurrentBannerIndex(targetIndex);
  };

  const goToNextBanner = () => {
    const nextIndex = (currentBannerIndex + 1) % HERO_BANNERS.length;
    scrollToBanner(nextIndex);
  };

  const goToPrevBanner = () => {
    const prevIndex = currentBannerIndex === 0 ? HERO_BANNERS.length - 1 : currentBannerIndex - 1;
    scrollToBanner(prevIndex);
  };

  // Calculate responsive banner width
  const getBannerWidth = () => {
    if (isDesktop) return 380;
    if (isTablet) return SCREEN_WIDTH * 0.45;
    return Math.min(SCREEN_WIDTH - spacing.lg * 2, contentMaxWidth - spacing.lg * 2);
  };

  const bannerWidth = getBannerWidth();

  // Auto-slide banners
  React.useEffect(() => {
    if (HERO_BANNERS.length > 1) {
      const interval = setInterval(() => {
        goToNextBanner();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentBannerIndex]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1 }}>
        <FlatList
          key={numColumns}
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.list, 
            { 
              paddingBottom: isTablet ? 120 : 100,
            }
          ]}
          columnWrapperStyle={isTablet ? styles.tabletRow : styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View>
              <View style={[styles.header, { 
                backgroundColor: colors.surface,
                paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
                paddingVertical: isTablet ? spacing.xl : spacing.lg,
              }]}>
                <View style={styles.headerTop}>
                  <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                      Good morning
                    </Text>
                    <Text style={[styles.userName, { 
                      color: colors.text,
                      fontSize: isTablet ? 22 : 20,
                    }]}>
                      {user?.name || 'Guest'}
                    </Text>
                  </View>
                  <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => router.push('/notifications')}>
                      <View style={[styles.iconBtn, { 
                        backgroundColor: colors.inputBg,
                        width: isTablet ? 48 : 44,
                        height: isTablet ? 48 : 44,
                      }]}>
                        <Bell size={isTablet ? 22 : 20} color={colors.text} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/cart')}>
                      <View style={[styles.iconBtn, { 
                        backgroundColor: colors.inputBg,
                        width: isTablet ? 48 : 44,
                        height: isTablet ? 48 : 44,
                      }]}>
                        <ShoppingBag size={isTablet ? 22 : 20} color={colors.text} />
                        {itemCount > 0 && (
                          <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{itemCount}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={() => router.push('/search')} activeOpacity={0.9}>
                  <SearchBar 
                    value={search} 
                    onChangeText={setSearch} 
                    placeholder="Search products..." 
                    style={{ 
                      marginTop: spacing.md, 
                      marginBottom: 0, 
                      opacity: 0.9,
                      height: isTablet ? 50 : undefined,
                    }} 
                  />
                </TouchableOpacity>
              </View>

              {/* Banner Slider Section */}
              <View style={styles.bannerWrapper}>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={bannerWidth + 12}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  contentContainerStyle={[
                    styles.bannerContent,
                    { 
                      paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
                      gap: 12,
                    }
                  ]}
                  scrollEventThrottle={16}
                  onScroll={handleBannerScroll}
                >
                  {HERO_BANNERS.map((banner, index) => (
                    <TouchableOpacity
                      key={banner.id}
                      activeOpacity={0.9}
                      onPress={() => console.log('Banner pressed:', banner.id)}
                    >
                      <View 
                        style={[
                          styles.banner, 
                          { 
                            backgroundColor: banner.color,
                            width: bannerWidth,
                            height: isTablet ? 160 : 140,
                            borderRadius: isTablet ? radius.xl : radius.lg,
                          }
                        ]}
                      >
                        <View style={[styles.bannerInfo, { padding: isTablet ? spacing.xl : spacing.lg }]}>
                          <Text style={[
                            styles.bannerTitle,
                            { fontSize: isTablet ? 18 : 16 }
                          ]}>
                            {banner.title}
                          </Text>
                          <Text style={[
                            styles.bannerSubtitle,
                            { fontSize: isTablet ? 14 : 12 }
                          ]}>
                            {banner.subtitle}
                          </Text>
                        </View>
                        <Image 
                          source={{ uri: banner.image }} 
                          style={[
                            styles.bannerImage,
                            { 
                              width: isTablet ? 140 : 120,
                              height: isTablet ? 160 : 140,
                            }
                          ]} 
                          resizeMode="cover" 
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Banner Dots Indicator */}
                {HERO_BANNERS.length > 1 && (
                  <View style={styles.dotsContainer}>
                    {HERO_BANNERS.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            width: currentBannerIndex === index ? 24 : 8,
                            height: 8,
                            backgroundColor: currentBannerIndex === index 
                              ? colors.primary 
                              : colors.textTertiary,
                            borderRadius: 4,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Navigation Arrows for Tablet/Desktop */}
                {isTablet && (
                  <>
                    <TouchableOpacity
                      style={[styles.navArrow, styles.leftArrow, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                      onPress={goToPrevBanner}
                    >
                      <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.navArrow, styles.rightArrow, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                      onPress={goToNextBanner}
                    >
                      <ChevronRight size={24} color={colors.text} />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Promo Card */}
              <View style={[
                styles.promoCard, 
                { 
                  backgroundColor: colors.promo,
                  marginHorizontal: isTablet ? spacing.xl : spacing.lg,
                  marginTop: isTablet ? spacing.xl : spacing.lg,
                  padding: isTablet ? spacing.xl : spacing.lg,
                  borderRadius: isTablet ? radius.xl : radius.lg,
                }
              ]}>
                <View style={styles.promoInfo}>
                  <View style={styles.promoIconRow}>
                    <Truck size={isTablet ? 24 : 20} color={colors.promoAccent} />
                    <Text style={[
                      styles.promoTitle, 
                      { 
                        color: colors.promoText,
                        fontSize: isTablet ? 18 : 16,
                      }
                    ]}>
                      Free Delivery
                    </Text>
                  </View>
                  <Text style={[
                    styles.promoSubtitle, 
                    { 
                      color: colors.promoText,
                      fontSize: isTablet ? 14 : 12,
                    }
                  ]}>
                    On orders above ৳500
                  </Text>
                </View>
                <Zap size={isTablet ? 40 : 32} color={colors.promoAccent} />
              </View>

              {/* Categories Section - Full Grid */}
              <View style={[
                styles.sectionHeader,
                { 
                  paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
                  marginTop: isTablet ? spacing.xl : spacing.lg,
                  marginBottom: isTablet ? spacing.md : spacing.sm,
                }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { 
                    color: colors.text,
                    fontSize: isTablet ? 20 : 18,
                  }
                ]}>
                  Categories
                </Text>
                {/* <TouchableOpacity onPress={handleViewAllCategories} activeOpacity={0.7}>
                  <View style={styles.viewAllContainer}>
                    <Text style={[styles.viewAll, { color: colors.primary, fontSize: isTablet ? 14 : 12 }]}>
                      View All
                    </Text>
                    <ChevronRight size={isTablet ? 16 : 14} color={colors.primary} />
                  </View>
                </TouchableOpacity> */}
              </View>
              
              {/* Category Grid - Responsive */}
              <View style={[
                styles.categoryGrid,
                { 
                  paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: isTablet ? 12 : 10,
                }
              ]}>
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.name;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategoryPress(category.name)}
                      activeOpacity={0.8}
                      style={[
                        styles.categoryItem,
                        { 
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          width: isTablet ? '23%' : '22.5%',
                          paddingVertical: isTablet ? 14 : 10,
                          paddingHorizontal: 2,
                          borderRadius: isTablet ? radius.lg : radius.md,
                        }
                      ]}
                    >
                      <View style={[
                        styles.categoryIconWrapper,
                        { 
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : category.color + '20',
                          width: isTablet ? 48 : 40,
                          height: isTablet ? 48 : 40,
                          borderRadius: isTablet ? 24 : 20,
                        }
                      ]}>
                        <Text style={{ fontSize: isTablet ? 24 : 20 }}>
                          {category.icon}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.categoryName,
                          { 
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontSize: isTablet ? 14 : 11,
                            marginTop: isTablet ? 8 : 6,
                          }
                        ]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Category Chip - Remover */}
              {selectedCategory && (
                <View style={[
                  styles.selectedCategoryChip,
                  { 
                    marginHorizontal: isTablet ? spacing.xl : spacing.lg,
                    marginTop: spacing.md,
                    marginBottom: spacing.sm,
                  }
                ]}>
                  <View style={[
                    styles.chipContent,
                    { 
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary,
                      padding: isTablet ? spacing.md : spacing.sm,
                      borderRadius: radius.lg,
                    }
                  ]}>
                    <Text style={[
                      styles.chipText,
                      { 
                        color: colors.primary,
                        fontSize: isTablet ? 16 : 14,
                      }
                    ]}>
                      Category: {selectedCategory}
                    </Text>
                    <TouchableOpacity
                      onPress={clearCategorySelection}
                      style={[
                        styles.clearButton,
                        { 
                          backgroundColor: colors.primary,
                          padding: isTablet ? 8 : 6,
                          borderRadius: radius.md,
                        }
                      ]}
                    >
                      <X size={isTablet ? 18 : 14} color="#FFFFFF" />
                      <Text style={[
                        styles.clearText,
                        { 
                          color: '#FFFFFF',
                          fontSize: isTablet ? 14 : 12,
                        }
                      ]}>
                        Clear
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Products Section Header */}
              <View style={[
                styles.sectionHeader,
                { 
                  paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
                  marginTop: selectedCategory ? spacing.sm : spacing.lg,
                  marginBottom: isTablet ? spacing.md : spacing.sm,
                }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { 
                    color: colors.text,
                    fontSize: isTablet ? 20 : 18,
                  }
                ]}>
                  {selectedCategory ? selectedCategory : 'All Products'}
                </Text>
                <Clock size={isTablet ? 20 : 16} color={colors.textSecondary} />
              </View>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <View style={{ paddingVertical: 40 }}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No products found
                </Text>
              </View>
            )
          }
          onEndReached={() => {
            if (pagination?.hasNext && !loading) {
              load(page + 1, selectedCategory);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 100 },
  row: { paddingHorizontal: 8 },
  tabletRow: { paddingHorizontal: 12, gap: 12 },
  header: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.caption,
  },
  userName: {
    ...typography.h4,
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bannerWrapper: {
    position: 'relative',
    marginTop: spacing.md,
  },
  bannerScroll: { 
    paddingHorizontal: spacing.lg,
  },
  bannerContent: { 
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 0,
  },
  bannerInfo: { flex: 1 },
  bannerTitle: { 
    ...typography.h4, 
    marginBottom: 4,
  },
  bannerSubtitle: { 
    ...typography.bodySmall, 
    opacity: 0.8,
  },
  bannerImage: {
    flexShrink: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAll: {
    ...typography.caption,
    fontWeight: '600',
  },
  sectionTitle: { 
    ...typography.h4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  categoryItem: {
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 8,
  },
  categoryIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCategoryChip: {
    marginVertical: spacing.sm,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  chipText: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontWeight: '600',
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoInfo: { flex: 1 },
  promoIconRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4,
  },
  promoTitle: { 
    ...typography.h4,
  },
  promoSubtitle: { 
    ...typography.bodySmall,
  },
  emptyText: { 
    ...typography.body, 
    textAlign: 'center',
  },
});