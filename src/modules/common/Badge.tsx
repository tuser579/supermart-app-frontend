import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../shared/hooks/useTheme';
import { radius, spacing } from '../../shared/theme/spacing';
import { typography } from '../../shared/theme/typography';
import { OrderStatus } from '../../shared/types/order.types';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const { colors } = useTheme();

  const variants = {
    default: { bg: colors.border, text: colors.text },
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    error: { bg: colors.errorLight, text: colors.error },
    info: { bg: colors.primaryLight, text: colors.primary },
    primary: { bg: colors.primary, text: '#FFFFFF' },
  };

  const v = variants[variant];
  const fontSize = size === 'sm' ? 11 : 13;
  const paddingV = size === 'sm' ? 3 : 6;
  const paddingH = size === 'sm' ? 8 : 12;

  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderRadius: radius.sm }]}>
      <Text style={[styles.text, { color: v.text, fontSize, paddingVertical: paddingV, paddingHorizontal: paddingH }]}>
        {label}
      </Text>
    </View>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variantMap: Record<OrderStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PROCESSING: 'info',
    SHIPPED: 'info',
    OUT_FOR_DELIVERY: 'info',
    DELIVERED: 'success',
    CANCELLED: 'error',
    RETURN_REQUESTED: 'warning',
    RETURNED: 'error',
    ACCEPTED: 'success',
    COMPLETED: 'success',
  };

  const labels: Record<OrderStatus, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    RETURN_REQUESTED: 'Return Requested',
    RETURNED: 'Returned',
    ACCEPTED: 'Accepted',
    COMPLETED: 'Completed',
  };

  return <Badge label={labels[status] ?? status} variant={variantMap[status] ?? 'default'} size="sm" />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  } as ViewStyle,
  text: {
    ...typography.caption,
    fontWeight: '600',
  } as TextStyle,
});
