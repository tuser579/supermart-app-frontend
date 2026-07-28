import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Card } from '../../common/Card';
import { OrderStatusBadge } from '../../common/Badge';
import { StatusTimeline } from './StatusTimeline';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Order, PAYMENT_METHOD_LABELS } from '../../../shared/types/order.types';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { colors } = useTheme();
  
  // Normalize payment status for consistent checking
  const paymentStatus = (order.paymentStatus || '').toUpperCase().trim();
  
  // Check payment status with more robust conditions
  const isPaid = ['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL'].includes(paymentStatus);
  const isFailed = ['FAILED', 'FAIL', 'PAYMENT_FAILED', 'DECLINED'].includes(paymentStatus);
  const isRefunded = ['REFUNDED', 'REFUND', 'REFUND_SUCCESS', 'REFUNDED_SUCCESS'].includes(paymentStatus);
  const isPending = ['PENDING', 'WAITING', 'IN_PROGRESS', 'PROCESSING'].includes(paymentStatus);
  
  // Determine badge styling based on payment status
  let badgeLabel = 'UNPAID';
  let badgeBgColor = 'rgba(234,179,8,0.12)';
  let badgeBorderColor = '#EAB308';
  let badgeTextColor = '#EAB308';

  if (isPaid) {
    badgeLabel = 'PAID';
    badgeBgColor = 'rgba(34,197,94,0.12)';
    badgeBorderColor = '#22C55E';
    badgeTextColor = '#22C55E';
  } else if (isRefunded) {
    badgeLabel = 'REFUNDED';
    badgeBgColor = 'rgba(59,130,246,0.12)';
    badgeBorderColor = '#3B82F6';
    badgeTextColor = '#3B82F6';
  } else if (isFailed) {
    badgeLabel = 'FAILED';
    badgeBgColor = 'rgba(239,68,68,0.12)';
    badgeBorderColor = '#EF4444';
    badgeTextColor = '#EF4444';
  } else if (isPending) {
    badgeLabel = 'PENDING';
    badgeBgColor = 'rgba(234,179,8,0.12)';
    badgeBorderColor = '#EAB308';
    badgeTextColor = '#EAB308';
  }
  // Default is UNPAID with yellow styling

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(order)}>
      <Card padding="md" style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.orderId, { color: colors.text }]}>
              #{order.id.slice(-8).toUpperCase()}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(order.createdAt)}
            </Text>
          </View>

          {/* Payment Status Badge - top right */}
          <View
            style={[
              styles.paymentBadge,
              {
                backgroundColor: badgeBgColor,
                borderColor: badgeBorderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.paymentBadgeText,
                {
                  color: badgeTextColor,
                },
              ]}
            >
              {badgeLabel}
            </Text>
          </View>
        </View>

        {/* Order Status Badge below header */}
        <View style={{ marginBottom: spacing.xs }}>
          <OrderStatusBadge status={order.status} />
        </View>

        {/* Step Progress Bar directly on Order Card */}
        <View style={styles.stepProgressWrapper}>
          <StatusTimeline currentStatus={order.status} isCancelled={order.status === 'CANCELLED'} mode="horizontal" />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.footer}>
          <Text style={[styles.itemsCount, { color: colors.textSecondary }]}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
          </Text>

          <Text style={[styles.total, { color: colors.primary }]}>
            {formatCurrency(order.grandTotal || order.totalAmount)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginHorizontal: 4,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderId: {
    ...typography.label,
    fontSize: 15,
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  stepProgressWrapper: {
    marginVertical: spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: {
    ...typography.bodySmall,
    fontSize: 13,
  },
  total: {
    ...typography.price,
    fontSize: 17,
  },
});