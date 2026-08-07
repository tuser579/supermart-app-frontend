import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  Home,
  Search,
  ShoppingCart,
  Package,
  User,
  Bell,
  Sun,
  Moon,
  Store,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../shared/hooks/useTheme';
import { useAppSelector } from '../../shared/hooks/useRedux';
import { useResponsiveLayout } from '../../shared/hooks/useResponsiveLayout';

export function DesktopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDark, mode, setTheme } = useTheme();
  const cartCount = useAppSelector((s: any) => s.cart?.itemCount || 0);
  const user = useAppSelector((s: any) => s.auth?.user);
  const { isDesktop, contentMaxWidth, containerPadding } = useResponsiveLayout();

  if (!isDesktop) return null;

  const NAV_ITEMS = [
    { label: 'Home', path: '/', icon: Home, routeMatch: (p: string) => p === '/' || p === '/(tabs)' || p === '/index' },
    { label: 'Search', path: '/search', icon: Search, routeMatch: (p: string) => p.includes('search') },
    { label: 'Orders', path: '/orders', icon: Package, routeMatch: (p: string) => p.includes('order') },
    { label: 'Cart', path: '/cart', icon: ShoppingCart, badge: cartCount, routeMatch: (p: string) => p.includes('cart') },
  ];

  const handleNavPress = (path: string) => {
    router.push(path as any);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.navbarContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.navbarInner, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
        {/* Brand Logo & Name */}
        <TouchableOpacity
          style={styles.brandContainer}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Store size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>SuperMart</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              Fresh Grocery Store
            </Text>
          </View>
        </TouchableOpacity>

        {/* Center Navigation Links */}
        <View style={styles.navLinksRow}>
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = item.routeMatch(pathname);

            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => handleNavPress(item.path)}
                activeOpacity={0.7}
                style={[
                  styles.navItem,
                  isActive && [styles.navItemActive, { backgroundColor: colors.primaryLight }],
                ]}
              >
                <IconComponent
                  size={18}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? colors.primary : colors.text },
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {Boolean(item.badge && item.badge > 0) && (
                  <View style={[styles.badge, { backgroundColor: colors.badge }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Side Actions */}
        <View style={styles.rightActionsRow}>
          {/* Notifications button */}
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={[styles.iconActionBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            accessibilityLabel="Notifications"
          >
            <Bell size={18} color={colors.text} />
          </TouchableOpacity>

          {/* Theme Toggle Button */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconActionBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            accessibilityLabel="Toggle Theme"
          >
            {isDark ? <Sun size={18} color="#FFB300" /> : <Moon size={18} color={colors.text} />}
          </TouchableOpacity>

          {/* User Profile Pill */}
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={[styles.userPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <Text style={[styles.userNameText, { color: colors.text }]} numberOfLines={1}>
              {user?.name || 'Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarContainer: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 9999,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  navbarInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 68,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  onlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  onlineTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navItemActive: {
    borderRadius: 20,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    fontWeight: '700',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 100,
  },
});
