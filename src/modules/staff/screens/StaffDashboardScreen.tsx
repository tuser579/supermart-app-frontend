import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, RefreshControl, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Truck, DollarSign, Star, Package, Clock, LogOut, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { showToast } from '@/src/modules/common/Toast';
import { useAuth } from '../../auth/hooks/useAuth';
import * as staffApi from '../services/staffApi';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { Button } from '../../common/Button';
import { OrderStatusBadge } from '../../common/Badge';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { StaffProfile, StaffQuickOptions } from '../../../shared/types/staff.types';
import { formatCurrency } from '../../../shared/utils/formatters';

import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function StaffDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { logout, user } = useAuth();
  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [quickOptions, setQuickOptions] = useState<StaffQuickOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [available, setAvailable] = useState(false);
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
      const [p, qo] = await Promise.all([
        staffApi.fetchStaffProfile().catch(() => null),
        staffApi.fetchStaffQuickOptions().catch(() => null),
      ]);

      if (p) {
        setProfile(p);
        setAvailable(p.isAvailable);
      }
      if (qo) {
        setQuickOptions(qo);
        if (!p) {
          setAvailable(qo.profile.isAvailable);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleToggleAvailability = async (value: boolean) => {
    setAvailable(value);
    try {
      await staffApi.updateAvailability(value);
    } catch (e) {
      setAvailable(!value);
    }
  };

  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const handleDashboardCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      await staffApi.markAttendance('checkIn');
      showToast('success', 'Checked In', 'Check-In recorded successfully for today!');
      await load();
    } catch (e) {
      showToast('error', 'Check-In Error', (e as any)?.message || 'Failed to check in');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleDashboardCheckOut = async () => {
    if (quickOptions?.todayAttendance && !quickOptions.todayAttendance.canCheckOut) {
      showToast('warning', 'Already Checked Out', 'Check-out time is already recorded for today.');
      return;
    }
    setAttendanceLoading(true);
    try {
      await staffApi.markAttendance('checkOut');
      showToast('success', 'Checked Out', 'Check-Out recorded successfully for today!');
      await load();
    } catch (e) {
      showToast('error', 'Check-Out Error', (e as any)?.message || 'Failed to check out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  if (loading) return <Loader fullscreen />;

  const displayName = profile?.user?.name || user?.name;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Staff Dashboard</Text>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {displayName ? `Welcome, ${displayName}` : 'Welcome back'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={[styles.logoutBtn, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)' }]}
          >
            <LogOut size={18} color={colors.error} />
            <Text style={[styles.logoutBtnText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Availability Toggle */}
        <Card padding="lg" style={[styles.availabilityCard, { backgroundColor: available ? colors.successLight : colors.errorLight }]}>
          <View style={styles.availabilityRow}>
            <View style={[styles.availabilityDot, { backgroundColor: available ? colors.success : colors.error }]} />
            <Text style={[styles.availabilityText, { color: colors.text }]}>
              {available ? 'Available for deliveries' : 'Not available'}
            </Text>
            <Switch
              value={available}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: colors.error, true: colors.success }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Today Attendance Direct Action Banner */}
        <Card padding="md" style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Clock size={20} color={colors.primary} />
              <View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Attendance</Text>
                <Text style={[styles.bodyText, { color: colors.text, fontWeight: '700' }]}>
                  {quickOptions?.todayAttendance?.canCheckIn
                    ? 'Not Checked In'
                    : quickOptions?.todayAttendance?.canCheckOut
                    ? 'Checked In (Pending Checkout)'
                    : 'Attendance Completed'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {quickOptions?.todayAttendance?.canCheckIn ? (
                <Button
                  title="Check In"
                  size="sm"
                  loading={attendanceLoading}
                  onPress={handleDashboardCheckIn}
                />
              ) : quickOptions?.todayAttendance?.canCheckOut ? (
                <Button
                  title="Check Out"
                  size="sm"
                  variant="danger"
                  loading={attendanceLoading}
                  onPress={handleDashboardCheckOut}
                />
              ) : (
                <Button
                  title="Checked Out ✓"
                  size="sm"
                  disabled
                  onPress={() => {}}
                />
              )}
              <TouchableOpacity
                onPress={() => router.push('/staff/attendance')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.sm,
                  backgroundColor: colors.inputBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>Logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Key Metrics Overview */}
        <View style={styles.statsRow}>
          <Card padding="md" style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Truck size={22} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {quickOptions?.workload?.activeDeliveriesCount ?? (profile?.totalDeliveries || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Deliveries</Text>
          </Card>

          <Card padding="md" style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
              <CheckCircle2 size={22} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {quickOptions?.workload?.completedDeliveriesTodayCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Delivered Today</Text>
          </Card>

          <Card padding="md" style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
              <Star size={22} color={colors.warning} fill={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {(quickOptions?.profile?.rating || profile?.rating || 0).toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
          </Card>
        </View>

        {/* Cash Collection Summary */}
        <Card padding="lg" style={{ marginBottom: spacing.xl, backgroundColor: colors.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
            <DollarSign size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Cash Collection Summary</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.warningLight, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Pending Cash</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.warning, marginTop: 4 }}>
                {formatCurrency(quickOptions?.cashSummary?.pendingCashToCollect ?? 0)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.successLight, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Today Collected</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success, marginTop: 4 }}>
                {formatCurrency(quickOptions?.cashSummary?.cashCollectedToday ?? 0)}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>Total Collected</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary, marginTop: 4 }}>
                {formatCurrency(quickOptions?.cashSummary?.totalCashCollected ?? 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Recent Assigned Active Orders */}
        {quickOptions?.recentAssignedOrders && quickOptions.recentAssignedOrders.length > 0 && (
          <View style={{ marginBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Recent Active Orders</Text>
              <TouchableOpacity onPress={() => router.push('/staff/orders')}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>View All</Text>
              </TouchableOpacity>
            </View>

            {quickOptions.recentAssignedOrders.map((ord: any) => (
              <TouchableOpacity
                key={ord.id}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/staff/order/[id]', params: { id: ord.id } })}
              >
                <Card padding="md" style={{ marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>
                        #{ord.orderId || ord.orderNumber || ord.id}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        {ord.user?.name ? `Customer: ${ord.user.name}` : 'Assigned Delivery'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <OrderStatusBadge status={ord.status} />
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </View>
                  </View>

                  {staffApi.canShowRecordAndCompletedButton(ord) && (
                    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
                      <TouchableOpacity
                        onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            await staffApi.recordCashPayment(ord.id);
                            await load();
                            showToast('success', 'Payment Recorded', 'Cash payment recorded and order is now COMPLETED!');
                          } catch (err: any) {
                            showToast('error', 'Error', err?.message || 'Failed to record payment');
                          }
                        }}
                        style={{
                          backgroundColor: colors.success,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: radius.md,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                          ✓ Record and Completed
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <Card padding="none" style={styles.menuCard}>
          <Button
            title="View Assigned Orders"
            onPress={() => router.push('/staff/orders')}
            variant="ghost"
            leftIcon={<Package size={20} color={colors.primary} />}
            style={{ justifyContent: 'space-between' }}
          />
          <Button
            title="Mark Attendance"
            onPress={() => router.push('/staff/attendance')}
            variant="ghost"
            leftIcon={<Clock size={20} color={colors.primary} />}
            style={{ justifyContent: 'space-between' }}
          />
          <Button
            title="View Earnings"
            onPress={() => router.push('/staff/earnings')}
            variant="ghost"
            leftIcon={<DollarSign size={20} color={colors.primary} />}
            style={{ justifyContent: 'space-between' }}
          />
          <Button
            title="Logout from Staff Panel"
            onPress={handleLogout}
            variant="ghost"
            leftIcon={<LogOut size={20} color={colors.error} />}
            style={{ justifyContent: 'space-between' }}
            textStyle={{ color: colors.error }}
          />
        </Card>
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
              Are you sure you want to logout from Staff Panel?
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
    gap: 12,
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
  availabilityCard: { marginBottom: spacing.lg },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityText: { ...typography.body, fontWeight: '600', flex: 1 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { ...typography.h3, fontSize: 20 },
  statLabel: { ...typography.caption, textAlign: 'center' },
  bodyText: { ...typography.bodySmall },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  menuCard: { gap: 4 },
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
