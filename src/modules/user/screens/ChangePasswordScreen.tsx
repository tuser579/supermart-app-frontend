import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current || !newPass || !confirm) {
      setError('Please fill in all fields');
      return;
    }
    if (newPass !== confirm) {
      setError('New passwords do not match');
      return;
    }
    if (newPass.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    const res = await changePassword({ currentPassword: current, newPassword: newPass });
    setLoading(false);
    
    if (res.success) {
      router.back();
    } else {
      setError(res.error || 'Failed to change password');
    }
  };

  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.content}>
        <Card padding="lg" style={styles.formCard}>
          <Input
            label="Current Password"
            value={current}
            onChangeText={setCurrent}
            placeholder="Enter current password"
            secureEntry
            leftIcon={<Lock size={20} color={colors.textSecondary} />}
          />
          <Input
            label="New Password"
            value={newPass}
            onChangeText={setNewPass}
            placeholder="Min 8 chars, 1 uppercase, 1 special"
            secureEntry
            leftIcon={<Lock size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Confirm New Password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter new password"
            secureEntry
            leftIcon={<Lock size={20} color={colors.textSecondary} />}
          />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Button title="Update Password" onPress={handleChange} loading={loading} fullWidth size="lg" />
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h4 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  formCard: { marginBottom: spacing.xl },
  error: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
});
