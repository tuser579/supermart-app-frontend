import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Pressable } from 'react-native';
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
  Sparkles,
  Mail,
  Phone,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../common/Card';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { ThemeMode } from '../../../shared/theme/theme';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark, mode, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { contentMaxWidth, containerPadding, isDesktop, isTablet } = useResponsiveLayout() as any;
  const isLargeScreen = isTablet || isDesktop;
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuItems = [
    {
      icon: UserIcon,
      label: 'Edit Profile',
      desc: 'Update your name, email, & avatar',
      href: '/edit-profile',
    },
    {
      icon: MapPin,
      label: 'Saved Addresses',
      desc: 'Manage delivery addresses',
      href: '/addresses',
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      desc: 'Saved cards & payment options',
      href: '/payments',
    },
    {
      icon: Heart,
      label: 'Wishlist',
      desc: 'View your saved items',
      href: '/wishlist',
    },
    {
      icon: Lock,
      label: 'Change Password',
      desc: 'Update account password',
      href: '/change-password',
    },
    {
      icon: Bell,
      label: 'Notifications',
      desc: 'Manage notification alerts',
      href: '/notifications',
    },
  ];

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={18} color={mode === 'light' ? '#FFFFFF' : colors.text} />, label: 'Light' },
    { mode: 'dark', icon: <Moon size={18} color={mode === 'dark' ? '#FFFFFF' : colors.text} />, label: 'Dark' },
    { mode: 'system', icon: <Monitor size={18} color={mode === 'system' ? '#FFFFFF' : colors.text} />, label: 'System' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: containerPadding, paddingVertical: spacing.lg }}>
        
        {/* Top Profile Hero Card */}
        <Card
          padding="lg"
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroRow}>
            {/* Avatar & User Info */}
            <View style={styles.heroLeft}>
              <View style={[styles.avatarWrap, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                {user?.profileImage || (user as any)?.avatar ? (
                  <Image
                    source={{ uri: (user?.profileImage || (user as any)?.avatar)! }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
              </View>

              <View style={styles.userInfoGroup}>
                <View style={styles.userNameRow}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user?.name || 'User'}
                  </Text>
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primaryLight }]}>
                    <Sparkles size={12} color={colors.primary} />
                    <Text style={[styles.verifiedText, { color: colors.primary }]}>Customer</Text>
                  </View>
                </View>

                {Boolean(user?.email) && (
                  <View style={styles.infoDetailRow}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                      {user?.email}
                    </Text>
                  </View>
                )}

                {Boolean(user?.phone) && (
                  <View style={styles.infoDetailRow}>
                    <Phone size={14} color={colors.textSecondary} />
                    <Text style={[styles.userPhone, { color: colors.textSecondary }]}>
                      {user?.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Action Metrics for Desktop */}
            {isDesktop && (
              <View style={styles.heroStatsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/orders')}
                  style={[styles.heroStatCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                >
                  <View style={[styles.statIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <ShoppingBag size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.statTitle, { color: colors.text }]}>Orders</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Track Purchases</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/addresses')}
                  style={[styles.heroStatCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                >
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                    <MapPin size={20} color="#22C55E" />
                  </View>
                  <View>
                    <Text style={[styles.statTitle, { color: colors.text }]}>Addresses</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Saved Locations</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/wishlist')}
                  style={[styles.heroStatCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                >
                  <View style={[styles.statIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                    <Heart size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={[styles.statTitle, { color: colors.text }]}>Wishlist</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Saved Items</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>

        {/* Main Grid Content */}
        <View style={isDesktop ? styles.desktopTwoColLayout : styles.mobileLayout}>
          
          {/* Account Settings & Quick Navigation (Left Column on Desktop) */}
          <View style={isDesktop ? styles.desktopLeftCol : styles.mobileCol}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Account Settings</Text>

            <View style={isDesktop ? styles.menuGridDesktop : styles.menuStackMobile}>
              {menuItems.map((item) => (
                <Link href={item.href as any} asChild key={item.label}>
                  <TouchableOpacity activeOpacity={0.8} style={isDesktop ? styles.menuGridCardWrap : styles.menuFullWrap}>
                    <Card
                      padding="md"
                      style={[
                        styles.menuCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}>
                        <item.icon size={20} color={colors.primary} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                          {item.desc}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={colors.textTertiary} />
                    </Card>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>

          {/* Preferences & Account Actions (Right Column on Desktop) */}
          <View style={isDesktop ? styles.desktopRightCol : styles.mobileCol}>
            
            {/* Theme Section */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Appearance & Theme</Text>
            <Card padding="lg" style={[styles.preferenceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>Select Theme Mode</Text>
              <View style={styles.themeRow}>
                {themeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.mode}
                    onPress={() => setTheme(opt.mode)}
                    activeOpacity={0.8}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={[
                        styles.themeOptionPill,
                        {
                          backgroundColor: mode === opt.mode ? colors.primary : colors.inputBg,
                          borderColor: mode === opt.mode ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {opt.icon}
                      <Text
                        style={[
                          styles.themeOptionText,
                          {
                            color: mode === opt.mode ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: mode === opt.mode ? '700' : '500',
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

            {/* Account Actions */}
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: spacing.lg }]}>Account Actions</Text>
            <Card padding="lg" style={[styles.actionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Logout Button */}
              <TouchableOpacity
                onPress={() => setIsLogoutModalOpen(true)}
                activeOpacity={0.8}
                style={[styles.logoutBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '35' }]}
              >
                <LogOut size={18} color={colors.error} />
                <Text style={[styles.logoutBtnText, { color: colors.error }]}>Logout of Account</Text>
              </TouchableOpacity>
            </Card>

            {/* Version Info */}
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>
              SuperMart App • Version 1.0.0
            </Text>
          </View>
        </View>

      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={isLogoutModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLogoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsLogoutModalOpen(false)}
          />
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation?.()}
          >
            <TouchableOpacity onPress={() => setIsLogoutModalOpen(false)} style={styles.modalCloseBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.modalIconWrapper, { backgroundColor: colors.error + '15' }]}>
              <LogOut size={28} color={colors.error} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Logout of Account?</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to log out? You will need to sign in again to access your orders and saved items.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsLogoutModalOpen(false)}
                style={[styles.modalCancelBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                style={[styles.modalLogoutBtn, { backgroundColor: colors.error }]}
              >
                <LogOut size={16} color="#FFFFFF" />
                <Text style={styles.modalLogoutBtnText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingBottom: 80,
  },

  // Hero Card
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
    minWidth: 260,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  userInfoGroup: {
    gap: 4,
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  userPhone: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 150,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Desktop 2-column layout
  desktopTwoColLayout: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  desktopLeftCol: {
    flex: 1,
  },
  desktopRightCol: {
    width: 380,
  },
  mobileLayout: {
    flexDirection: 'column',
  },
  mobileCol: {
    width: '100%',
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.md,
  },

  // Menu grid
  menuGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  menuGridCardWrap: {
    width: '48.5%',
  },
  menuStackMobile: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  menuFullWrap: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Preference Card
  preferenceCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  preferenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 12,
  },

  // Actions Card
  actionsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.lg,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  modalIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalLogoutBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 6,
  },
  modalLogoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});