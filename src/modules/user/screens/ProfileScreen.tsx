import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter, Link } from 'expo-router';
import {
  User as UserIcon,
  MapPin,
  Lock,
  Bell,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Trash2,
  ShoppingBag,
  CreditCard,
  Heart,
  Settings,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../common/Card';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { ThemeMode } from '../../../shared/theme/theme';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark, mode, setTheme } = useTheme();
  const { user, logout, deleteAccount } = useAuth();
  const { isTablet, isDesktop } = useResponsiveLayout();
  const isLargeScreen = isTablet || isDesktop;

  const menuItems = [
    { icon: UserIcon, label: 'Edit Profile', href: '/edit-profile' },
    { icon: MapPin, label: 'Saved Addresses', href: '/addresses' },
    { icon: CreditCard, label: 'Payment Methods', href: '/payments' },
    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
    { icon: Lock, label: 'Change Password', href: '/change-password' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
  ];

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={isLargeScreen ? 20 : 18} color={mode === 'light' ? '#FFFFFF' : colors.text} />, label: 'Light' },
    { mode: 'dark', icon: <Moon size={isLargeScreen ? 20 : 18} color={mode === 'dark' ? '#FFFFFF' : colors.text} />, label: 'Dark' },
    { mode: 'system', icon: <Monitor size={isLargeScreen ? 20 : 18} color={mode === 'system' ? '#FFFFFF' : colors.text} />, label: 'System' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Section */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface,
          paddingHorizontal: isLargeScreen ? spacing.xxl : spacing.xl,
          paddingVertical: isLargeScreen ? spacing.xxl : spacing.xl,
          borderBottomLeftRadius: isLargeScreen ? 32 : 28,
          borderBottomRightRadius: isLargeScreen ? 32 : 28,
        }
      ]}>
        <View style={[
          styles.profileHeader,
          { 
            flexDirection: isLargeScreen ? 'row' : 'row',
            alignItems: 'center',
          }
        ]}>
          <View style={[
            styles.avatar, 
            { 
              backgroundColor: colors.primaryLight,
              width: isLargeScreen ? 100 : 72,
              height: isLargeScreen ? 100 : 72,
              borderRadius: isLargeScreen ? 50 : 36,
              marginRight: isLargeScreen ? spacing.xl : spacing.lg,
            }
          ]}>
            {user?.profileImage || (user as any)?.avatar ? (
              <Image 
                source={{ uri: (user?.profileImage || (user as any)?.avatar)! }} 
                style={[
                  styles.avatarImage,
                  {
                    width: isLargeScreen ? 100 : 72,
                    height: isLargeScreen ? 100 : 72,
                    borderRadius: isLargeScreen ? 50 : 36,
                  }
                ]} 
              />
            ) : (
              <Text style={[
                styles.avatarText, 
                { 
                  color: colors.primary,
                  fontSize: isLargeScreen ? 40 : 28,
                }
              ]}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={[
            styles.profileInfo,
            { 
              flex: 1,
              marginTop: isLargeScreen ? 0 : 0,
            }
          ]}>
            <Text style={[
              styles.name, 
              { 
                color: colors.text,
                fontSize: isLargeScreen ? 24 : 20,
                marginBottom: isLargeScreen ? 6 : 4,
              }
            ]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[
              styles.email, 
              { 
                color: colors.textSecondary,
                fontSize: isLargeScreen ? 16 : 14,
                marginBottom: isLargeScreen ? 4 : 2,
              }
            ]}>
              {user?.email || ''}
            </Text>
            {user?.phone && (
              <Text style={[
                styles.phone, 
                { 
                  color: colors.textSecondary,
                  fontSize: isLargeScreen ? 14 : 12,
                }
              ]}>
                {user.phone}
              </Text>
            )}
            {/* Stats Row for Tablet/Desktop */}
            {isLargeScreen && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>12</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>5</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wishlist</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>3</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[
        styles.content,
        { 
          padding: isLargeScreen ? spacing.xl : spacing.lg,
          paddingTop: isLargeScreen ? spacing.xl : spacing.xl,
          maxWidth: isLargeScreen ? 800 : undefined,
          alignSelf: isLargeScreen ? 'center' : undefined,
          width: '100%',
        }
      ]}>
        {/* Theme Section */}
        <Text style={[
          styles.sectionTitle, 
          { 
            color: colors.text,
            fontSize: isLargeScreen ? 18 : 16,
            marginBottom: isLargeScreen ? spacing.md : spacing.md,
          }
        ]}>
          Theme
        </Text>
        <Card 
          padding={isLargeScreen ? 'lg' : 'md'} 
          style={[
            styles.themeCard,
            { 
              marginBottom: isLargeScreen ? spacing.xl : spacing.xl,
              borderRadius: isLargeScreen ? radius.xl : radius.lg,
            }
          ]}
        >
          <View style={[
            styles.themeOptions,
            { 
              gap: isLargeScreen ? 12 : 10,
              flexDirection: isLargeScreen ? 'row' : 'row',
            }
          ]}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                onPress={() => setTheme(opt.mode)}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <View
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: mode === opt.mode ? colors.primary : colors.inputBg,
                      borderColor: mode === opt.mode ? colors.primary : colors.border,
                      paddingVertical: isLargeScreen ? 14 : 12,
                      borderRadius: isLargeScreen ? radius.md : radius.md,
                      borderWidth: 1.5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    },
                  ]}
                >
                  {opt.icon}
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: mode === opt.mode ? '#FFFFFF' : colors.textSecondary,
                        fontSize: isLargeScreen ? 14 : 12,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Account Section */}
        <Text style={[
          styles.sectionTitle, 
          { 
            color: colors.text,
            fontSize: isLargeScreen ? 18 : 16,
            marginBottom: isLargeScreen ? spacing.md : spacing.md,
          }
        ]}>
          Account
        </Text>
        
        {/* Menu Items - Grid layout for tablet */}
        {isLargeScreen ? (
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <Link href={item.href as any} asChild key={item.label}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flex: 1 }}
                >
                <Card 
                  padding="md" 
                  style={[
                    styles.menuGridItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.lg,
                      marginBottom: 12,
                    }
                  ]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                    <item.icon size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text, fontSize: 14 }]}>
                    {item.label}
                  </Text>
                </Card>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ) : (
          <Card 
            padding="none" 
            style={[
              styles.menuCard,
              { 
                marginBottom: isLargeScreen ? spacing.xl : spacing.lg,
                overflow: 'hidden',
                borderRadius: isLargeScreen ? radius.xl : radius.lg,
              }
            ]}
          >
            {menuItems.map((item, index) => (
              <Link href={item.href as any} asChild key={item.label}>
                <TouchableOpacity
                  activeOpacity={0.7}
                >
                <View
                  style={[
                    styles.menuItem,
                    { 
                      borderBottomColor: colors.border,
                      padding: isLargeScreen ? spacing.md : spacing.md,
                    },
                    index === menuItems.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                    <item.icon size={isLargeScreen ? 20 : 18} color={colors.primary} />
                  </View>
                  <Text style={[
                    styles.menuLabel, 
                    { 
                      color: colors.text,
                      fontSize: isLargeScreen ? 16 : 14,
                    }
                  ]}>
                    {item.label}
                  </Text>
                  <ChevronRight size={isLargeScreen ? 24 : 20} color={colors.textTertiary} />
                </View>
                </TouchableOpacity>
              </Link>
            ))}
          </Card>
        )}

        {/* Logout Button */}
        <TouchableOpacity onPress={() => logout()} activeOpacity={0.7}>
          <Card 
            padding={isLargeScreen ? 'lg' : 'md'} 
            style={[
              styles.logoutCard, 
              { 
                borderColor: colors.error, 
                borderWidth: 1.5,
                borderRadius: isLargeScreen ? radius.xl : radius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: isLargeScreen ? spacing.xl : spacing.xl,
              }
            ]}
          >
            <LogOut size={isLargeScreen ? 24 : 20} color={colors.error} />
            <Text style={[
              styles.logoutText, 
              { 
                color: colors.error,
                fontSize: isLargeScreen ? 18 : 16,
                fontWeight: '700',
              }
            ]}>
              Logout
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity 
          onPress={() => {
            // Ideally add an Alert to confirm before calling deleteAccount()
            deleteAccount();
          }} 
          activeOpacity={0.7}
        >
          <Card 
            padding={isLargeScreen ? 'lg' : 'md'} 
            style={[
              styles.logoutCard, 
              { 
                borderColor: '#FF3B30', // Red for delete
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderWidth: 1.5,
                borderRadius: isLargeScreen ? radius.xl : radius.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: isLargeScreen ? spacing.xl : spacing.xl,
              }
            ]}
          >
            <Trash2 size={isLargeScreen ? 24 : 20} color="#FF3B30" />
            <Text style={[
              styles.logoutText, 
              { 
                color: '#FF3B30',
                fontSize: isLargeScreen ? 18 : 16,
                fontWeight: '700',
              }
            ]}>
              Delete Account
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[
          styles.version, 
          { 
            color: colors.textTertiary,
            fontSize: isLargeScreen ? 14 : 12,
            textAlign: 'center',
            marginBottom: isLargeScreen ? 60 : 40,
          }
        ]}>
          Supermart v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarText: {
    ...typography.h2,
    fontWeight: '700',
  },
  profileInfo: { 
    flex: 1,
  },
  name: { 
    ...typography.h4,
  },
  email: { 
    ...typography.bodySmall,
  },
  phone: { 
    ...typography.caption,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
  },
  themeCard: {
    overflow: 'hidden',
  },
  themeOptions: {
    flexDirection: 'row',
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  themeLabel: {
    ...typography.bodySmall,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    width: '48%',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.body,
    flex: 1,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
  },
  logoutText: {
    ...typography.body,
  },
  version: {
    ...typography.caption,
  },
});