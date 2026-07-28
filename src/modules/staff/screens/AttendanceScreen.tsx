import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Clock, CheckCircle, LogIn, LogOut } from 'lucide-react-native';
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

export default function AttendanceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find((a) => a.date === today);

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
      await load();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await staffApi.markAttendance('checkOut');
      await load();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader fullscreen />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Attendance</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Card padding="lg" style={styles.todayCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Status</Text>
          <View style={styles.todayRow}>
            <View style={styles.timeBlock}>
              <LogIn size={20} color={todayRecord?.checkIn ? colors.success : colors.textTertiary} />
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Check In</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}
              </Text>
            </View>
            <View style={styles.timeBlock}>
              <LogOut size={20} color={todayRecord?.checkOut ? colors.error : colors.textTertiary} />
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Check Out</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}
              </Text>
            </View>
          </View>

          {!todayRecord?.checkIn ? (
            <Button title="Mark Check-In" onPress={handleCheckIn} loading={actionLoading} fullWidth size="lg" />
          ) : !todayRecord?.checkOut ? (
            <Button title="Mark Check-Out" onPress={handleCheckOut} loading={actionLoading} variant="danger" fullWidth size="lg" />
          ) : (
            <View style={[styles.completedRow, { backgroundColor: colors.successLight }]}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.completedText, { color: colors.success }]}>Day completed</Text>
            </View>
          )}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
        {attendance.slice(0, 10).map((record) => (
          <Card key={record.id} padding="md" style={styles.historyCard}>
            <View style={styles.historyRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={[styles.historyDate, { color: colors.text }]}>{formatDate(record.date)}</Text>
            </View>
            <View style={styles.historyTimes}>
              <Text style={[styles.historyTime, { color: colors.success }]}>
                In: {record.checkIn ? formatTime(record.checkIn) : '--'}
              </Text>
              <Text style={[styles.historyTime, { color: colors.error }]}>
                Out: {record.checkOut ? formatTime(record.checkOut) : '--'}
              </Text>
            </View>
          </Card>
        ))}
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
  todayCard: { marginBottom: spacing.xl },
  cardTitle: { ...typography.h4, marginBottom: spacing.lg },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  timeBlock: { alignItems: 'center', gap: 6 },
  timeLabel: { ...typography.caption },
  timeValue: { ...typography.h4, fontSize: 20 },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  completedText: { ...typography.body, fontWeight: '600' },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  historyCard: { marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  historyDate: { ...typography.bodySmall, fontWeight: '600' },
  historyTimes: { flexDirection: 'row', gap: 16 },
  historyTime: { ...typography.caption },
});
