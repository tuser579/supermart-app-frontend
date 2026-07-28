import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Package, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { SalesReport, TopProduct } from '../../../shared/types/admin.types';
import { formatCurrency } from '../../../shared/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;

export default function SalesReportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);
      const r = await adminApi.fetchSalesReport(from, to);
      setReport(r);
      const tp = await adminApi.fetchTopProducts();
      setTopProducts(tp);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader fullscreen />;

  const maxRevenue = report?.data?.length
    ? Math.max(...report.data.map((d) => d.revenue))
    : 1;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Sales Report</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <Card padding="lg" style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statValueWhite}>{formatCurrency(report?.totalRevenue || 0)}</Text>
            <Text style={styles.statLabelWhite}>Total Revenue</Text>
          </Card>
          <Card padding="lg" style={styles.statCard}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{report?.totalOrders || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Orders</Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue (Last 30 Days)</Text>
        <Card padding="md" style={styles.chartCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chartContainer, { minWidth: SCREEN_WIDTH - 64 }]}>
              {report?.data?.map((item, index) => {
                const barHeight = (item.revenue / maxRevenue) * CHART_HEIGHT;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={[styles.bar, { height: Math.max(barHeight, 4), backgroundColor: colors.primary }]} />
                    <Text style={[styles.barLabel, { color: colors.textTertiary }]} numberOfLines={1}>
                      {item.date.slice(5)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Products</Text>
        <Card padding="none" style={styles.topProductsCard}>
          {topProducts.length > 0 ? (
            topProducts.map((item, index) => (
              <View key={item.product?.id || index} style={[styles.topProductRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rank, { color: colors.textTertiary }]}>{index + 1}</Text>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.product?.name || 'Unknown'}</Text>
                <Text style={[styles.productSales, { color: colors.primary }]}>{item.totalSold}</Text>
                <Text style={[styles.productRevenue, { color: colors.textSecondary }]}>
                  {formatCurrency((item.product?.price || 0) * item.totalSold)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>No data yet — place some orders first!</Text>
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
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.xl },
  statCard: { flex: 1, gap: 8 },
  statValueWhite: { ...typography.h3, fontSize: 22, color: '#FFFFFF' },
  statLabelWhite: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  statValue: { ...typography.h3, fontSize: 22 },
  statLabel: { ...typography.caption },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  chartCard: { marginBottom: spacing.xl },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 30,
    gap: 4,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    width: 32,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  barLabel: {
    ...typography.caption,
    fontSize: 8,
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
  },
  topProductsCard: { overflow: 'hidden' },
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
  productRevenue: { ...typography.bodySmall },
  empty: { ...typography.body, textAlign: 'center', padding: 20 },
});
