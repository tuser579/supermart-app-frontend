import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShoppingBag } from 'lucide-react-native';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
          <ShoppingBag size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue shopping
        </Text>
      </View>

      <Card padding="lg" style={styles.formCard}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          leftIcon={<Mail size={20} color={colors.textSecondary} />}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureEntry
          leftIcon={<Lock size={20} color={colors.textSecondary} />}
        />

        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button title="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={[styles.link, { color: colors.primary }]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
