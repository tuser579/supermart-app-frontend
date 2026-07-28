import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, Lock } from 'lucide-react-native';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    const result = await register({ name, email, phone, password });
    setLoading(false);
    if (result.success) {
      router.push('/otp');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join Supermart for fresh groceries
        </Text>
      </View>

      <Card padding="lg" style={styles.formCard}>
        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          leftIcon={<User size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          leftIcon={<Mail size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="01XXXXXXXXX"
          keyboardType="phone-pad"
          leftIcon={<Phone size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Min 8 chars, 1 uppercase, 1 special"
          secureEntry
          leftIcon={<Lock size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Re-enter password"
          secureEntry
          leftIcon={<Lock size={20} color={colors.textSecondary} />}
        />

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        <Button title="Create Account" onPress={handleRegister} loading={loading} fullWidth size="lg" />
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  formCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  error: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  footerText: {
    ...typography.bodySmall,
  },
  link: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
