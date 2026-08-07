import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, DollarSign, Package, Star, Briefcase } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as staffApi from '../services/staffApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Earnings } from '../../../shared/types/staff.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

export default function EarningsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await staffApi.fetchEarnings();
      setEarnings(data);
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Earnings</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <Card padding="lg" style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <DollarSign size={24} color="#FFFFFF" />
            <Text style={styles.statValueWhite}>
              {formatCurrency(earnings?.earnings || 0)}
            </Text>
            <Text style={styles.statLabelWhite}>Total Earnings</Text>
          </Card>
          <Card padding="lg" style={styles.statCard}>
            <Briefcase size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(earnings?.salary || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Salary</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card padding="lg" style={styles.statCard}>
            <Package size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {earnings?.totalDeliveries || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Deliveries</Text>
          </Card>
          <Card padding="lg" style={styles.statCard}>
            <Star size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {earnings?.rating || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Deliveries</Text>
        {earnings?.deliveries?.slice(0, 20).map((delivery) => (
          <Card key={delivery.id} padding="md" style={styles.deliveryCard}>
            <View style={styles.deliveryRow}>
              <View>
                <Text style={[styles.deliveryId, { color: colors.text }]}>
                  #{delivery.orderId || delivery.id}
                </Text>
                <Text style={[styles.deliveryDate, { color: colors.textSecondary }]}>
                  {formatDate(delivery.date)}
                </Text>
              </View>
              <Text style={[styles.deliveryAmount, { color: colors.success }]}>
                +{formatCurrency(delivery.amount)}
              </Text>
            </View>  
          </Card>
        ))}

        {(!earnings?.deliveries || earnings.deliveries.length === 0) && (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No earnings yet</Text>
        )}
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  statCard: { flex: 1, gap: 8 },
  statValueWhite: { ...typography.h3, fontSize: 24, color: '#FFFFFF' },
  statLabelWhite: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  statValue: { ...typography.h3, fontSize: 24 },
  statLabel: { ...typography.caption },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md, marginTop: spacing.md },
  deliveryCard: { marginBottom: spacing.sm },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryId: { ...typography.bodySmall, fontWeight: '600' },
  deliveryDate: { ...typography.caption, marginTop: 2 },
  deliveryAmount: { ...typography.body, fontWeight: '700' },
  empty: { ...typography.body, textAlign: 'center', marginTop: 40 },
});
