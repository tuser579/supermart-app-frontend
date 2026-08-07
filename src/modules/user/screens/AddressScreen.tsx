import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as addressApi from '../services/addressApi';
import { AddressCard } from '../components/AddressCard';
import { Loader } from '../../common/Loader';
import { EmptyState } from '../../common/EmptyState';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Address } from '../../../shared/types/address.types';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { showToast } from '../../common/Toast';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function AddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { contentMaxWidth, containerPadding } = useResponsiveLayout();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await addressApi.fetchAddresses();
      setAddresses(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleEdit = (addr: Address) => {
    router.push(`/address-edit?id=${addr.id}`);
  };

  const handleDelete = (addr: Address) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressApi.deleteAddress(addr.id);
              showToast('success', 'Address Deleted', 'Address has been deleted');
              await load();
            } catch (e) {
              showToast('error', 'Error', getErrorMessage(e));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>My Addresses</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {loading ? (
        <Loader fullscreen />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
              <AddressCard address={item} onEdit={handleEdit} onDelete={handleDelete} />
            </View>
          )}
          contentContainerStyle={[styles.list, { paddingHorizontal: containerPadding }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MapPin size={48} color={colors.textTertiary} />}
              title="No saved addresses"
              subtitle="Add an address for faster checkout"
              ctaTitle="Add Address"
              onCtaPress={() => router.push('/address-edit')}
            />
          }
        />
      )}

      <TouchableOpacity
        onPress={() => router.push('/address-edit')}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  list: { padding: spacing.lg, paddingBottom: 100 },
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
});
