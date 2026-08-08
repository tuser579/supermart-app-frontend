import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShoppingBag, ArrowRight, Truck, Sparkles, ShieldCheck } from 'lucide-react-native';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login } = useAuth();
  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout() as any;

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
    if (result.success && result.user) {
      if (result.user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (result.user.role === 'STAFF') {
        router.replace('/staff/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setError(result.error || 'Invalid email or password');
    }
  };

  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={[styles.mainWrapper, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
        <Card
          padding="none"
          style={[
            styles.splitCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              flexDirection: isDesktop ? 'row' : 'column',
              maxWidth: isDesktop ? undefined : 440,
              alignSelf: isDesktop ? 'stretch' : 'center',
              width: '100%',
            },
          ]}
        >
          {/* Left Hero Side (Featured ONLY on Desktop) */}
          {isDesktop && (
            <View
              style={[
                styles.heroSide,
                {
                  backgroundColor: colors.primaryLight + '50',
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                  padding: spacing.xxl,
                },
              ]}
            >
              <View style={[styles.logoWrap, { backgroundColor: colors.primaryLight }]}>
                <ShoppingBag size={36} color={colors.primary} />
              </View>

              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Shop Fresh & Organic Groceries Online
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                Get daily fresh produce, dairy, bakery, & household essentials delivered right to your doorstep.
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                    <Truck size={18} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>Fast Express Delivery</Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Delivered fresh to your door</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Sparkles size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>100% Quality Guaranteed</Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Handpicked organic produce</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                    <ShieldCheck size={18} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>Secure & Easy Payments</Text>
                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Cash on Delivery & Mobile Banking</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Form Side */}
          <View style={[styles.formSide, { padding: isDesktop ? spacing.xxl : spacing.xl }]}>
            {!isDesktop && (
              <View style={styles.mobileLogoHeader}>
                <View style={[styles.logoWrapMobile, { backgroundColor: colors.primaryLight }]}>
                  <ShoppingBag size={28} color={colors.primary} />
                </View>
              </View>
            )}

            <View style={[styles.formHeader, !isDesktop && { alignItems: 'center' }]}>
              <Text style={[styles.title, { color: colors.text }, !isDesktop && { textAlign: 'center' }]}>
                Welcome Back 👋
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }, !isDesktop && { textAlign: 'center' }]}>
                Sign in to access your orders & account
              </Text>
            </View>

            <Input
              label="Email Address"
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

            {Boolean(error) && (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '12', borderColor: colors.error + '35' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={[styles.link, { color: colors.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  splitCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  // Hero side
  heroSide: {
    flex: 1,
    justifyContent: 'center',
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 11,
  },

  // Form side
  formSide: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 280,
  },
  mobileLogoHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoWrapMobile: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeader: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  errorBox: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.xs,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 13,
  },
  link: {
    fontSize: 13,
    fontWeight: '800',
  },
});
