import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, LogOut, List, UserCheck, AlertCircle, Briefcase } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import * as adminApi from '../services/adminApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { AdminDashboardStats, TopProduct } from '../../../shared/types/admin.types';
import { formatCurrency } from '../../../shared/utils/formatters';

import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { logout } = useAuth();
  const { isDesktop, isTablet, containerPadding, contentMaxWidth } = useResponsiveLayout();
  const cardWidthStyle = { width: (isDesktop ? '23.5%' : isTablet ? '31%' : '48%') as any };

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [quickOptions, setQuickOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const load = useCallback(async () => {
    try {
      const s = await adminApi.fetchAdminDashboard();
      setStats(s);
      const tp = await adminApi.fetchTopProducts();
      setTopProducts(tp || []);
      const qo = await adminApi.fetchAdminQuickOptions();
      if (qo?.data) setQuickOptions(qo.data);
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

  if (loading) return <Loader fullscreen />;

  const statCards = [
    { icon: DollarSign, label: 'Revenue', value: formatCurrency(stats?.orders?.revenue || 0), color: colors.primary, bg: colors.primaryLight },
    { icon: ShoppingCart, label: 'Pending Orders', value: String(stats?.orders?.pending || 0), color: colors.warning, bg: colors.warningLight },
    { icon: Users, label: 'Users', value: String(stats?.users?.active || 0), color: colors.success, bg: colors.successLight },
    { icon: Briefcase, label: 'Staff', value: String(stats?.staff?.total || 0), color: '#9C27B0', bg: '#F3E5F5' },
    { icon: Package, label: 'Products', value: String(stats?.products?.total || 0), color: '#007AFF', bg: '#E5F1FF' },
    { icon: List, label: 'Total Orders', value: String(stats?.orders?.total || 0), color: colors.primary, bg: colors.primaryLight },
    { icon: UserCheck, label: 'Assigned Orders', value: String(quickOptions?.assignedOrdersOptions?.totalAssignedOrders ?? (stats?.staff?.total || 0)), color: colors.success, bg: colors.successLight },
    { icon: AlertCircle, label: 'Out of Stock', value: String(quickOptions?.outOfStockOptions?.totalOutOfStock ?? (stats?.products?.outOfStock || 0)), color: colors.error, bg: colors.errorLight },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Admin Dashboard</Text>
            <Text style={[styles.title, { color: colors.text }]}>Overview</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={[styles.logoutBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)' }]}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.logoutBtnText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <Card key={index} padding="md" style={[styles.statCard, cardWidthStyle]}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <stat.icon size={22} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Cash on Payment System Analytics & Reports */}
        <Card padding="lg" style={{ marginBottom: spacing.xl, backgroundColor: colors.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <DollarSign size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>COD Financial Analytics</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.warningLight, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Pending COD</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.warning, marginTop: 4 }}>
                {formatCurrency(stats?.cashPayment?.pendingCodAmount ?? quickOptions?.cashPaymentOptions?.pendingCodAmount ?? 0)}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
                {quickOptions?.cashPaymentOptions?.pendingCodOrders ?? 0} orders
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.successLight, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Collected COD</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success, marginTop: 4 }}>
                {formatCurrency(stats?.cashPayment?.collectedCodAmount ?? quickOptions?.cashPaymentOptions?.collectedCodAmount ?? 0)}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>
                {stats?.cashPayment?.totalCodOrders ?? quickOptions?.cashPaymentOptions?.totalCodOrders ?? 0} total COD
              </Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Products</Text>
        <Card padding="none" style={styles.topProductsCard}>
          {topProducts.length > 0 ? (
            topProducts.slice(0, 5).map((item, index) => (
              <View key={item.product?.id || index} style={[styles.topProductRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rank, { color: colors.textTertiary }]}>{index + 1}</Text>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.product?.name || 'Unknown Product'}</Text>
                <Text style={[styles.productSales, { color: colors.primary }]}>{item.totalSold}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No data available</Text>
          )}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Card padding="md" style={[styles.actionCard, cardWidthStyle]}>
            <TouchableOpacity onPress={() => router.push('/admin/products')} activeOpacity={0.8}>
              <Package size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Products</Text>
            </TouchableOpacity>
          </Card>
          <Card padding="md" style={[styles.actionCard, cardWidthStyle]}>
            <TouchableOpacity onPress={() => router.push('/admin/orders')} activeOpacity={0.8}>
              <ShoppingCart size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Orders</Text>
            </TouchableOpacity>
          </Card>
          <Card padding="md" style={[styles.actionCard, cardWidthStyle]}>
            <TouchableOpacity onPress={() => router.push('/admin/users')} activeOpacity={0.8}>
              <Users size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Users</Text>
            </TouchableOpacity>
          </Card>
          <Card padding="md" style={[styles.actionCard, cardWidthStyle]}>
            <TouchableOpacity onPress={() => router.push('/admin/reports')} activeOpacity={0.8}>
              <TrendingUp size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Reports</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </View>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Are you sure you want to logout from Admin Panel?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                style={[styles.modalBtn, { backgroundColor: colors.error }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  greeting: { ...typography.bodySmall, marginBottom: 4 },
  title: { ...typography.h3 },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: 100 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { ...typography.h3, fontSize: 22 },
  statLabel: { ...typography.caption },

  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  topProductsCard: { marginBottom: spacing.xl, overflow: 'hidden' },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: 12,
  },
  rank: { ...typography.h4, fontSize: 18, width: 24 },
  productName: { ...typography.bodySmall, flex: 1, fontWeight: '600' },
  productSales: { ...typography.body, fontWeight: '700' },
  empty: { ...typography.body, textAlign: 'center', padding: 20 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
  },
  actionLabel: { ...typography.bodySmall, fontWeight: '600', marginTop: 8, textAlign: 'center' },
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