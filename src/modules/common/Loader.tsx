import React from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../shared/hooks/useTheme';

interface LoaderProps {
  fullscreen?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'large';
}

export function Loader({ fullscreen = false, style, size = 'large' }: LoaderProps) {
  const { colors } = useTheme();

  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.background }, style]}>
        <ActivityIndicator size={size} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.inline, style]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

export function Skeleton({ width, height, style }: { width?: number; height?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width || '100%',
          height: height || 16,
          backgroundColor: colors.skeleton,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  inline: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  skeleton: {
    borderRadius: 8,
    opacity: 0.5,
  } as ViewStyle,
});
