import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, CheckCircle, LogIn, LogOut, Filter, Calendar, RotateCcw, X, Check } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as staffApi from '../services/staffApi';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Attendance } from '../../../shared/types/staff.types';
import { formatTime, formatDate } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { showToast } from '@/src/modules/common/Toast';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

const MONTHS = [
  { label: 'All Months', value: null },
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 },
];

export default function AttendanceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isDesktop, contentMaxWidth, containerPadding } = useResponsiveLayout() as any;

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Month & Year Filter states
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Modal Filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState<number | null>(null);
  const [tempYear, setTempYear] = useState<number | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find((a) => {
    if (!a || !a.date) return false;
    const dStr = String(a.date).slice(0, 10);
    return dStr === todayStr || String(a.date).startsWith(todayStr);
  });

  const load = useCallback(async () => {
    try {
      const data = await staffApi.fetchAttendance();
      setAttendance(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await staffApi.markAttendance('checkIn');
      showToast('success', 'Checked In', 'Check-In recorded successfully for today!');
      await load();
    } catch (e) {
      showToast('error', 'Check-In Error', getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (isCheckedOut) {
      showToast('warning', 'Already Checked Out', 'Check-out time is already recorded for today.');
      return;
    }
    setActionLoading(true);
    try {
      await staffApi.markAttendance('checkOut');
      showToast('success', 'Checked Out', 'Check-Out recorded successfully for today!');
      await load();
    } catch (e) {
      showToast('error', 'Check-Out Error', getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  // Available Years calculated dynamically from attendance dates
  const availableYears = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const yearSet = new Set<number>([currentYr, currentYr - 1]);
    attendance.forEach((item) => {
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d.getFullYear())) {
          yearSet.add(d.getFullYear());
        }
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [attendance]);

  // Filter attendance records locally by Month & Year
  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      if (!item.date) return true;
      const d = new Date(item.date);
      if (isNaN(d.getTime())) return true;

      if (selectedYear !== null && d.getFullYear() !== selectedYear) {
        return false;
      }
      if (selectedMonth !== null && d.getMonth() !== selectedMonth) {
        return false;
      }
      return true;
    });
  }, [attendance, selectedMonth, selectedYear]);

  const activeFilterCount = (selectedMonth !== null ? 1 : 0) + (selectedYear !== null ? 1 : 0);

  const handleOpenFilterModal = () => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setIsFilterModalOpen(true);
  };

  const handleApplyModalFilters = () => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setIsFilterModalOpen(false);
  };

  const handleResetModalFilters = () => {
    setTempMonth(null);
    setTempYear(null);
  };

  if (loading) return <Loader fullscreen />;

  const isCheckedIn = Boolean(todayRecord?.checkIn);
  const isCheckedOut = Boolean(todayRecord?.checkOut);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Attendance & Duty Shift</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.content, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
        {/* Today's Status & Action Buttons */}
        <Card padding="lg" style={styles.todayCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Attendance Status</Text>

          <View style={styles.todayRow}>
            <View style={[styles.timeBlock, { backgroundColor: isCheckedIn ? colors.successLight : colors.inputBg }]}>
              <LogIn size={22} color={isCheckedIn ? colors.success : colors.textTertiary} />
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Check In Time</Text>
              <Text style={[styles.timeValue, { color: isCheckedIn ? colors.success : colors.text }]}>
                {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}
              </Text>
            </View>

            <View style={[styles.timeBlock, { backgroundColor: isCheckedOut ? 'rgba(239, 68, 68, 0.1)' : colors.inputBg }]}>
              <LogOut size={22} color={isCheckedOut ? colors.error : colors.textTertiary} />
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Check Out Time</Text>
              <Text style={[styles.timeValue, { color: isCheckedOut ? colors.error : colors.text }]}>
                {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}
              </Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsBtnGroup}>
            <TouchableOpacity
              onPress={handleCheckIn}
              disabled={actionLoading || isCheckedIn}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isCheckedIn ? colors.inputBg : colors.success,
                  borderColor: isCheckedIn ? colors.border : colors.success,
                  opacity: actionLoading ? 0.7 : 1,
                },
              ]}
            >
              <LogIn size={18} color={isCheckedIn ? colors.textSecondary : '#FFFFFF'} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isCheckedIn ? colors.textSecondary : '#FFFFFF' },
                ]}
              >
                {isCheckedIn ? 'Checked In ✓' : 'Mark Check-In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCheckOut}
              disabled={actionLoading || isCheckedOut}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isCheckedOut ? colors.inputBg : colors.error,
                  borderColor: isCheckedOut ? colors.border : colors.error,
                  opacity: (actionLoading || isCheckedOut) ? 0.7 : 1,
                },
              ]}
            >
              <LogOut size={18} color={isCheckedOut ? colors.textSecondary : '#FFFFFF'} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isCheckedOut ? colors.textSecondary : '#FFFFFF' },
                ]}
              >
                {isCheckedOut ? 'Checked Out ✓' : 'Mark Check-Out'}
              </Text>
            </TouchableOpacity>
          </View>

          {isCheckedIn && isCheckedOut && (
            <View style={[styles.completedRow, { backgroundColor: colors.successLight }]}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.completedText, { color: colors.success }]}>
                Day Completed (In: {formatTime(todayRecord!.checkIn!)} | Out: {formatTime(todayRecord!.checkOut!)})
              </Text>
            </View>
          )}
        </Card>

        {/* Attendance History Section Header with Month & Year Filter Trigger */}
        <View style={styles.historyHeaderRow}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Attendance History</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Showing {filteredAttendance.length} records
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenFilterModal}
            style={[
              styles.filterTriggerBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.inputBg,
                borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
              },
            ]}
          >
            <Filter size={16} color={activeFilterCount > 0 ? colors.primary : colors.text} />
            <Text style={[styles.filterTriggerText, { color: activeFilterCount > 0 ? colors.primary : colors.text }]}>
              Filter by Month/Year
            </Text>
            {activeFilterCount > 0 && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <View style={[styles.activeChipsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.activeChipsLabel, { color: colors.textSecondary }]}>Active Filters:</Text>

            {selectedMonth !== null && (
              <View style={[styles.activeChipPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Calendar size={12} color={colors.primary} />
                <Text style={[styles.activeChipText, { color: colors.primary }]}>
                  {MONTHS.find((m) => m.value === selectedMonth)?.label}
                </Text>
                <TouchableOpacity onPress={() => setSelectedMonth(null)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {selectedYear !== null && (
              <View style={[styles.activeChipPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.activeChipText, { color: colors.primary }]}>{selectedYear}</Text>
                <TouchableOpacity onPress={() => setSelectedYear(null)}>
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setSelectedMonth(null);
                setSelectedYear(null);
              }}
            >
              <Text style={[styles.clearAllFiltersText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History Records List */}
        {filteredAttendance.length === 0 ? (
          <Card padding="lg" style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Calendar size={42} color={colors.textTertiary} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, marginTop: 10 }}>
              No attendance records found
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              No records match your selected month and year filters.
            </Text>
          </Card>
        ) : (
          filteredAttendance.map((record) => (
            <Card key={record.id} padding="md" style={styles.historyCard}>
              <View style={styles.historyRow}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.historyDate, { color: colors.text }]}>{formatDate(record.date)}</Text>
              </View>
              <View style={styles.historyTimes}>
                <Text style={[styles.historyTime, { color: record.checkIn ? colors.success : colors.textTertiary }]}>
                  In: {record.checkIn ? formatTime(record.checkIn) : '--:--'}
                </Text>
                <Text style={[styles.historyTime, { color: record.checkOut ? colors.error : colors.textTertiary }]}>
                  Out: {record.checkOut ? formatTime(record.checkOut) : '--:--'}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Month and Year Filter Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType={isDesktop ? 'fade' : 'slide'}
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsFilterModalOpen(false)} />

          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
              isDesktop && styles.modalContentDesktop,
            ]}
            onPress={(e) => e.stopPropagation?.()}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Filter size={16} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Attendance by Date</Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Year Selection Section */}
              <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Select Year</Text>
                </View>

                <View style={styles.pillGrid}>
                  <TouchableOpacity
                    onPress={() => setTempYear(null)}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: tempYear === null ? colors.primary : colors.inputBg,
                        borderColor: tempYear === null ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterPillText, { color: tempYear === null ? '#FFFFFF' : colors.text }]}>
                      All Years
                    </Text>
                    {tempYear === null && <Check size={14} color="#FFFFFF" />}
                  </TouchableOpacity>

                  {availableYears.map((yr) => {
                    const isSelected = tempYear === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => setTempYear(yr)}
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {yr}
                        </Text>
                        {isSelected && <Check size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Month Selection Section */}
              <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
                <View style={styles.sectionHeader}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Select Month</Text>
                </View>

                <View style={styles.pillGrid}>
                  {MONTHS.map((m) => {
                    const isSelected = tempMonth === m.value;
                    return (
                      <TouchableOpacity
                        key={m.label}
                        onPress={() => setTempMonth(m.value)}
                        style={[
                          styles.filterPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.inputBg,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {m.label}
                        </Text>
                        {isSelected && <Check size={14} color="#FFFFFF" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={handleResetModalFilters}
                style={[styles.resetBtn, { borderColor: colors.border }]}
              >
                <RotateCcw size={16} color={colors.textSecondary} />
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Button title="Apply Filter" onPress={handleApplyModalFilters} size="md" />
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>
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
  title: { ...typography.h4, fontWeight: '800' },
  content: { paddingVertical: spacing.xl, paddingBottom: 100 },
  todayCard: { marginBottom: spacing.xl },
  cardTitle: { ...typography.h4, fontSize: 17, fontWeight: '700', marginBottom: spacing.lg },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  timeLabel: { ...typography.caption, fontSize: 11, fontWeight: '600' },
  timeValue: { ...typography.h4, fontSize: 18, fontWeight: '800' },
  actionsBtnGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginTop: 4,
  },
  completedText: { fontSize: 12, fontWeight: '700' },

  // History Header & Filter Trigger
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: 10,
    flexWrap: 'wrap',
  },
  sectionTitle: { ...typography.h4, fontSize: 16, fontWeight: '800' },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCountBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Active filter chips bar
  activeChipsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  activeChipsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  // History Card
  historyCard: { marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  historyDate: { ...typography.bodySmall, fontWeight: '700' },
  historyTimes: { flexDirection: 'row', gap: 20 },
  historyTime: { ...typography.caption, fontSize: 12, fontWeight: '600' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalContentDesktop: {
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '80%',
    maxWidth: 620,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.h4,
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterSection: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
