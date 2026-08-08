import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Search as SearchIcon,
  X,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import * as orderApi from '../services/orderApi';
import { OrderCard } from '../components/OrderCard';
import { ReceiptModal } from '../components/ReceiptModal';
import { downloadReceiptPdf } from '../../../shared/utils/receiptPdfGenerator';
import { EmptyState } from '../../common/EmptyState';
import { Loader } from '../../common/Loader';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order } from '../../../shared/types/order.types';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: { label: string; value: string | null }[] = [
  { label: 'All Orders', value: null },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Return Requested', value: 'RETURN_REQUESTED' },
  { label: 'Returned', value: 'RETURNED' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout() as any;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [tempActiveTab, setTempActiveTab] = useState<string | null>(null);

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  const load = useCallback(async (status?: string | null) => {
    setLoading(true);
    try {
      const response = await orderApi.fetchOrders({ status: status || undefined, limit: 50 });
      setOrders(response.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [load, activeTab]);

  useFocusEffect(
    useCallback(() => {
      load(activeTab);
    }, [load, activeTab])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(activeTab);
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/order/${order.id}`);
  };

  // Open modal handler
  const handleOpenFilterModal = () => {
    setTempSearchQuery(searchQuery);
    setTempActiveTab(activeTab);
    setIsFilterModalOpen(true);
  };

  // Apply modal filters
  const handleApplyModalFilters = () => {
    setSearchQuery(tempSearchQuery);
    setActiveTab(tempActiveTab);
    setIsFilterModalOpen(false);
  };

  // Reset modal filters
  const handleResetModalFilters = () => {
    setTempSearchQuery('');
    setTempActiveTab(null);
  };

  // Filter orders locally by search query (Order ID, Invoice ID, Trx ID, Item name)
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((ord) => {
        const idMatch = ord.id?.toLowerCase().includes(q);
        const refMatch = ord.orderId?.toLowerCase().includes(q) || ord.orderNumber?.toLowerCase().includes(q);
        const trxMatch = ord.transactionId?.toLowerCase().includes(q);
        const itemMatch = ord.items?.some((i) =>
          (i.product?.name || i.productName || '').toLowerCase().includes(q)
        );
        return idMatch || refMatch || trxMatch || itemMatch;
      });
    }
    return list;
  }, [orders, searchQuery]);

  // Active filter count
  const activeFilterCount = (activeTab ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  // Order stats summary
  const orderStats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'ACCEPTED'].includes(o.status)
    ).length;
    const completed = orders.filter((o) =>
      ['DELIVERED', 'COMPLETED'].includes(o.status)
    ).length;
    return { total, active, completed };
  }, [orders]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: containerPadding,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Package size={isDesktop ? 26 : 22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>My Orders</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Track, view receipts, and search all your purchases
              </Text>
            </View>
          </View>

          {/* Filter Modal Trigger Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenFilterModal}
            style={[
              styles.filterTriggerBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.inputBg,
                borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
              },
            ]}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? colors.primary : colors.text} />
            <Text style={[styles.filterTriggerText, { color: activeFilterCount > 0 ? colors.primary : colors.text }]}>
              Filter & Search
            </Text>
            {activeFilterCount > 0 && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Stat Badges for Desktop */}
          {isDesktop && (
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <ShoppingBag size={18} color={colors.primary} />
                <View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{orderStats.total}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                </View>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Clock size={18} color="#EAB308" />
                <View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{orderStats.active}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
                </View>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <CheckCircle2 size={18} color="#22C55E" />
                <View>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{orderStats.completed}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Delivered</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>


      {/* Active Filter Chips Bar (Search query or status tags) */}
      {activeFilterCount > 0 && (
        <View style={[styles.activeChipsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.activeChipsInner, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
            <Text style={[styles.activeChipsLabel, { color: colors.textSecondary }]}>Active Filters:</Text>
            
            {Boolean(searchQuery.trim()) && (
              <View style={[styles.activeChipPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <SearchIcon size={12} color={colors.primary} />
                <Text style={[styles.activeChipText, { color: colors.primary }]}>"{searchQuery}"</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {Boolean(activeTab) && (
              <View style={[styles.activeChipPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.activeChipText, { color: colors.primary }]}>
                  Status: {TABS.find((t) => t.value === activeTab)?.label}
                </Text>
                <TouchableOpacity onPress={() => setActiveTab(null)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setActiveTab(null);
              }}
            >
              <Text style={[styles.clearAllFiltersText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Orders Grid/List */}
      <View style={{ flex: 1, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'desktop-grid-2' : 'mobile-list-1'}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <View style={isDesktop ? styles.gridCardWrap : styles.fullWidthCardWrap}>
              <OrderCard
                order={item}
                onPress={handleOrderPress}
                onViewReceipt={(ord) => setSelectedReceiptOrder(ord)}
                onDownloadReceipt={(ord) => downloadReceiptPdf(ord, user)}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: containerPadding },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            loading ? (
              <Loader />
            ) : (
              <EmptyState
                icon={<Package size={52} color={colors.textTertiary} />}
                title="No orders found"
                subtitle={
                  activeFilterCount > 0
                    ? "No orders match your filter criteria or search query."
                    : "You haven't placed any orders yet."
                }
                ctaTitle="Start Shopping"
                onCtaPress={() => router.push('/')}
              />
            )
          }
        />
      </View>

      {/* Filter Modal Dialog / Bottom Sheet */}
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Orders</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* Search Section */}
              <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <SearchIcon size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                    Search Order ID / Invoice ID / Item
                  </Text>
                </View>
                <View style={[styles.searchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <SearchIcon size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by Order ID, Invoice, Trx ID..."
                    placeholderTextColor={colors.textTertiary}
                    value={tempSearchQuery}
                    onChangeText={setTempSearchQuery}
                  />
                  {Boolean(tempSearchQuery) && (
                    <TouchableOpacity onPress={() => setTempSearchQuery('')}>
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Status Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Package size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Order Status</Text>
                </View>
                <View style={styles.statusGrid}>
                  {TABS.map((tab) => {
                    const isSelected = tempActiveTab === tab.value;
                    return (
                      <TouchableOpacity
                        key={tab.label}
                        onPress={() => setTempActiveTab(tab.value)}
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {tab.label}
                        </Text>
                        {isSelected && <Check size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
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

      {/* Receipt Modal */}
      <ReceiptModal
        visible={Boolean(selectedReceiptOrder)}
        order={selectedReceiptOrder}
        user={user}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header styles
  header: {
    paddingVertical: spacing.lg,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 220,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Filter Trigger Button
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 110,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Tabs bar
  tabsBar: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    width: '100%',
  },
  tabsInner: {
    width: '100%',
    alignSelf: 'center',
  },
  tabsWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tabsScrollContent: {
    gap: 8,
    paddingRight: spacing.lg,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Active filter chips bar
  activeChipsBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    width: '100%',
  },
  activeChipsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  activeChipsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  // Grid layout styles
  listContent: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  gridCardWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 320,
  },
  fullWidthCardWrap: {
    width: '100%',
    marginBottom: spacing.md,
    minHeight: 320,
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
    maxWidth: 680,
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
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
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
});
