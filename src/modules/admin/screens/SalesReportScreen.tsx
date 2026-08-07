import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Package, DollarSign, Calendar, RefreshCw, Clock, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { SalesReport, TopProduct, AdminDashboardStats } from '../../../shared/types/admin.types';
import { formatCurrency } from '../../../shared/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 180;

type PeriodOption = '7d' | '30d' | 'month' | 'all';

export default function SalesReportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');

  const load = useCallback(async (period: PeriodOption = selectedPeriod) => {
    try {
      const now = new Date();
      let fromDate: Date;
      if (period === '7d') {
        fromDate = new Date(now.getTime() - 7 * 86400000);
      } else if (period === 'month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'all') {
        fromDate = new Date(now.getFullYear() - 1, 0, 1);
      } else {
        // '30d'
        fromDate = new Date(now.getTime() - 30 * 86400000);
      }

      const from = fromDate.toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);

      const [r, tp, dash] = await Promise.all([
        adminApi.fetchSalesReport(from, to),
        adminApi.fetchTopProducts(),
        adminApi.fetchAdminDashboard().catch(() => null),
      ]);

      setReport(r);
      setTopProducts(tp || []);
      if (dash) setDashboardStats(dash);
    } catch (e) {
      console.warn('SalesReportScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    load(selectedPeriod);
  }, [selectedPeriod, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(selectedPeriod);
  };

  const handlePeriodChange = (period: PeriodOption) => {
    setSelectedPeriod(period);
  };

  if (loading && !refreshing) return <Loader fullscreen />;

  const chartItems = report?.data || [];
  const maxRevenue = chartItems.length
    ? Math.max(...chartItems.map((d) => d.revenue), 1)
    : 1;

  const totalRevenue = report?.totalRevenue ?? dashboardStats?.orders?.revenue ?? 0;
  const totalOrders = report?.totalOrders ?? dashboardStats?.orders?.total ?? 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Sales & Revenue Report</Text>
        <TouchableOpacity onPress={onRefresh} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <RefreshCw size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
          {(
            [
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: 'month', label: 'This Month' },
              { key: 'all', label: 'All Time' },
            ] as const
          ).map((item) => {
            const isActive = selectedPeriod === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => handlePeriodChange(item.key)}
                style={[
                  styles.periodTab,
                  isActive && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    { color: isActive ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary Metrics */}
        <View style={styles.statsRow}>
          <Card padding="lg" style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statValueWhite}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.statLabelWhite}>Total Revenue</Text>
          </Card>

          <Card padding="lg" style={styles.statCard}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{totalOrders}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
          </Card>
        </View>

        {/* Secondary Metrics */}
        <View style={[styles.statsRow, { marginBottom: spacing.lg }]}>
          <Card padding="md" style={styles.statCard}>
            <Text style={[styles.statValueSmall, { color: colors.text }]}>{formatCurrency(avgOrderValue)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Order Value</Text>
          </Card>

          {dashboardStats?.cashPayment ? (
            <Card padding="md" style={styles.statCard}>
              <Text style={[styles.statValueSmall, { color: colors.success }]}>
                {formatCurrency(dashboardStats.cashPayment.collectedCodAmount || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>COD Collected</Text>
            </Card>
          ) : (
            <Card padding="md" style={styles.statCard}>
              <Text style={[styles.statValueSmall, { color: colors.primary }]}>{topProducts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Top Selling Items</Text>
            </Card>
          )}
        </View>

        {/* COD Financial Analytics Breakdown if available */}
        {dashboardStats?.cashPayment && (
          <Card padding="md" style={{ marginBottom: spacing.xl, backgroundColor: colors.surface }}>
            <Text style={[styles.subSectionTitle, { color: colors.text }]}>COD Cash Breakdown</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1, backgroundColor: colors.warningLight, padding: spacing.md, borderRadius: radius.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} color={colors.warning} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Pending Collection</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.warning, marginTop: 4 }}>
                  {formatCurrency(dashboardStats.cashPayment.pendingCodAmount || 0)}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.successLight, padding: spacing.md, borderRadius: radius.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={14} color={colors.success} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Completed COD</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.success, marginTop: 4 }}>
                  {formatCurrency(dashboardStats.cashPayment.collectedCodAmount || 0)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Chart */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Trends</Text>
        <Card padding="md" style={styles.chartCard}>
          {chartItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chartContainer, { minWidth: Math.max(SCREEN_WIDTH - 64, chartItems.length * 40) }]}>
                {chartItems.map((item, index) => {
                  const barHeight = (item.revenue / maxRevenue) * CHART_HEIGHT;
                  return (
                    <View key={index} style={styles.barContainer}>
                      <Text style={[styles.barValueText, { color: colors.textSecondary }]}>
                        {item.revenue > 0 ? (item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue) : ''}
                      </Text>
                      <View style={[styles.bar, { height: Math.max(barHeight, 6), backgroundColor: colors.primary }]} />
                      <Text style={[styles.barLabel, { color: colors.textTertiary }]} numberOfLines={1}>
                        {item.date.length > 5 ? item.date.slice(5) : item.date}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No trend data available for this period.</Text>
          )}
        </Card>

        {/* Top Selling Products */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Selling Products</Text>
        <Card padding="none" style={styles.topProductsCard}>
          {topProducts.length > 0 ? (
            topProducts.map((item, index) => {
              const productName = item.product?.name || 'Product';
              const price = item.product?.price || 0;
              const sold = item.totalSold || 0;
              const revenue = price * sold;

              return (
                <View key={item.product?.id || index} style={[styles.topProductRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.rankBadge, { backgroundColor: index < 3 ? colors.primaryLight : colors.inputBg }]}>
                    <Text style={[styles.rank, { color: index < 3 ? colors.primary : colors.textSecondary }]}>
                      #{index + 1}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                      {productName}
                    </Text>
                    {price > 0 && (
                      <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                        {formatCurrency(price)} each
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.productSales, { color: colors.primary }]}>{sold} sold</Text>
                    {revenue > 0 && (
                      <Text style={[styles.productRevenue, { color: colors.textSecondary }]}>
                        {formatCurrency(revenue)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No top selling products recorded yet.</Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h4 },
  content: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 },

  periodSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  periodTabText: {
    ...typography.caption,
    fontWeight: '600',
  },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  statCard: { flex: 1, gap: 6 },
  statValueWhite: { ...typography.h3, fontSize: 20, color: '#FFFFFF' },
  statLabelWhite: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  statValue: { ...typography.h3, fontSize: 20 },
  statValueSmall: { ...typography.h4, fontSize: 17 },
  statLabel: { ...typography.caption },

  sectionTitle: { ...typography.h4, marginBottom: spacing.sm, marginTop: spacing.sm },
  subSectionTitle: { ...typography.bodySmall, fontWeight: '700' },

  chartCard: { marginBottom: spacing.lg },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 45,
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    width: 36,
  },
  barValueText: {
    ...typography.caption,
    fontSize: 9,
    marginBottom: 4,
  },
  bar: {
    width: 22,
    borderRadius: 4,
  },
  barLabel: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 6,
    transform: [{ rotate: '-30deg' }],
  },

  topProductsCard: { overflow: 'hidden' },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: { ...typography.caption, fontWeight: '700' },
  productName: { ...typography.bodySmall, fontWeight: '600' },
  productPrice: { ...typography.caption, fontSize: 11, marginTop: 2 },
  productSales: { ...typography.bodySmall, fontWeight: '700' },
  productRevenue: { ...typography.caption, fontSize: 11, marginTop: 2 },
  empty: { ...typography.body, textAlign: 'center', padding: 24 },
});
