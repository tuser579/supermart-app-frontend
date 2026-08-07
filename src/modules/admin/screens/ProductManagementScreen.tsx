import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Check,
  Search as SearchIcon,
  Tag,
  Hash,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import * as productApi from '../../user/services/productApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product } from '../../../shared/types/product.types';
import { formatCurrency } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { showToast } from '../../common/Toast';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

const ITEMS_PER_PAGE = 10;

const STOCK_STATUS_OPTIONS = [
  { label: 'All Stock Status', value: 'ALL' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
  { label: 'Low Stock (< 10)', value: 'LOW_STOCK' },
];

export default function ProductManagementScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout() as any;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempSearch, setTempSearch] = useState('');
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempStockStatus, setTempStockStatus] = useState<string>('ALL');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');

  const load = useCallback(async () => {
    try {
      let data = await adminApi.fetchAdminProducts({ limit: 100 });
      if (!data || data.length === 0) {
        const response = await productApi.fetchProducts({ limit: 100 });
        data = response.data;
      }
      setProducts(data || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Derive unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products by Product ID, Name, Brand, Category, Stock Status, Price Range
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query (ID, Name, Brand, Category, SKU)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = p.id?.toLowerCase().includes(q);
        const nameMatch = p.name?.toLowerCase().includes(q);
        const brandMatch = p.brand?.toLowerCase().includes(q);
        const categoryMatch = p.category?.toLowerCase().includes(q);
        const skuMatch = (p as any).sku?.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !brandMatch && !categoryMatch && !skuMatch) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }

      // 3. Stock Status Filter
      if (selectedStockStatus === 'IN_STOCK' && p.stock <= 0) return false;
      if (selectedStockStatus === 'OUT_OF_STOCK' && p.stock > 0) return false;
      if (selectedStockStatus === 'LOW_STOCK' && (p.stock <= 0 || p.stock >= 10)) return false;

      // 4. Price Range Filter
      if (minPrice && p.price < parseFloat(minPrice)) return false;
      if (maxPrice && p.price > parseFloat(maxPrice)) return false;

      return true;
    });
  }, [products, search, selectedCategory, selectedStockStatus, minPrice, maxPrice]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStockStatus, minPrice, maxPrice]);

  // Paginated slice (10 per page)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Active filter count
  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedStockStatus !== 'ALL' ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  // Filter Modal Controls
  const handleOpenFilterModal = () => {
    setTempSearch(search);
    setTempCategory(selectedCategory);
    setTempStockStatus(selectedStockStatus);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setIsFilterModalOpen(true);
  };

  const handleApplyModalFilters = () => {
    setSearch(tempSearch);
    setSelectedCategory(tempCategory);
    setSelectedStockStatus(tempStockStatus);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setIsFilterModalOpen(false);
  };

  const handleResetModalFilters = () => {
    setTempSearch('');
    setTempCategory(null);
    setTempStockStatus('ALL');
    setTempMinPrice('');
    setTempMaxPrice('');
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const targetId = productToDelete.id;
    try {
      setProducts((prev) => prev.filter((p) => p.id !== targetId));
      setProductToDelete(null);

      await adminApi.deleteProduct(targetId);
      await load();
      showToast('success', 'Product Deleted', 'Product removed from database.');
    } catch (e) {
      showToast('error', 'Error', getErrorMessage(e));
      await load();
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <Card padding="md" style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.productRow}>
        <Image
          source={{ uri: item.images[0] || 'https://placehold.co/60x60?text=No+Image' }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.productInfo}>
          <View style={styles.productHeaderRow}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.idBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Hash size={11} color={colors.textSecondary} />
              <Text style={[styles.idBadgeText, { color: colors.textSecondary }]}>
                {item.id?.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.productBrand, { color: colors.textSecondary }]}>
            {item.brand || 'No Brand'} • <Text style={{ color: colors.primary }}>{item.category}</Text>
          </Text>

          <View style={styles.productMeta}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>{formatCurrency(item.price)}</Text>
            <Text
              style={[
                styles.productStock,
                { color: item.stock > 0 ? (item.stock < 10 ? '#EAB308' : colors.success) : colors.error },
              ]}
            >
              Stock: {item.stock} {item.stock <= 0 ? '(Out of Stock)' : item.stock < 10 ? '(Low)' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity
            onPress={() => router.push(`/admin/product-edit?id=${item.id}`)}
            style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
          >
            <Pencil size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionBtn, { backgroundColor: colors.errorLight }]}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                Product Management
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Total {filteredProducts.length} products found
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/admin/product-edit')}
              style={[styles.addProductBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addProductBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {/* Search & Filter Trigger Bar */}
          <View style={styles.searchFilterRow}>
            <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <SearchIcon size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by Product ID, Name, Brand..."
                placeholderTextColor={colors.textTertiary}
                value={search}
                onChangeText={setSearch}
              />
              {Boolean(search) && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleOpenFilterModal}
              style={[
                styles.filterModalBtn,
                {
                  backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.inputBg,
                  borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                },
              ]}
            >
              <SlidersHorizontal size={18} color={activeFilterCount > 0 ? colors.primary : colors.text} />
              <Text style={[styles.filterModalBtnText, { color: activeFilterCount > 0 ? colors.primary : colors.text }]}>
                Filter
              </Text>
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <View style={styles.activeChipsRow}>
              {Boolean(search.trim()) && (
                <View style={[styles.activeChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.activeChipText, { color: colors.primary }]}>ID/Search: "{search}"</Text>
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {Boolean(selectedCategory) && (
                <View style={[styles.activeChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.activeChipText, { color: colors.primary }]}>Cat: {selectedCategory}</Text>
                  <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}

              {selectedStockStatus !== 'ALL' && (
                <View style={[styles.activeChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.activeChipText, { color: colors.primary }]}>
                    Stock: {STOCK_STATUS_OPTIONS.find((s) => s.value === selectedStockStatus)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedStockStatus('ALL')}>
                    <X size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setSelectedCategory(null);
                  setSelectedStockStatus('ALL');
                  setMinPrice('');
                  setMaxPrice('');
                }}
              >
                <Text style={[styles.clearAllText, { color: colors.error }]}>Clear All</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Products List & Pagination */}
      <View style={{ flex: 1, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
        <FlatList
          data={paginatedProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={[styles.list, { paddingHorizontal: containerPadding }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <EmptyState
                icon={<Package size={52} color={colors.textTertiary} />}
                title="No products found"
                subtitle={
                  activeFilterCount > 0
                    ? 'No products match your search or filter parameters.'
                    : 'Add your first product to get started.'
                }
                ctaTitle="Add Product"
                onCtaPress={() => router.push('/admin/product-edit')}
              />
            )
          }
          ListFooterComponent={
            filteredProducts.length > 0 ? (
              <View style={[styles.paginationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.paginationInfoText, { color: colors.textSecondary }]}>
                  Showing <Text style={{ fontWeight: '800', color: colors.text }}>
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}
                  </Text> - <Text style={{ fontWeight: '800', color: colors.text }}>
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                  </Text> of <Text style={{ fontWeight: '800', color: colors.text }}>{filteredProducts.length}</Text> Products
                </Text>

                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={[
                      styles.pageNavBtn,
                      {
                        backgroundColor: currentPage === 1 ? colors.inputBg : colors.surface,
                        borderColor: colors.border,
                        opacity: currentPage === 1 ? 0.5 : 1,
                      },
                    ]}
                  >
                    <ChevronLeft size={16} color={colors.text} />
                    <Text style={[styles.pageNavText, { color: colors.text }]}>Prev</Text>
                  </TouchableOpacity>

                  {/* Page numbers */}
                  <View style={styles.pageNumbersRow}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <TouchableOpacity
                        key={pg}
                        onPress={() => setCurrentPage(pg)}
                        style={[
                          styles.pageNumberBtn,
                          {
                            backgroundColor: currentPage === pg ? colors.primary : colors.inputBg,
                            borderColor: currentPage === pg ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pageNumberText,
                            { color: currentPage === pg ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {pg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={[
                      styles.pageNavBtn,
                      {
                        backgroundColor: currentPage === totalPages ? colors.inputBg : colors.surface,
                        borderColor: colors.border,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.pageNavText, { color: colors.text }]}>Next</Text>
                    <ChevronRight size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
        />
      </View>

      {/* Filter Modal Dialog */}
      <Modal
        visible={isFilterModalOpen}
        animationType={isDesktop ? 'fade' : 'slide'}
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsFilterModalOpen(false)} />

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
              </View>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Product ID & Name Search Section */}
              <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Hash size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Search Product ID / Name / Brand</Text>
                </View>

                <View style={[styles.modalSearchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <SearchIcon size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.modalSearchInput, { color: colors.text }]}
                    placeholder="Search Product ID (e.g. #AB12), Name..."
                    placeholderTextColor={colors.textTertiary}
                    value={tempSearch}
                    onChangeText={setTempSearch}
                  />
                  {Boolean(tempSearch) && (
                    <TouchableOpacity onPress={() => setTempSearch('')}>
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Category Filter Section */}
              {categories.length > 0 && (
                <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <Tag size={16} color={colors.primary} />
                    <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Category</Text>
                  </View>

                  <View style={styles.pillsGrid}>
                    <TouchableOpacity
                      onPress={() => setTempCategory(null)}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor: tempCategory === null ? colors.primary : colors.inputBg,
                          borderColor: tempCategory === null ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.filterPillText, { color: tempCategory === null ? '#FFFFFF' : colors.text }]}>
                        All Categories
                      </Text>
                      {tempCategory === null && <Check size={14} color="#FFFFFF" />}
                    </TouchableOpacity>

                    {categories.map((cat) => {
                      const isSelected = tempCategory === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setTempCategory(cat)}
                          style={[
                            styles.filterPill,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.inputBg,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                            {cat}
                          </Text>
                          {isSelected && <Check size={14} color="#FFFFFF" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Stock Status Section */}
              <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Package size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Stock Availability</Text>
                </View>

                <View style={styles.pillsGrid}>
                  {STOCK_STATUS_OPTIONS.map((opt) => {
                    const isSelected = tempStockStatus === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setTempStockStatus(opt.value)}
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {opt.label}
                        </Text>
                        {isSelected && <Check size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Price Range Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
                <Text style={[styles.filterSectionTitle, { color: colors.text, marginBottom: 8 }]}>Price Range (৳)</Text>
                <View style={styles.priceRow}>
                  <View style={[styles.priceInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>৳</Text>
                    <TextInput
                      style={[styles.priceInput, { color: colors.text }]}
                      placeholder="Min"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      value={tempMinPrice}
                      onChangeText={setTempMinPrice}
                    />
                  </View>

                  <Text style={{ color: colors.textSecondary }}>-</Text>

                  <View style={[styles.priceInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>৳</Text>
                    <TextInput
                      style={[styles.priceInput, { color: colors.text }]}
                      placeholder="Max"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      value={tempMaxPrice}
                      onChangeText={setTempMaxPrice}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={handleResetModalFilters}
                style={[styles.resetBtn, { borderColor: colors.border }]}
              >
                <RotateCcw size={16} color={colors.textSecondary} />
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Button title="Apply Filters" onPress={handleApplyModalFilters} size="md" />
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal
        visible={Boolean(productToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setProductToDelete(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.deleteModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Delete Product</Text>
            <Text style={[styles.deleteModalText, { color: colors.textSecondary }]}>
              Are you sure you want to delete <Text style={{ fontWeight: '700', color: colors.text }}>{productToDelete?.name}</Text>?
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                onPress={() => setProductToDelete(null)}
                style={[styles.deleteModalBtn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={[styles.deleteModalBtn, { backgroundColor: colors.error }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header styles
  header: {
    paddingVertical: spacing.md,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    gap: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Search & Filter Row
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  filterModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Active Chips Row
  activeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Product List
  list: {
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  productName: {
    ...typography.bodySmall,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Platform',
  },
  productBrand: {
    fontSize: 12,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  productStock: {
    fontSize: 11,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pagination Styles
  paginationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  paginationInfoText: {
    fontSize: 13,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  pageNavText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageNumbersRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pageNumberBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  modalContentDesktop: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '82%',
    maxWidth: 620,
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
    fontSize: 18,
    fontWeight: '800',
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
    fontSize: 14,
    fontWeight: '700',
  },
  modalSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  priceInput: {
    flex: 1,
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Delete Modal Center
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 14,
    marginBottom: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  deleteModalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
