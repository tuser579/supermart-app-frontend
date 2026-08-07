import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Heart,
  ChevronRight,
  Sparkles,
  Smartphone,
  Banknote,
} from 'lucide-react-native';
import { useTheme } from '../../shared/hooks/useTheme';
import { useResponsiveLayout } from '../../shared/hooks/useResponsiveLayout';
import { spacing, radius } from '../../shared/theme/spacing';

export function DesktopFooter() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isDesktop, contentMaxWidth, containerPadding } = useResponsiveLayout();

  if (!isDesktop) return null;

  return (
    <View style={[styles.footerContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {/* Top Value Proposition Bar */}
      <View style={[styles.valueBar, { borderBottomColor: colors.border }]}>
        <View style={[styles.valueBarInner, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
          <View style={styles.valueItem}>
            <View style={[styles.valueIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Truck size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.valueTitle, { color: colors.text }]}>Free Delivery</Text>
              <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>On all orders above ৳2000</Text>
            </View>
          </View>

          <View style={styles.valueItem}>
            <View style={[styles.valueIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Clock size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.valueTitle, { color: colors.text }]}>30-Min Express</Text>
              <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>Fast doorstep delivery</Text>
            </View>
          </View>

          <View style={styles.valueItem}>
            <View style={[styles.valueIconBg, { backgroundColor: colors.primary + '15' }]}>
              <ShieldCheck size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.valueTitle, { color: colors.text }]}>100% Fresh Guarantee</Text>
              <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>Direct from local farms</Text>
            </View>
          </View>

          <View style={styles.valueItem}>
            <View style={[styles.valueIconBg, { backgroundColor: colors.primary + '15' }]}>
              <Smartphone size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.valueTitle, { color: colors.text }]}>Easy Payments</Text>
              <Text style={[styles.valueDesc, { color: colors.textSecondary }]}>bKash, Nagad, Rocket & COD</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Footer Columns */}
      <View style={[styles.mainFooter, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
        {/* Column 1: Brand & Contact */}
        <View style={styles.brandCol}>
          <TouchableOpacity style={styles.logoRow} onPress={() => router.push('/')} activeOpacity={0.8}>
            <Image
              source={require('../../../assets/images/play_store_512.png')}
              style={{ width: 42, height: 42, borderRadius: 10, resizeMode: 'contain' }}
            />
            <Text style={[styles.brandTitle, { color: colors.text }]}>SuperMart</Text>
          </TouchableOpacity>

          <Text style={[styles.brandAbout, { color: colors.textSecondary }]}>
            Your trusted online supermarket delivering fresh fruits, vegetables, dairy, bakery, and daily groceries straight to your home.
          </Text>

          <View style={styles.contactList}>
            <View style={styles.contactItem}>
              <Phone size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>+880 1760-049326</Text>
            </View>
            <View style={styles.contactItem}>
              <Mail size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>support@supermart.com</Text>
            </View>
            <View style={styles.contactItem}>
              <MapPin size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>Dhaka, Bangladesh</Text>
            </View>
          </View>
        </View>

        {/* Column 2: Quick Links */}
        <View style={styles.linkCol}>
          <Text style={[styles.colTitle, { color: colors.text }]}>Quick Links</Text>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Browse All Products</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/wishlist')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Wishlist</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/orders')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Shopping Cart</Text>
          </TouchableOpacity>
        </View>

        {/* Column 3: Categories */}
        <View style={styles.linkCol}>
          <Text style={[styles.colTitle, { color: colors.text }]}>Popular Categories</Text>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Fruits & Vegetables</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Dairy & Morning Essentials</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Bakery & Snacks</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Meat & Seafood</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.linkItem}>
            <ChevronRight size={14} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>Beverages & Juices</Text>
          </TouchableOpacity>
        </View>

        {/* Column 4: Payment Methods */}
        <View style={styles.payCol}>
          <Text style={[styles.colTitle, { color: colors.text }]}>Payment Options</Text>
          <Text style={[styles.paySubtitle, { color: colors.textSecondary }]}>
            We support multiple instant payment options for your convenience:
          </Text>

          <View style={styles.payBadgesRow}>
            <View style={[styles.payBadge, { backgroundColor: '#E2136E15', borderColor: '#E2136E40' }]}>
              <Text style={{ color: '#E2136E', fontWeight: '800', fontSize: 12 }}>bKash</Text>
            </View>
            <View style={[styles.payBadge, { backgroundColor: '#F7921E15', borderColor: '#F7921E40' }]}>
              <Text style={{ color: '#F7921E', fontWeight: '800', fontSize: 12 }}>Nagad</Text>
            </View>
            <View style={[styles.payBadge, { backgroundColor: '#8C349415', borderColor: '#8C349440' }]}>
              <Text style={{ color: '#8C3494', fontWeight: '800', fontSize: 12 }}>Rocket</Text>
            </View>
            <View style={[styles.payBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
              <Banknote size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>Cash on Delivery</Text>
            </View>
          </View>

          <View style={[styles.hoursBox, { backgroundColor: colors.inputBg }]}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.hoursText, { color: colors.text }]}>
              Operating Hours: 7 Days • 8am - 10pm
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Copyright Row */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <View style={[styles.bottomInner, { maxWidth: contentMaxWidth, paddingHorizontal: containerPadding }]}>
          <Text style={[styles.copyText, { color: colors.textSecondary }]}>
            © 2026 SuperMart Online Supermarket. All rights reserved.
          </Text>
          <View style={styles.builtWithRow}>
            <Text style={[styles.copyText, { color: colors.textSecondary }]}>Fresh Groceries Delivered Daily</Text>
            <Heart size={14} color="#EF4444" fill="#EF4444" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    width: '100%',
    borderTopWidth: 1,
    marginTop: spacing.xxl,
  },
  valueBar: {
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
  },
  valueBarInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  valueDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  mainFooter: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
    gap: 32,
  },
  brandCol: {
    flex: 1.2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandAbout: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  contactList: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkCol: {
    flex: 1,
  },
  colTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  payCol: {
    flex: 1.2,
  },
  paySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  payBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingVertical: spacing.lg,
  },
  bottomInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyText: {
    fontSize: 12,
  },
  builtWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
