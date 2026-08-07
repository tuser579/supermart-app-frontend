import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, XCircle, RotateCcw, Clock } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { OrderStatus, ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../../../shared/types/order.types';
import { timeAgo, formatDateTime } from '../../../shared/utils/formatters';

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledBy?: string;
  mode?: 'vertical' | 'horizontal';
  statusHistory?: { status: string; timestamp: string }[];
  assignedStaffName?: string;
  assignedStaffId?: string;
}

export function StatusTimeline({
  currentStatus,
  isCancelled,
  cancellationReason,
  cancelledBy,
  mode = 'vertical',
  statusHistory = [],
  assignedStaffName,
  assignedStaffId,
}: StatusTimelineProps) {
  const { colors } = useTheme();

  const isOrderCancelled = isCancelled || currentStatus === 'CANCELLED';
  const isReturn = currentStatus === 'RETURN_REQUESTED' || currentStatus === 'RETURNED';
  const isCompleted = currentStatus === 'COMPLETED' || currentStatus === 'ACCEPTED';

  const historyItem = statusHistory?.find((h) => h.status === currentStatus) || statusHistory?.[statusHistory.length - 1];

  if (isOrderCancelled) {
    const isByAdmin = cancelledBy === 'ADMIN' || (cancellationReason && cancellationReason.toLowerCase().includes('admin'));
    const cancellationTitle = isByAdmin ? 'Order cancelled by admin' : 'Order cancelled by customer';

    return (
      <View style={[styles.cancelledContainer, mode === 'horizontal' && styles.horizontalPadding]}>
        <View style={[styles.cancelledDot, { backgroundColor: colors.error }]}>
          <XCircle size={14} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[styles.cancelledLabel, { color: colors.error, fontWeight: '700' }]}>{cancellationTitle}</Text>
          {historyItem && (
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {formatDateTime(historyItem.timestamp)} • {timeAgo(historyItem.timestamp)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (isReturn) {
    return (
      <View style={[styles.cancelledContainer, mode === 'horizontal' && styles.horizontalPadding]}>
        <View style={[styles.cancelledDot, { backgroundColor: colors.warning }]}>
          <RotateCcw size={14} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[styles.cancelledLabel, { color: colors.warning }]}>
            {ORDER_STATUS_LABELS[currentStatus] || currentStatus}
          </Text>
          {historyItem && (
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {formatDateTime(historyItem.timestamp)} • {timeAgo(historyItem.timestamp)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={[styles.cancelledContainer, mode === 'horizontal' && styles.horizontalPadding]}>
        <View style={[styles.cancelledDot, { backgroundColor: colors.success }]}>
          <Check size={14} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[styles.cancelledLabel, { color: colors.success }]}>
            Order Completed ✓
          </Text>
          {historyItem && (
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {formatDateTime(historyItem.timestamp)} • {timeAgo(historyItem.timestamp)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  if (mode === 'horizontal') {
    const totalSteps = ORDER_STATUS_FLOW.length;

    return (
      <View style={styles.horizontalContainer}>
        {/* Responsive Connected Dots Track: (•)---(•)---(•)---(•)---(•)---(•) */}
        <View style={styles.dotsTrackRow}>
          {ORDER_STATUS_FLOW.map((status, index) => {
            const isCompleted = index <= safeIndex;
            const isCurrent = index === safeIndex;

            return (
              <React.Fragment key={status}>
                {/* Connecting Line Segment between dots */}
                {index > 0 && (
                  <View
                    style={[
                      styles.dotConnectingLine,
                      {
                        backgroundColor: index <= safeIndex ? colors.primary : colors.border,
                        height: index <= safeIndex ? 3 : 2,
                      },
                    ]}
                  />
                )}

                {/* Step Node Dot */}
                <View
                  style={[
                    styles.stepNodeCircle,
                    {
                      backgroundColor: isCompleted ? colors.primary : colors.surface,
                      borderColor: isCompleted ? colors.primary : colors.border,
                    },
                    isCurrent && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  {isCompleted && !isCurrent && <Check size={8} color="#FFFFFF" />}
                  {isCurrent && <View style={[styles.activeDotInner, { backgroundColor: colors.primary }]} />}
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Status Info Row */}
        <View style={styles.currentStepLabelRow}>
          <View style={styles.statusBadgeRow}>
            <Clock size={12} color={colors.primary} />
            <View>
              <Text style={[styles.currentStepCaption, { color: colors.textSecondary }]}>
                Current Step:{' '}
                <Text style={[styles.currentStepName, { color: colors.primary }]}>
                  {ORDER_STATUS_LABELS[currentStatus] || currentStatus}
                </Text>
              </Text>
              {historyItem && (
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                  {formatDateTime(historyItem.timestamp)} • {timeAgo(historyItem.timestamp)}
                </Text>
              )}
            </View>
          </View>
          <Text style={[styles.stepCountText, { color: colors.textSecondary }]}>
            Step {safeIndex + 1} of {totalSteps}
          </Text>
        </View>
      </View>
    );
  }

  // Vertical mode (default for order details page)
  return (
    <View style={styles.container}>
      {ORDER_STATUS_FLOW.map((status, index) => {
        const isCompleted = index <= safeIndex;
        const isCurrent = index === safeIndex;

        return (
          <View key={status} style={styles.stepRow}>
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isCompleted ? colors.primary : colors.border,
                    borderColor: isCompleted ? colors.primary : colors.border,
                  },
                  isCurrent && { borderWidth: 3, borderColor: colors.primary },
                ]}
              >
                {isCompleted && !isCurrent && <Check size={14} color="#FFFFFF" />}
                {isCurrent && <View style={[styles.innerDot, { backgroundColor: colors.primary }]} />}
              </View>
              {index < ORDER_STATUS_FLOW.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: index < safeIndex ? colors.primary : colors.border,
                    },
                  ]}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.label,
                  {
                    color: isCompleted ? colors.text : colors.textTertiary,
                    fontWeight: isCurrent ? '700' : '400',
                  },
                ]}
              >
                {ORDER_STATUS_LABELS[status]}
              </Text>
              {status === 'CONFIRMED' && (assignedStaffName || assignedStaffId) && (
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 1 }}>
                  👤 Staff Assigned: {assignedStaffName || 'Assigned'}
                </Text>
              )}
              {isCompleted && statusHistory && (
                <View style={{ marginTop: 2 }}>
                  {(() => {
                    const historyItem = statusHistory.find((h) => h.status === status);
                    if (historyItem) {
                      return (
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {formatDateTime(historyItem.timestamp)} • {timeAgo(historyItem.timestamp)}
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: spacing.md,
    height: '100%',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    position: 'absolute',
    top: 24,
    width: 2,
    height: 24,
  },
  label: {
    ...typography.bodySmall,
    flex: 1,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  horizontalPadding: {
    paddingVertical: 4,
  },
  cancelledDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  // Responsive Dot-Dot Track Styles
  horizontalContainer: {
    paddingVertical: spacing.xs,
    width: '100%',
  },
  dotsTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
    marginVertical: 6,
  },
  dotConnectingLine: {
    flex: 1,
    borderRadius: 1.5,
  },
  stepNodeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  currentStepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  currentStepCaption: {
    ...typography.caption,
    fontSize: 12,
  },
  currentStepName: {
    fontWeight: '700',
  },
  stepCountText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
});
