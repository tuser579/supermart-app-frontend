import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/hooks/useTheme';

const TAB_ICON_SIZE = 22;
const TAB_CONTENT_HEIGHT = 52; // fixed icon + label height

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // On web: no bottom inset needed. On native: respect device bottom inset
  const bottomPadding = Platform.OS === 'web' ? 0 : insets.bottom;
  const totalHeight = TAB_CONTENT_HEIGHT + bottomPadding;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: totalHeight,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const iconColor = isFocused ? colors.iconActive : colors.icon;
        const labelColor = isFocused ? colors.iconActive : colors.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const badge = options.tabBarBadge;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: iconColor,
                size: TAB_ICON_SIZE,
              })}
              {badge !== undefined && badge !== null && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.badge },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {typeof badge === 'number' ? (badge > 99 ? '99+' : String(badge)) : badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.label, { color: labelColor }]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
});
