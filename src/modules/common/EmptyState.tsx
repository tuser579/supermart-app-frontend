import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../shared/hooks/useTheme';
import { spacing } from '../../shared/theme/spacing';
import { typography } from '../../shared/theme/typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaTitle?: string;
  onCtaPress?: () => void;
}

export function EmptyState({ icon, title, subtitle, ctaTitle, onCtaPress }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
      {ctaTitle && onCtaPress && (
        <View style={styles.ctaContainer}>
          <Button title={ctaTitle} onPress={onCtaPress} variant="primary" size="md" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  } as ViewStyle,
  iconContainer: {
    marginBottom: 16,
  } as ViewStyle,
  title: {
    ...typography.h4,
    textAlign: 'center',
    marginBottom: 8,
  } as TextStyle,
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
  } as TextStyle,
  ctaContainer: {
    marginTop: 24,
  } as ViewStyle,
});
