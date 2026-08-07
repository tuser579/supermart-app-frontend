import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/hooks/useTheme';
import { useResponsiveLayout } from '../../shared/hooks/useResponsiveLayout';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  avoidKeyboard?: boolean;
  maxWidth?: number;
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  avoidKeyboard = true,
  maxWidth,
}: ScreenWrapperProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, containerPadding, isDesktop } = useResponsiveLayout();

  const effectiveMaxWidth = maxWidth || contentMaxWidth;

  const content = (
    <View style={{ flex: 1, width: '100%' }}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingTop: insets.top + 8, paddingHorizontal: containerPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: effectiveMaxWidth, alignSelf: 'center', flexGrow: 1 }}>
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.viewContainer, { paddingTop: insets.top + 8, paddingHorizontal: containerPadding }]}>
          <View style={{ width: '100%', maxWidth: effectiveMaxWidth, alignSelf: 'center', flex: 1 }}>
            {children}
          </View>
        </View>
      )}
    </View>
  );

  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 32,
  } as ViewStyle,
  viewContainer: {
    flex: 1,
  } as ViewStyle,
});
