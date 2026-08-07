import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  TouchableWithoutFeedback,
  Pressable,
  Keyboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { ProductCard } from '../components/ProductCard';
import { AddToCartSuccessModal } from '../components/AddToCartSuccessModal';
import { SearchBar } from '../../common/SearchBar';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { Button } from '../../common/Button';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Check,
  ArrowUpDown,
  Tag,
  DollarSign,
  Package,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product } from '../../../shared/types/product.types';
import * as productApi from '../services/productApi';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

type SortOption = 'createdAt' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { id: SortOption; label: string; sortBy: string; sortOrder: 'asc' | 'desc' }[] = [
  { id: 'createdAt', label: 'Newest Arrivals', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'price_asc', label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
  { id: 'price_desc', label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
  { id: 'rating', label: 'Highest Rated', sortBy: 'rating', sortOrder: 'desc' },
];

const DEFAULT_CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Beverages',
  'Meat',
  'Seafood',
  'Snacks',
];

export default function ProductListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { fetchProducts, products, loading, pagination } = useProducts();
  const { addToCart } = useCart();
  const { numColumns, isDesktop, isTablet, containerPadding } = useResponsiveLayout() as any;
  const flatListRef = useRef<FlatList>(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState('');
  const [tempSortBy, setTempSortBy] = useState<SortOption>('createdAt');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempInStockOnly, setTempInStockOnly] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Load available categories once
  useEffect(() => {
    (async () => {
      try {
        const cats = await productApi.fetchCategories();
        if (cats && cats.length > 0) {
          const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...cats]));
          setCategories(merged);
        }
      } catch (err) {
        // handle silently
      }
    })();
  }, []);

  // Build filter object for API
  const getFilterParams = useCallback(
    (pageNum: number, qSearch: string) => {
      const selectedSort = SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];
      return {
        search: qSearch || undefined,
        category: selectedCategory || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        inStock: inStockOnly ? true : undefined,
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder,
        page: pageNum,
        limit: 12,
      };
    },
    [selectedCategory, sortBy, minPrice, maxPrice, inStockOnly]
  );

  const load = useCallback(
    async (pageNum: number = 1, qSearch: string = debouncedSearch) => {
      const params = getFilterParams(pageNum, qSearch);
      await fetchProducts(params);
      setPage(pageNum);
    },
    [fetchProducts, getFilterParams, debouncedSearch]
  );

  useFocusEffect(
    useCallback(() => {
      load(1, debouncedSearch);
    }, [load, debouncedSearch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(1, debouncedSearch);
    setRefreshing(false);
  }, [load, debouncedSearch]);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddToCartPress = (product: Product) => {
    setSelectedProductForCart(product);
    setShowAddModal(true);
  };

  const handleConfirmAddToCart = async (product: Product, quantity: number) => {
    await addToCart(product, quantity);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages) || loading) return;
    load(newPage, debouncedSearch);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Open filter modal with current active values
  const handleOpenFilterModal = () => {
    setTempCategory(selectedCategory);
    setTempSortBy(sortBy);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempInStockOnly(inStockOnly);
    setIsFilterModalOpen(true);
  };

  // Apply filters from modal
  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setSortBy(tempSortBy);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setInStockOnly(tempInStockOnly);
    setIsFilterModalOpen(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    setTempCategory('');
    setTempSortBy('createdAt');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempInStockOnly(false);
  };

  // Calculate active filter count
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (sortBy !== 'createdAt' ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // Pagination Footer Controls Component
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const totalPages = pagination.totalPages;
    const pagesArray: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pagesArray.push(i);
    }

    return (
      <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.paginationInfo, { color: colors.textSecondary }]}>
          Page <Text style={{ fontWeight: '700', color: colors.text }}>{page}</Text> of{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>{totalPages}</Text> ({pagination.total} items)
        </Text>

        <View style={styles.paginationControls}>
          <TouchableOpacity
            onPress={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
            style={[
              styles.pageNavBtn,
              {
                backgroundColor: page <= 1 ? colors.inputBg : colors.primaryLight,
                borderColor: page <= 1 ? colors.border : colors.primary,
                opacity: page <= 1 ? 0.5 : 1,
              },
            ]}
          >
            <ChevronLeft size={18} color={page <= 1 ? colors.textTertiary : colors.primary} />
            <Text
              style={[
                styles.pageNavBtnText,
                { color: page <= 1 ? colors.textTertiary : colors.primary },
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          <View style={styles.pageNumbersRow}>
            {startPage > 1 && (
              <>
                <TouchableOpacity
                  onPress={() => handlePageChange(1)}
                  style={[
                    styles.pageNumberBtn,
                    {
                      backgroundColor: page === 1 ? colors.primary : colors.inputBg,
                      borderColor: page === 1 ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.pageNumberText, { color: page === 1 ? '#FFFFFF' : colors.text }]}>1</Text>
                </TouchableOpacity>
                {startPage > 2 && <Text style={[styles.ellipsis, { color: colors.textSecondary }]}>...</Text>}
              </>
            )}

            {pagesArray.map((p) => {
              const isCurrent = p === page;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => handlePageChange(p)}
                  style={[
                    styles.pageNumberBtn,
                    {
                      backgroundColor: isCurrent ? colors.primary : colors.inputBg,
                      borderColor: isCurrent ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.pageNumberText, { color: isCurrent ? '#FFFFFF' : colors.text }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <Text style={[styles.ellipsis, { color: colors.textSecondary }]}>...</Text>}
                <TouchableOpacity
                  onPress={() => handlePageChange(totalPages)}
                  style={[
                    styles.pageNumberBtn,
                    {
                      backgroundColor: page === totalPages ? colors.primary : colors.inputBg,
                      borderColor: page === totalPages ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.pageNumberText, { color: page === totalPages ? '#FFFFFF' : colors.text }]}>
                    {totalPages}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
            style={[
              styles.pageNavBtn,
              {
                backgroundColor: page >= totalPages ? colors.inputBg : colors.primaryLight,
                borderColor: page >= totalPages ? colors.border : colors.primary,
                opacity: page >= totalPages ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.pageNavBtnText,
                { color: page >= totalPages ? colors.textTertiary : colors.primary },
              ]}
            >
              Next
            </Text>
            <ChevronRight size={18} color={page >= totalPages ? colors.textTertiary : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <View style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          paddingHorizontal: isDesktop ? containerPadding : spacing.lg,
        }
      ]}>
        {isDesktop ? (
          // Desktop: horizontal row â€” title + result count on left, search + filter on right
          <View style={styles.desktopHeaderRow}>
            <View style={styles.desktopHeaderLeft}>
              <Text style={[styles.title, { color: colors.text, marginBottom: 0 }]}>Search Products</Text>
              {pagination && (
                <Text style={[styles.desktopResultCount, { color: colors.textSecondary }]}>
                  {pagination.total} results
                </Text>
              )}
            </View>
            <View style={styles.desktopHeaderRight}>
              <View style={styles.desktopSearchBox}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name, brand, category..."
                />
              </View>
              <TouchableOpacity
                onPress={handleOpenFilterModal}
                activeOpacity={0.7}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: activeFilterCount > 0 ? colors.primary : colors.inputBg,
                    borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                  },
                ]}
              >
                <SlidersHorizontal
                  size={20}
                  color={activeFilterCount > 0 ? '#FFFFFF' : colors.text}
                />
                {activeFilterCount > 0 && (
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Mobile/tablet: stacked header
          <>
            <Text style={[styles.title, { color: colors.text }]}>Search Products</Text>
            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search by name, brand..."
                />
              </View>
              <TouchableOpacity
                onPress={handleOpenFilterModal}
                activeOpacity={0.7}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: activeFilterCount > 0 ? colors.primary : colors.inputBg,
                    borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                  },
                ]}
              >
                <SlidersHorizontal
                  size={20}
                  color={activeFilterCount > 0 ? '#FFFFFF' : colors.text}
                />
                {activeFilterCount > 0 && (
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Active Filters chips row â€” all screen sizes */}
      {activeFilterCount > 0 && (
        <View style={[
          styles.activeFiltersRow,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingHorizontal: isDesktop ? containerPadding : 0,
          }
        ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersScroll}
          >
            {selectedCategory !== '' && (
              <TouchableOpacity
                onPress={() => setSelectedCategory('')}
                style={[styles.activeTag, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.activeTagText, { color: colors.primary }]}>
                  Category: {selectedCategory}
                </Text>
                <X size={14} color={colors.primary} />
              </TouchableOpacity>
            )}

            {sortBy !== 'createdAt' && (
              <TouchableOpacity
                onPress={() => setSortBy('createdAt')}
                style={[styles.activeTag, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.activeTagText, { color: colors.primary }]}>
                  Sort: {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
                </Text>
                <X size={14} color={colors.primary} />
              </TouchableOpacity>
            )}

            {(minPrice !== '' || maxPrice !== '') && (
              <TouchableOpacity
                onPress={() => { setMinPrice(''); setMaxPrice(''); }}
                style={[styles.activeTag, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.activeTagText, { color: colors.primary }]}>
                  Price: BDT {minPrice || '0'} - {maxPrice || 'Any'}
                </Text>
                <X size={14} color={colors.primary} />
              </TouchableOpacity>
            )}

            {inStockOnly && (
              <TouchableOpacity
                onPress={() => setInStockOnly(false)}
                style={[styles.activeTag, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.activeTagText, { color: colors.primary }]}>In-Stock Only</Text>
                <X size={14} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => { setSelectedCategory(''); setSortBy('createdAt'); setMinPrice(''); setMaxPrice(''); setInStockOnly(false); }}
              style={styles.clearAllBtn}
            >
              <Text style={[styles.clearAllText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Products Grid â€” all screen sizes */}
      <FlatList
        ref={flatListRef}
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} onPress={handleProductPress} onAddToCart={handleAddToCartPress} />}
        numColumns={numColumns || 2}
        key={numColumns || 2}
        contentContainerStyle={[
          styles.list,
          isDesktop && { paddingHorizontal: containerPadding },
        ]}
        columnWrapperStyle={[
          styles.row,
          isDesktop && { paddingHorizontal: 0, gap: 16 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon={<SearchIcon size={48} color={colors.textTertiary} />}
              title="No products found"
              subtitle="Try adjusting your search or filters"
            />
          )
        }
        ListFooterComponent={renderPagination()}
      />

      <Modal
        visible={isFilterModalOpen}
        animationType={isDesktop ? 'fade' : 'slide'}
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsFilterModalOpen(false)}
          />
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
              isDesktop && styles.modalContentDesktop,
            ]}
            onPress={(e) => e.stopPropagation?.()}
          >
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                      <SlidersHorizontal size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Products</Text>
                    {activeFilterCount > 0 && (
                      <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.filterBadgeText}>{activeFilterCount} active</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsFilterModalOpen(false)}
                    style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
                  >
                    <X size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Modal Body â€” 2-col grid on desktop, single col on mobile */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.modalBody}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={isDesktop ? styles.desktopModalGrid : undefined}>

                    {/* Sort By Section */}
                    <View style={[styles.filterSection, isDesktop && styles.desktopFilterSection, { borderBottomColor: colors.border }]}>
                      <View style={styles.sectionHeader}>
                        <ArrowUpDown size={18} color={colors.primary} />
                        <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort By</Text>
                      </View>
                      <View style={isDesktop ? styles.sortGridDesktop : styles.sortGrid}>
                        {SORT_OPTIONS.map((opt) => {
                          const isSelected = tempSortBy === opt.id;
                          return (
                            <TouchableOpacity
                              key={opt.id}
                              onPress={() => setTempSortBy(opt.id)}
                              style={[
                                styles.sortOption,
                                {
                                  backgroundColor: isSelected ? colors.primaryLight : colors.inputBg,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.sortOptionText,
                                  { color: isSelected ? colors.primary : colors.text },
                                ]}
                              >
                                {opt.label}
                              </Text>
                              {isSelected && <Check size={16} color={colors.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Categories Section */}
                    {categories.length > 0 && (
                      <View style={[styles.filterSection, isDesktop && styles.desktopFilterSection, { borderBottomColor: colors.border }]}>
                        <View style={styles.sectionHeader}>
                          <Tag size={18} color={colors.primary} />
                          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                            Category
                          </Text>
                        </View>
                        <View style={styles.modalCategoryWrap}>
                          <TouchableOpacity
                            onPress={() => setTempCategory('')}
                            style={[
                              styles.catPill,
                              {
                                backgroundColor: tempCategory === '' ? colors.primary : colors.inputBg,
                                borderColor: tempCategory === '' ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.catPillText,
                                { color: tempCategory === '' ? '#FFFFFF' : colors.text },
                              ]}
                            >
                              All
                            </Text>
                          </TouchableOpacity>

                          {categories.map((cat) => {
                            const isSelected = tempCategory === cat;
                            return (
                              <TouchableOpacity
                                key={cat}
                                onPress={() => setTempCategory(isSelected ? '' : cat)}
                                style={[
                                  styles.catPill,
                                  {
                                    backgroundColor: isSelected ? colors.primary : colors.inputBg,
                                    borderColor: isSelected ? colors.primary : colors.border,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.catPillText,
                                    { color: isSelected ? '#FFFFFF' : colors.text },
                                  ]}
                                >
                                  {cat}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Price Range Section */}
                    <View style={[styles.filterSection, isDesktop && styles.desktopFilterSection, { borderBottomColor: colors.border }]}>
                      <View style={styles.sectionHeader}>
                        <DollarSign size={18} color={colors.primary} />
                        <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                          Price Range (BDT)
                        </Text>
                      </View>
                      <View style={styles.priceRow}>
                        <TextInput
                          style={[
                            styles.priceInput,
                            {
                              backgroundColor: colors.inputBg,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          placeholder="Min Price"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="numeric"
                          value={tempMinPrice}
                          onChangeText={setTempMinPrice}
                        />
                        <Text style={[styles.priceDash, { color: colors.textSecondary }]}>to</Text>
                        <TextInput
                          style={[
                            styles.priceInput,
                            {
                              backgroundColor: colors.inputBg,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          placeholder="Max Price"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="numeric"
                          value={tempMaxPrice}
                          onChangeText={setTempMaxPrice}
                        />
                      </View>
                    </View>

                    {/* In Stock Only Switch */}
                    <View style={[styles.filterSection, styles.switchRow, isDesktop && styles.desktopFilterSection, { borderBottomWidth: 0 }]}>
                      <View style={styles.sectionHeader}>
                        <Package size={18} color={colors.primary} />
                        <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                          In-Stock Only
                        </Text>
                      </View>
                      <Switch
                        value={tempInStockOnly}
                        onValueChange={setTempInStockOnly}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={handleResetFilters}
                    style={[styles.resetBtn, { borderColor: colors.border }]}
                  >
                    <RotateCcw size={16} color={colors.textSecondary} />
                    <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset</Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Button title="Apply Filters" onPress={handleApplyFilters} size="md" />
                  </View>
                </View>
              </Pressable>
            </View>
          </Modal>

      <AddToCartSuccessModal
        visible={showAddModal}
        product={selectedProductForCart}
        onClose={() => setShowAddModal(false)}
        onConfirmAdd={handleConfirmAddToCart}
        onViewCart={() => router.push('/(tabs)/cart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // â”€â”€â”€ Header â”€â”€â”€
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  title: { ...typography.h4, marginBottom: spacing.xs },
  // Desktop header
  desktopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  desktopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexShrink: 0,
  },
  desktopResultCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  desktopHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  desktopSearchBox: {
    flex: 1,
    maxWidth: 480,
  },
  // Mobile/tablet header
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.xs,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // â”€â”€â”€ Active filters chips â”€â”€â”€
  activeFiltersRow: {
    borderBottomWidth: 1,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  activeFiltersScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 8,
  },
  activeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // â”€â”€â”€ Product grid â”€â”€â”€
  list: { paddingBottom: 100, paddingTop: spacing.md },
  row: { paddingHorizontal: 8 },
  categoryBar: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },

  // â”€â”€â”€ Pagination â”€â”€â”€
  paginationContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  paginationInfo: {
    fontSize: 13,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNumberBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ellipsis: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 2,
  },

  // ——— Modal — shared ———
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  // Desktop: centered dialog overlay
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Mobile: bottom sheet
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  // Desktop: centered rounded dialog
  modalContentDesktop: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '82%',
    maxWidth: 740,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h4,
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  // Desktop modal: 2-column grid layout
  desktopModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  desktopFilterSection: {
    flex: 1,
    minWidth: 260,
    marginBottom: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  sortGrid: {
    gap: 8,
  },
  // Desktop: sort options in 2 columns
  sortGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalCategoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
  },
  priceDash: {
    fontSize: 18,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
