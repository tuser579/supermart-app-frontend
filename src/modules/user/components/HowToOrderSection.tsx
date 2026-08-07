import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Smartphone,
  Banknote,
  ShoppingBag,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  User,
  Shield,
  Bike,
  DollarSign,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type OrderMethod = 'mobile' | 'cod';

interface StepItem {
  number: number;
  title: string;
  desc: string;
  icon: React.ElementType;
  badge?: string;
  orderStatus: string;
  statusColor: string;
  panelRole: 'User Panel' | 'Admin Panel' | 'Staff Panel';
  panelColor: string;
  details: string[];
}

interface HowToOrderSectionProps {
  onStartShopping?: () => void;
}

const MOBILE_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'Browse & Add to Cart',
    desc: 'Select your favorite groceries and add them to your cart.',
    icon: ShoppingBag,
    badge: 'Step 1',
    orderStatus: 'Status: DRAFT / CART',
    statusColor: '#3B82F6',
    panelRole: 'User Panel',
    panelColor: '#2563EB',
    details: [
      'Open product catalog or search for fresh items.',
      "Select package size / weight and tap 'Add to Cart'.",
      'Review items, quantities, and subtotal in your shopping bag.',
    ],
  },
  {
    number: 2,
    title: 'Select Mobile Banking (BKASH / NOGOD / ROCKET)',
    desc: 'Choose bKash, Nagad, or Rocket at checkout.',
    icon: Smartphone,
    badge: 'Instant',
    orderStatus: 'Status: PAYMENT_PENDING',
    statusColor: '#F59E0B',
    panelRole: 'User Panel',
    panelColor: '#2563EB',
    details: [
      'Proceed to Checkout & select delivery address.',
      'Choose Mobile Banking (BKASH, NOGOD, or ROCKET) as payment method.',
      'Review order total amount and delivery charge.',
    ],
  },
  {
    number: 3,
    title: 'Send Payment & Admin TrxID Verification',
    desc: 'Send money to merchant account 01760049326 and enter Transaction ID.',
    icon: CheckCircle2,
    badge: 'Verified',
    orderStatus: 'Status: PENDING / VERIFYING',
    statusColor: '#8B5CF6',
    panelRole: 'Admin Panel',
    panelColor: '#7C3AED',
    details: [
      'User dials *247# (bKash), *167# (Nagad), or *322# (Rocket) ➔ Sends money to official Send Money Number 01760049326.',
      'User enters 11-digit Sender Mobile Number & Transaction ID (min 4 chars) in payment modal.',
      'Admin Panel verifies TrxID via verifyPayment: Valid ➔ paymentStatus: PAID / COMPLETED, status: CONFIRMED. Invalid ➔ Order CANCELLED & stock restored.',
    ],
  },
  {
    number: 4,
    title: 'Delivery & Order Completion',
    desc: 'Staff picks items, rider delivers (DELIVERED), & order completes.',
    icon: Truck,
    badge: 'Express',
    orderStatus: 'Status: DELIVERED ➔ COMPLETED',
    statusColor: '#10B981',
    panelRole: 'Staff Panel',
    panelColor: '#059669',
    details: [
      'Staff Panel receives assigned order & picks fresh items (PROCESSING).',
      'Staff dispatches rider (OUT_FOR_DELIVERY) with live status updates.',
      'Rider hands over fresh items to customer at doorstep (DELIVERED).',
      'Pre-verified Mobile Payment (PAID) ➔ Order status automatically updates to COMPLETED 🎉.',
    ],
  },
];

const COD_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'Add Items to Cart',
    desc: 'Pick your daily essentials and proceed to checkout.',
    icon: ShoppingBag,
    badge: 'Step 1',
    orderStatus: 'Status: DRAFT / CART',
    statusColor: '#3B82F6',
    panelRole: 'User Panel',
    panelColor: '#2563EB',
    details: [
      'Browse daily essentials, vegetables, fruits, and bakery.',
      'Add preferred quantities to your cart.',
      'Click Checkout to proceed.',
    ],
  },
  {
    number: 2,
    title: 'Select Cash on Delivery (COD)',
    desc: 'Choose COD payment option with ৳0 upfront cost.',
    icon: Banknote,
    badge: '৳0 Upfront',
    orderStatus: 'Status: PENDING (paymentStatus: UNPAID)',
    statusColor: '#F59E0B',
    panelRole: 'User Panel',
    panelColor: '#2563EB',
    details: [
      'Select Cash on Delivery (COD) option at Checkout.',
      'Enjoy ৳0 upfront cost—no advance payment required.',
      'Order created with status: PENDING and paymentStatus: UNPAID.',
    ],
  },
  {
    number: 3,
    title: 'Admin Order Confirmation & Staff Assignment',
    desc: 'Admin verifies pending order & assigns delivery staff member.',
    icon: ShieldCheck,
    badge: 'Guaranteed',
    orderStatus: 'Status: CONFIRMED / PROCESSING',
    statusColor: '#8B5CF6',
    panelRole: 'Admin Panel',
    panelColor: '#7C3AED',
    details: [
      'Order is placed instantly with PENDING status.',
      'Admin Panel verifies customer address & phone number (status ➔ CONFIRMED).',
      'Admin assigns an active, available delivery staff member to fulfill order.',
    ],
  },
  {
    number: 4,
    title: 'Doorstep Cash Handover & Staff Record',
    desc: 'Rider delivers items (DELIVERED), collects cash, & records payment (UNPAID ➔ COMPLETED).',
    icon: Truck,
    badge: 'Safe & Easy',
    orderStatus: 'Status: DELIVERED ➔ COMPLETED',
    statusColor: '#10B981',
    panelRole: 'Staff Panel',
    panelColor: '#059669',
    details: [
      'Rider delivers package to customer location (DELIVERED).',
      'Customer inspects products & hands exact cash amount to rider.',
      'Staff/Rider triggers recordPaymentAsAdmin ➔ paymentStatus converts UNPAID ➔ COMPLETED.',
      'Order status automatically updates to COMPLETED 🎉.',
    ],
  },
];

const PAYMENT_PROVIDERS = [
  { name: 'bKash', codeName: 'BKASH', color: '#E2136E', code: '*247#', number: '01760049326' },
  { name: 'Nagad', codeName: 'NOGOD', color: '#F7921E', code: '*167#', number: '01760049326' },
  { name: 'Rocket', codeName: 'ROCKET', color: '#8C3494', code: '*322#', number: '01760049326' },
];

export function HowToOrderSection({ onStartShopping }: HowToOrderSectionProps) {
  const { colors } = useTheme();
  const { isTablet, isDesktop, containerPadding } = useResponsiveLayout();
  const isDesktopOrTablet = isTablet || isDesktop;
  const [activeTab, setActiveTab] = useState<OrderMethod>('mobile');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentSteps = activeTab === 'mobile' ? MOBILE_STEPS : COD_STEPS;

  const handleTabChange = (method: OrderMethod) => {
    if (method === activeTab) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setActiveTab(method);
    setExpandedStep(null);
  };

  const toggleExpandStep = (stepNumber: number) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedStep((prev) => (prev === stepNumber ? null : stepNumber));
  };

  const toggleShowAllDetails = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowAllDetails((prev) => !prev);
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        marginHorizontal: isDesktop ? containerPadding : spacing.lg,
        marginTop: isDesktop ? spacing.xl : spacing.lg,
        padding: isDesktop ? spacing.xl : spacing.lg,
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerBadge, { backgroundColor: colors.primary + '18' }]}>
          <Sparkles size={isTablet ? 18 : 14} color={colors.primary} />
          <Text style={[styles.headerBadgeText, { color: colors.primary }]}>Multi-Panel Order Architecture</Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontSize: isTablet ? 24 : 20 }]}>
          How to Order & System Workflow
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: isTablet ? 14 : 12 }]}>
          Integrated workflow across User Panel ➔ Admin Verification ➔ Staff Delivery
        </Text>
      </View>

      {/* 3-Panel Role Workflow Bar */}
      <View style={[styles.panelRoleBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <View style={styles.panelRoleItem}>
          <View style={[styles.panelRoleIcon, { backgroundColor: '#2563EB15' }]}>
            <User size={14} color="#2563EB" />
          </View>
          <Text style={[styles.panelRoleName, { color: colors.text }]}>1. User Panel</Text>
        </View>
        <ArrowRight size={12} color={colors.textTertiary} />
        <View style={styles.panelRoleItem}>
          <View style={[styles.panelRoleIcon, { backgroundColor: '#7C3AED15' }]}>
            <Shield size={14} color="#7C3AED" />
          </View>
          <Text style={[styles.panelRoleName, { color: colors.text }]}>2. Admin Verification</Text>
        </View>
        <ArrowRight size={12} color={colors.textTertiary} />
        <View style={styles.panelRoleItem}>
          <View style={[styles.panelRoleIcon, { backgroundColor: '#05966915' }]}>
            <Bike size={14} color="#059669" />
          </View>
          <Text style={[styles.panelRoleName, { color: colors.text }]}>3. Staff Delivery</Text>
        </View>
      </View>

      {/* Interactive Method Selector Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleTabChange('mobile')}
          style={[
            styles.tabButton,
            activeTab === 'mobile' && [styles.activeTabButton, { backgroundColor: colors.primary }],
          ]}
        >
          <Smartphone
            size={isTablet ? 18 : 16}
            color={activeTab === 'mobile' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'mobile' ? '#FFFFFF' : colors.text,
                fontSize: isTablet ? 14 : 12,
              },
            ]}
          >
            Mobile Banking
          </Text>
          <View
            style={[
              styles.miniBadge,
              {
                backgroundColor: activeTab === 'mobile' ? 'rgba(255,255,255,0.25)' : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.miniBadgeText,
                { color: activeTab === 'mobile' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Instant
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleTabChange('cod')}
          style={[
            styles.tabButton,
            activeTab === 'cod' && [styles.activeTabButton, { backgroundColor: colors.primary }],
          ]}
        >
          <Banknote
            size={isTablet ? 18 : 16}
            color={activeTab === 'cod' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'cod' ? '#FFFFFF' : colors.text,
                fontSize: isTablet ? 14 : 12,
              },
            ]}
          >
            Cash on Delivery
          </Text>
          <View
            style={[
              styles.miniBadge,
              {
                backgroundColor: activeTab === 'cod' ? 'rgba(255,255,255,0.25)' : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.miniBadgeText,
                { color: activeTab === 'cod' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Pay at Door
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Provider Brand Badges for Mobile Banking */}
      {activeTab === 'mobile' && (
        <View style={styles.providerRow}>
          <Text style={[styles.providerLabel, { color: colors.textSecondary }]}>Supported Providers (Send Money to 01760049326):</Text>
          <View style={styles.providerChipsContainer}>
            {PAYMENT_PROVIDERS.map((p) => (
              <View key={p.name} style={[styles.providerChip, { backgroundColor: p.color + '15', borderColor: p.color + '40' }]}>
                <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                <Text style={[styles.providerChipName, { color: p.color }]}>{p.name}</Text>
                <Text style={[styles.providerChipCode, { color: colors.textSecondary }]}>({p.code})</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Expand All / Collapse Toggle */}
      <View style={styles.toggleHeader}>
        <TouchableOpacity
          onPress={toggleShowAllDetails}
          activeOpacity={0.7}
          style={[styles.expandToggleBtn, { backgroundColor: colors.primary + '10' }]}
        >
          <Info size={14} color={colors.primary} />
          <Text style={[styles.expandToggleText, { color: colors.primary }]}>
            {showAllDetails ? 'Hide Step Details' : 'Show Detailed Sub-Steps'}
          </Text>
          {showAllDetails ? (
            <ChevronUp size={14} color={colors.primary} />
          ) : (
            <ChevronDown size={14} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Steps Content Grid / Flow Pipeline */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={isDesktopOrTablet ? styles.stepsGridDesktop : styles.stepsListMobile}>
          {currentSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isLast = index === currentSteps.length - 1;
            const isExpanded = showAllDetails || expandedStep === step.number;

            return (
              <TouchableOpacity
                key={step.number}
                activeOpacity={0.9}
                onPress={() => toggleExpandStep(step.number)}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: isExpanded ? colors.primary : colors.border,
                  },
                  isDesktopOrTablet && styles.stepCardDesktop,
                ]}
              >
                {/* Vertical Connector Line on Mobile */}
                {!isDesktopOrTablet && !isLast && (
                  <View style={[styles.mobilePipelineLine, { backgroundColor: colors.primary + '30' }]} />
                )}

                {/* Step Header / Icon & Number */}
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: colors.primary + '15',
                        borderColor: colors.primary + '30',
                      },
                    ]}
                  >
                    <StepIcon size={isTablet ? 22 : 18} color={colors.primary} />
                  </View>
                  
                  {/* Panel Role Badge */}
                  <View style={[styles.panelBadge, { backgroundColor: step.panelColor + '15', borderColor: step.panelColor + '40' }]}>
                    <Text style={[styles.panelBadgeText, { color: step.panelColor }]}>
                      {step.panelRole}
                    </Text>
                  </View>

                  <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.numberBadgeText}>{step.number}</Text>
                  </View>
                </View>

                {/* Order Status Badge */}
                <View
                  style={[
                    styles.statusBadgeRow,
                    {
                      backgroundColor: step.statusColor + '15',
                      borderColor: step.statusColor + '35',
                    },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: step.statusColor }]} />
                  <Text style={[styles.statusBadgeText, { color: step.statusColor }]}>
                    {step.orderStatus}
                  </Text>
                </View>

                {/* Step Body */}
                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.stepTitle,
                      { color: colors.text, fontSize: isTablet ? 15 : 13 },
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={[
                      styles.stepDesc,
                      { color: colors.textSecondary, fontSize: isTablet ? 12 : 11 },
                    ]}
                  >
                    {step.desc}
                  </Text>
                </View>

                {/* Detailed Sub-steps List when Expanded */}
                {isExpanded && (
                  <View style={[styles.detailsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {step.details.map((detail, idx) => (
                      <View key={idx} style={styles.detailRow}>
                        <View style={[styles.detailNumBadge, { backgroundColor: colors.primary + '18' }]}>
                          <Text style={[styles.detailNumText, { color: colors.primary }]}>
                            {`${step.number}.${idx + 1}`}
                          </Text>
                        </View>
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {detail}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Post-Delivery Payment Resolution Banner on Step 4 */}
                {isLast && (
                  <View style={[styles.postDeliveryPaymentBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                    <DollarSign size={14} color={colors.primary} />
                    <Text style={[styles.postDeliveryPaymentText, { color: colors.text }]}>
                      {activeTab === 'mobile'
                        ? 'Post-Delivery: Mobile Payment is pre-verified (PAID) ➔ Status becomes COMPLETED.'
                        : 'Post-Delivery: Rider collects cash at doorstep ➔ Payment recorded (UNPAID ➔ COMPLETED).'}
                    </Text>
                  </View>
                )}

                {/* Card Footer / Badge & Click Indicator */}
                <View style={styles.cardFooter}>
                  {step.badge && (
                    <View style={[styles.stepChip, { backgroundColor: colors.primary + '10' }]}>
                      <Check size={10} color={colors.primary} />
                      <Text style={[styles.stepChipText, { color: colors.primary }]}>
                        {step.badge}
                      </Text>
                    </View>
                  )}
                  <View style={styles.clickHint}>
                    <Text style={[styles.clickHintText, { color: colors.textTertiary }]}>
                      {isExpanded ? 'Collapse' : 'Details'}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={12} color={colors.textTertiary} />
                    ) : (
                      <ChevronDown size={12} color={colors.textTertiary} />
                    )}
                  </View>
                </View>

                {/* Horizontal Connector Arrow on Tablet/Desktop */}
                {isTablet && !isLast && (
                  <View style={styles.connectorArrow}>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Start Shopping Call to Action Button */}
      {onStartShopping && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onStartShopping}
          style={[styles.startShoppingBtn, { backgroundColor: colors.primary }]}
        >
          <ShoppingBag size={18} color="#FFFFFF" />
          <Text style={styles.startShoppingBtnText}>Explore Products & Order Now</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Trust Highlights Footer Bar */}
      <View style={[styles.highlightsBar, { backgroundColor: colors.inputBg }]}>
        <View style={styles.highlightItem}>
          <Zap size={14} color={colors.primary} />
          <Text style={[styles.highlightText, { color: colors.text }]}>Instant Confirmation</Text>
        </View>
        <View style={styles.highlightDot} />
        <View style={styles.highlightItem}>
          <Lock size={14} color={colors.primary} />
          <Text style={[styles.highlightText, { color: colors.text }]}>100% Safe Payment</Text>
        </View>
        <View style={styles.highlightDot} />
        <View style={styles.highlightItem}>
          <Truck size={14} color={colors.primary} />
          <Text style={[styles.highlightText, { color: colors.text }]}>FREE Delivery on ৳2,000+ Orders</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    ...typography.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  panelRoleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 4,
  },
  panelRoleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelRoleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelRoleName: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: 6,
  },
  activeTabButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontWeight: '700',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  providerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  providerChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  providerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  providerChipName: {
    fontSize: 11,
    fontWeight: '700',
  },
  providerChipCode: {
    fontSize: 10,
  },
  toggleHeader: {
    alignItems: 'flex-end',
    marginVertical: spacing.xs,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepsListMobile: {
    gap: 12,
  },
  stepsGridTablet: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  stepCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    position: 'relative',
  },
  stepCardTablet: {
    flex: 1,
  },
  stepCardDesktop: {
    width: '48.8%',
  },
  mobilePipelineLine: {
    position: 'absolute',
    left: 31,
    bottom: -14,
    width: 2,
    height: 14,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  panelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardBody: {
    gap: 3,
    marginBottom: 6,
  },
  stepTitle: {
    fontWeight: '700',
  },
  stepDesc: {
    lineHeight: 15,
  },
  detailsBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  detailNumBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  detailNumText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  postDeliveryPaymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 8,
  },
  postDeliveryPaymentText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clickHintText: {
    fontSize: 10,
    fontWeight: '600',
  },
  connectorArrow: {
    position: 'absolute',
    right: -12,
    top: 24,
    zIndex: 2,
  },
  startShoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  startShoppingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  highlightsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginTop: spacing.md,
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '600',
  },
  highlightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
  },
});
