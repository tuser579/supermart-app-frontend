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

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  avoidKeyboard?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = true,
  style,
  avoidKeyboard = true,
}: ScreenWrapperProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.viewContainer, { paddingTop: insets.top + 8 }]}>{children}</View>
      )}
    </>
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
