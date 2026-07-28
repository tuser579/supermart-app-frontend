import React from 'react';
import { useColorScheme } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { setTheme } from '../store/slices/themeSlice';
import { colors, ThemeMode, ThemeColors } from '../theme/theme';
import { saveStoredTheme } from '../utils/storage';

export function useTheme() {
  const systemScheme = useColorScheme();
  const mode = useAppSelector((s) => s.theme.mode);
  const dispatch = useAppDispatch();

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const activeColors: ThemeColors = isDark ? colors.dark : colors.light;

  const changeTheme = (newMode: ThemeMode) => {
    dispatch(setTheme(newMode));
    saveStoredTheme(newMode);
  };

  const toggleTheme = () => {
    changeTheme(isDark ? 'light' : 'dark');
  };

  return {
    colors: activeColors,
    isDark,
    mode,
    setTheme: changeTheme,
    toggleTheme,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}
