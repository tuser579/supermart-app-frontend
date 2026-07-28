import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

const OTP_LENGTH = 6;

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, verifyOTP, resendOTP } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter the full OTP');
      return;
    }
    setError('');
    setLoading(true);
    const result = await verifyOTP({ email: user?.email || '', otp: otpString });
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (!canResend || !user?.email) return;
    setCanResend(false);
    setTimer(60);
    setOtp(Array(OTP_LENGTH).fill(''));
    await resendOTP(user.email);
  };

  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter the 6-digit code sent to{'\n'}
          {user?.email || 'your email'}
        </Text>
      </View>

      <Card padding="lg" style={styles.formCard}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: digit ? colors.primary : colors.border,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleOtpChange(index, v)}
              onKeyPress={(e) => handleKeyPress(index, e.nativeEvent.key)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        <Button title="Verify Email" onPress={handleVerify} loading={loading} fullWidth size="lg" />
      </Card>

      <View style={styles.resendContainer}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <Text style={[styles.resendText, { color: colors.primary }]}>Resend OTP</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.timerText, { color: colors.textSecondary }]}>
            Resend code in {timer}s
          </Text>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  formCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '700',
  },
  error: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  resendText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  timerText: {
    ...typography.bodySmall,
  },
});
