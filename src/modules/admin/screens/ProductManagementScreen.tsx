import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Image, Platform, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Pencil, Trash2, Package } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import * as productApi from '../../user/services/productApi';
import { getDeletedProducts, saveDeletedProduct } from '../../../shared/utils/storage';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { SearchBar } from '../../common/SearchBar';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Product } from '../../../shared/types/product.types';
import { formatCurrency } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';

export default function ProductManagementScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const load = useCallback(async () => {
    try {
      let data = await adminApi.fetchAdminProducts({ limit: 100 });
      if (!data || data.length === 0) {
        const response = await productApi.fetchProducts({ limit: 100 });
        data = response.data;
      }
      
      const deletedIds = await getDeletedProducts();
      data = data.filter((p: Product) => !deletedIds.includes(p.id));

      setProducts(data);
      setFiltered(data);
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

  useEffect(() => {
    setFiltered(
      products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, products]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await adminApi.deleteProduct(productToDelete.id);
      await saveDeletedProduct(productToDelete.id);
      // Locally remove from state to reflect immediately, bypassing API cache
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setFiltered(prev => prev.filter(p => p.id !== productToDelete.id));
    } catch (e) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setProductToDelete(null);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <Card padding="md" style={styles.productCard}>
      <View style={styles.productRow}>
        <Image
          source={{ uri: item.images[0] || 'https://placehold.co/60x60?text=No+Image' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.productBrand, { color: colors.textSecondary }]}>{item.brand}</Text>
          <View style={styles.productMeta}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>{formatCurrency(item.price)}</Text>
            <Text style={[styles.productStock, { color: item.stock > 0 ? colors.success : colors.error }]}>
              Stock: {item.stock}
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
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Products</Text>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          style={{ marginTop: spacing.sm, marginBottom: 0 }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <EmptyState
              icon={<Package size={48} color={colors.textTertiary} />}
              title="No products found"
              subtitle="Add your first product"
              ctaTitle="Add Product"
              onCtaPress={() => router.push('/admin/product-edit')}
            />
          )
        }
      />

      <TouchableOpacity
        onPress={() => router.push('/admin/product-edit')}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={!!productToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setProductToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Product</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Are you sure you want to delete {productToDelete?.name}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setProductToDelete(null)}
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={[styles.modalBtn, { backgroundColor: colors.error }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Delete</Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { ...typography.h3, marginBottom: spacing.xs },
  list: { padding: spacing.lg, paddingBottom: 100 },
  productCard: { marginBottom: spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productImage: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: '#F5F5F5' },
  productInfo: { flex: 1 },
  productName: { ...typography.bodySmall, fontWeight: '600', marginBottom: 2 },
  productBrand: { ...typography.caption, marginBottom: 4 },
  productMeta: { flexDirection: 'row', gap: 12 },
  productPrice: { ...typography.bodySmall, fontWeight: '700' },
  productStock: { ...typography.caption },
  productActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { ...typography.h3, marginBottom: 12 },
  modalText: { ...typography.body, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
