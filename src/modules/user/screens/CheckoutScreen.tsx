import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Wallet,
  Check,
  Plus,
  MapPin,
  ExternalLink,
  PlusCircle,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { useCart } from '../hooks/useCart';
import * as addressApi from '../services/addressApi';
import * as orderApi from '../services/orderApi';
import * as cartApi from '../services/cartApi';
import * as productApi from '../services/productApi';
import * as paymentApi from '../services/paymentApi';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Loader } from '../../common/Loader';
import { AddressCard } from '../components/AddressCard';
import { MapPickerScreen } from '../components/MapPickerScreen';
import { MobileBankingModal } from '../components/MobileBankingModal';
import { BankTransferModal } from '../components/BankTransferModal';
import { CardPaymentModal } from '../components/CardPaymentModal';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Address } from '../../../shared/types/address.types';
import { PaymentMethod, PAYMENT_METHOD_LABELS } from '../../../shared/types/order.types';
import { formatCurrency } from '../../../shared/utils/formatters';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';
import { isCuid, resolveValidProductId } from '../../../shared/utils/cuidHelper';

const DELIVERY_CHARGE = 60;

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  COD: <Banknote size={20} color="#FFFFFF" />,
  BKASH: <Wallet size={20} color="#FFFFFF" />,
  ROCKET: <Wallet size={20} color="#FFFFFF" />,
  NOGOD: <Wallet size={20} color="#FFFFFF" />,
  BANK_TRANSFER: <CreditCard size={20} color="#FFFFFF" />,
  CARD: <CreditCard size={20} color="#FFFFFF" />,
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, totalAmount, itemCount, clearAllCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const { contentMaxWidth, containerPadding, isTablet } = useResponsiveLayout();

  // Modal State for Address Add Options
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'SELECT_MODE' | 'ADDRESS_LIST' | 'QUICK_FORM'>('SELECT_MODE');
  // Full-screen Map Modal
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [savingMapAddress, setSavingMapAddress] = useState(false);

  // Quick Form Fields
  const [formLabel, setFormLabel] = useState('Home');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddressLine1, setFormAddressLine1] = useState('');
  const [formArea, setFormArea] = useState('Dhanmondi');
  const [formCity, setFormCity] = useState('Dhaka');
  const [formIsDefault, setFormIsDefault] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAddresses = useCallback(async () => {
    try {
      const data = await addressApi.fetchAddresses();
      setAddresses(data);
      const def = data.find((a) => a.isDefault) || data[0];
      if (def) setSelectedAddress(def);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const grandTotal = totalAmount + (itemCount > 0 ? DELIVERY_CHARGE : 0);

  const handleOpenAddModal = () => {
    setModalMode('SELECT_MODE');
    setFormError('');
    setIsAddressModalOpen(true);
  };

  const handleMapConfirm = async (
    location: { lat: number; lng: number; address: string; area: string; city: string },
    fullName: string,
    phone: string
  ) => {
    setSavingMapAddress(true);
    try {
      const newAddr = await addressApi.createAddress({
        label: 'Map Location',
        fullName,
        phone,
        addressLine1: location.address,
        area: location.area,
        city: location.city,
        isDefault: false,
      });
      await loadAddresses();
      setSelectedAddress(newAddr);
      setIsMapModalOpen(false);
    } catch (e) {
      // MapPickerScreen handles error display
    } finally {
      setSavingMapAddress(false);
    }
  };

  const handleQuickSaveAddress = async () => {
    if (!formFullName.trim() || !formPhone.trim() || !formAddressLine1.trim()) {
      setFormError('Please enter Full Name, Phone, and Street Address');
      return;
    }
    setFormError('');
    setSavingAddress(true);
    try {
      const newAddr = await addressApi.createAddress({
        label: formLabel,
        fullName: formFullName.trim(),
        phone: formPhone.trim(),
        addressLine1: formAddressLine1.trim(),
        area: formArea.trim() || 'Central',
        city: formCity.trim() || 'Dhaka',
        isDefault: formIsDefault,
      });
      await loadAddresses();
      setSelectedAddress(newAddr);
      setIsAddressModalOpen(false);
      // Reset form
      setFormFullName('');
      setFormPhone('');
      setFormAddressLine1('');
      setModalMode('SELECT_MODE');
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSavingAddress(false);
    }
  };

  // Payment Modals State
  const [selectedOnlineMethod, setSelectedOnlineMethod] = useState<'BKASH' | 'ROCKET' | 'NOGOD' | 'BANK_TRANSFER' | 'CARD'>('BKASH');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const isValidId = (str?: string) => Boolean(str && typeof str === 'string' && str.trim().length > 0 && !str.startsWith('local_'));

  const executeOrderCreation = async (chosenMethod?: string, txId?: string) => {
    if (!items || items.length === 0) {
      setError('Your cart is empty. Please add products before placing an order.');
      return;
    }
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }
    setError('');
    setPlacing(true);

    try {
      // Step A: Ensure selectedAddress is saved on the supermart-api backend
      let validAddressId = selectedAddress.id;
      if (!validAddressId || typeof validAddressId !== 'string' || validAddressId.startsWith('local_')) {
        try {
          const created = await addressApi.createAddress({
            label: selectedAddress.label || 'Delivery Address',
            fullName: selectedAddress.fullName.trim(),
            phone: selectedAddress.phone.trim(),
            addressLine1: selectedAddress.addressLine1.trim(),
            addressLine2: selectedAddress.addressLine2?.trim(),
            city: selectedAddress.city?.trim() || 'Dhaka',
            area: selectedAddress.area?.trim() || 'Central',
            postalCode: selectedAddress.postalCode?.trim(),
            isDefault: false,
          });
          if (created && created.id) {
            validAddressId = created.id;
            setSelectedAddress(created);
          }
        } catch (e) {
          // continue
        }
      }

      // Step B: Resolve valid active Railway product IDs for order items payload
      const resolvedOrderItems: Array<{ productId: string; quantity: number }> = [];
      try {
        let backendProducts: any[] = [];
        try {
          const prodRes = await productApi.fetchProducts({ limit: 100 });
          backendProducts = (prodRes as any)?.data || (Array.isArray(prodRes) ? prodRes : []);
        } catch (e) {}

        for (const item of items) {
          const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
          const validPId = await resolveValidProductId(item, backendProducts);
          if (validPId && validPId.length > 0) {
            resolvedOrderItems.push({ productId: validPId, quantity: qty });
          }
        }
      } catch (e) {}

      // Step C: Send createOrder request to supermart-api
      const rawPhone = (selectedAddress.fullName ? selectedAddress.phone : '').replace(/[^0-9+]/g, '') || (selectedAddress.phone || '').trim();
      const cleanPhone = rawPhone.length >= 7 ? rawPhone : '01700000000';

      const finalMethod = chosenMethod || paymentMethod || 'COD';
      const finalTxId = txId || transactionId || undefined;

      const orderPayload: any = {
        paymentMethod: finalMethod,
        transactionId: finalTxId ? finalTxId.trim() : undefined,
      };

      if (isValidId(validAddressId)) {
        orderPayload.deliveryAddressId = validAddressId;
      }

      orderPayload.deliveryAddress = {
        fullName: (selectedAddress.fullName || '').trim() || 'Valued Customer',
        phone: cleanPhone,
        addressLine1: (selectedAddress.addressLine1 || '').trim() || 'Default Address, Dhaka',
        addressLine2: selectedAddress.addressLine2?.trim() || undefined,
        city: selectedAddress.city?.trim() || 'Dhaka',
        area: selectedAddress.area?.trim() || 'Central',
        postalCode: selectedAddress.postalCode?.trim() || undefined,
      };

      if (resolvedOrderItems.length > 0) {
        orderPayload.items = resolvedOrderItems;
      } else {
        orderPayload.items = items
          .map((i) => {
            let pId = i.productId || i.product?.id || i.id;
            pId = String(pId || '').replace(/^cart_item_/, '').trim();
            return {
              productId: pId,
              quantity: Math.max(1, Math.round(Number(i.quantity) || 1)),
            };
          })
          .filter((i) => Boolean(i.productId));
      }

      const order = await orderApi.createOrder(orderPayload);
      if (order && order.id) {
        await clearAllCart();
        router.replace(`/order/${order.id}`);
      }
    } catch (e) {
      const msg = getErrorMessage(e);
      const lower = msg.toLowerCase();
      if (
        lower.includes('token') ||
        lower.includes('unauthorized') ||
        lower.includes('authentication') ||
        lower.includes('expired') ||
        lower.includes('login')
      ) {
        Alert.alert(
          'Session Expired',
          'Your login session has expired. Please log in to complete your order.',
          [{ text: 'Log In', onPress: () => router.push('/login') }]
        );
      } else {
        setError(msg);
      }
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!items || items.length === 0) {
      setError('Your cart is empty. Please add products before placing an order.');
      return;
    }
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }
    setError('');

    // Single payment system: Mobile Banking
    const targetMethod = (['BKASH', 'ROCKET', 'NOGOD'].includes(paymentMethod) ? paymentMethod : 'BKASH') as 'BKASH' | 'ROCKET' | 'NOGOD';
    setSelectedOnlineMethod(targetMethod);
    setIsMobileModalOpen(true);
  };

  const handleMobilePaymentConfirm = async (txId: string) => {
    setSubmittingPayment(true);
    try {
      await paymentApi.verifyMobileBankingPayment({
        paymentMethod: selectedOnlineMethod as 'BKASH' | 'ROCKET' | 'NOGOD',
        transactionId: txId,
        amount: grandTotal,
      });
      setTransactionId(txId);
      setIsMobileModalOpen(false);
      await executeOrderCreation(selectedOnlineMethod, txId);
    } catch (e) {
      Alert.alert('Payment Error', getErrorMessage(e));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleBankPaymentConfirm = async (bankName: string, accountNumber: string) => {
    setSubmittingPayment(true);
    try {
      const res = await paymentApi.processBankPayment({
        bankName,
        accountNumber,
        amount: grandTotal,
      });
      setTransactionId(res.transactionId);
      setIsBankModalOpen(false);
      await executeOrderCreation('BANK_TRANSFER', res.transactionId);
    } catch (e) {
      Alert.alert('Payment Error', getErrorMessage(e));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCardPaymentConfirm = async (cardNumber: string, expiryDate: string, cvv: string) => {
    setSubmittingPayment(true);
    try {
      const res = await paymentApi.processCardPayment({
        cardNumber,
        expiryDate,
        cvv,
        amount: grandTotal,
      });
      setTransactionId(res.transactionId);
      setIsCardModalOpen(false);
      await executeOrderCreation('CARD', res.transactionId);
    } catch (e) {
      Alert.alert('Payment Error', getErrorMessage(e));
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) return <Loader fullscreen />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingHorizontal: containerPadding }]}
        >
          {/* Delivery Address Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
          {addresses.length === 0 ? (
            <TouchableOpacity onPress={handleOpenAddModal}>
              <Card padding="md" style={[styles.addAddressCard, { borderColor: colors.primary, borderWidth: 2, borderStyle: 'dashed' }]}>
                <Plus size={24} color={colors.primary} />
                <Text style={[styles.addAddressText, { color: colors.primary }]}>Add New Address</Text>
              </Card>
            </TouchableOpacity>
          ) : (
            <>
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onPress={setSelectedAddress}
                  isSelected={selectedAddress?.id === addr.id}
                />
              ))}
              <TouchableOpacity onPress={handleOpenAddModal}>
                <Text style={[styles.addNewLink, { color: colors.primary }]}>+ Add another address</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Mobile Banking Payment System Section */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.xl }]}>
            Payment Method (Mobile Banking)
          </Text>

          <View style={[styles.onlineSubBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            {[
              { key: 'BKASH', title: 'bKash Mobile Banking', color: '#E2136E', number: '01760049326' },
              { key: 'ROCKET', title: 'Rocket Mobile Banking', color: '#8C3494', number: '01760049326' },
              { key: 'NOGOD', title: 'Nagad Mobile Banking', color: '#F7921E', number: '01760049326' },
            ].map((opt) => {
              const isSelected = paymentMethod === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    setPaymentMethod(opt.key as any);
                    setSelectedOnlineMethod(opt.key as any);
                  }}
                  style={[
                    styles.subOptionItem,
                    {
                      backgroundColor: isSelected ? opt.color + '15' : colors.surface,
                      borderColor: isSelected ? opt.color : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <View style={styles.subOptionLeft}>
                    <Wallet size={22} color={opt.color} />
                    <View>
                      <Text style={[styles.subOptionText, { color: colors.text, fontWeight: '700', fontSize: 15 }]}>
                        {opt.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Send Money to: <Text style={{ fontWeight: '700', color: opt.color }}>{opt.number}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.subRadio, { borderColor: isSelected ? opt.color : colors.border }]}>
                    {isSelected && <View style={[styles.subRadioInner, { backgroundColor: opt.color }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Order Summary */}
          <Card padding="lg" style={[styles.summaryCard, { marginTop: spacing.xl }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items ({itemCount})</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(DELIVERY_CHARGE)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Grand Total</Text>
              <Text style={[styles.grandTotalValue, { color: colors.primary }]}>{formatCurrency(grandTotal)}</Text>
            </View>
          </Card>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingHorizontal: containerPadding }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.footerPrice, { color: colors.primary }]}>{formatCurrency(grandTotal)}</Text>
          </View>
          <Button title="Place Order" onPress={handlePlaceOrder} loading={placing} size="lg" />
        </View>

        {/* Address Add Option Modal */}
        <Modal
          visible={isAddressModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsAddressModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {modalMode !== 'SELECT_MODE' && (
                      <TouchableOpacity onPress={() => setModalMode('SELECT_MODE')} style={styles.modalBackBtn}>
                        <ArrowLeft size={20} color={colors.text} />
                      </TouchableOpacity>
                    )}
                    <MapPin size={22} color={colors.primary} />
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {modalMode === 'SELECT_MODE' && 'Add Delivery Address'}
                      {modalMode === 'ADDRESS_LIST' && 'Saved Addresses'}
                      {modalMode === 'QUICK_FORM' && 'Save Address Details'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsAddressModalOpen(false)} style={styles.modalCloseBtn}>
                    <X size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Modal Body */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                  {/* Mode 1: 3 Option List Items */}
                  {modalMode === 'SELECT_MODE' && (
                    <View style={styles.optionsContainer}>
                      <Text style={[styles.optionsSubtitle, { color: colors.textSecondary }]}>
                        Choose how you would like to add your delivery address:
                      </Text>

                      {/* 1. Select Address using Map */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setIsAddressModalOpen(false);
                          setIsMapModalOpen(true);
                        }}
                        style={[styles.optionCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      >
                        <View style={[styles.optionIconWrapper, { backgroundColor: '#3B82F6' }]}>
                          <MapPin size={22} color="#FFFFFF" />
                        </View>
                        <View style={styles.optionTextWrapper}>
                          <Text style={[styles.optionTitle, { color: colors.text }]}>1. Select Address using Map</Text>
                          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                            Pin your exact location on a real map
                          </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {/* 2. Customized Address – direct form page */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setIsAddressModalOpen(false);
                          router.push('/address-edit?checkout=true');
                        }}
                        style={[styles.optionCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      >
                        <View style={[styles.optionIconWrapper, { backgroundColor: '#10B981' }]}>
                          <ExternalLink size={22} color="#FFFFFF" />
                        </View>
                        <View style={styles.optionTextWrapper}>
                          <Text style={[styles.optionTitle, { color: colors.text }]}>2. Customized Address</Text>
                          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                            Fill in a new address and deliver directly
                          </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {/* 3. Save address - shows saved addresses directly, not edited */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setModalMode('ADDRESS_LIST')}
                        style={[styles.optionCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      >
                        <View style={[styles.optionIconWrapper, { backgroundColor: colors.primary }]}>
                          <PlusCircle size={22} color="#FFFFFF" />
                        </View>
                        <View style={styles.optionTextWrapper}>
                          <Text style={[styles.optionTitle, { color: colors.text }]}>3. Save address</Text>
                          <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                            Select from your saved addresses directly
                          </Text>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Mode 2: Show Saved Addresses Directly (Not edited) */}
                  {modalMode === 'ADDRESS_LIST' && (
                    <View style={styles.addressListContainer}>
                      <Text style={[styles.addressListSubtitle, { color: colors.textSecondary }]}>
                        Tap a saved address to select it for delivery:
                      </Text>

                      {addresses.length === 0 ? (
                        <View style={[styles.emptyAddrBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                          <MapPin size={32} color={colors.textTertiary} />
                          <Text style={[styles.emptyAddrText, { color: colors.textSecondary }]}>
                            No saved addresses found
                          </Text>
                        </View>
                      ) : (
                        addresses.map((addr) => {
                          const isSelected = selectedAddress?.id === addr.id;
                          return (
                            <TouchableOpacity
                              key={addr.id}
                              activeOpacity={0.8}
                              onPress={() => {
                                setSelectedAddress(addr);
                                setIsAddressModalOpen(false);
                              }}
                              style={[
                                styles.addrListCard,
                                {
                                  backgroundColor: isSelected ? colors.primaryLight : colors.inputBg,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                  borderWidth: isSelected ? 2 : 1,
                                },
                              ]}
                            >
                              <View style={[styles.addrListIconWrap, { backgroundColor: colors.primary }]}>
                                <MapPin size={18} color="#FFFFFF" />
                              </View>
                              <View style={styles.addrListTextWrap}>
                                <View style={styles.addrLabelRow}>
                                  <Text style={[styles.addrLabel, { color: colors.primary }]}>{addr.label}</Text>
                                  {addr.isDefault && (
                                    <View style={[styles.defaultBadge, { backgroundColor: colors.primaryLight }]}>
                                      <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Default</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.addrName, { color: colors.text }]} numberOfLines={1}>
                                  {addr.fullName} · {addr.phone}
                                </Text>
                                <Text style={[styles.addrLine, { color: colors.textSecondary }]} numberOfLines={2}>
                                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.area}, {addr.city}
                                </Text>
                              </View>
                              {isSelected && (
                                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                                  <Check size={14} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}

                  {/* Mode 3: Save Address Form */}
                  {modalMode === 'QUICK_FORM' && (
                    <View style={styles.formContainer}>
                      <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                        Fill in your address details to save and select for delivery:
                      </Text>

                      {/* Label Selection */}
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Address Type</Text>
                      <View style={styles.labelRow}>
                        {['Home', 'Work', 'Other'].map((lbl) => (
                          <TouchableOpacity
                            key={lbl}
                            onPress={() => setFormLabel(lbl)}
                            style={[
                              styles.labelChip,
                              {
                                backgroundColor: formLabel === lbl ? colors.primary : colors.inputBg,
                                borderColor: formLabel === lbl ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.labelChipText, { color: formLabel === lbl ? '#FFFFFF' : colors.text }]}>
                              {lbl}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Full Name */}
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Full Name *</Text>
                      <TextInput
                        style={[styles.inputField, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                        value={formFullName}
                        onChangeText={setFormFullName}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={colors.textTertiary}
                      />

                      {/* Phone */}
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Phone Number *</Text>
                      <TextInput
                        style={[styles.inputField, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                        value={formPhone}
                        onChangeText={setFormPhone}
                        placeholder="e.g. 01712345678"
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textTertiary}
                      />

                      {/* Address Line 1 */}
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>Street Address / House & Road *</Text>
                      <TextInput
                        style={[styles.inputField, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                        value={formAddressLine1}
                        onChangeText={setFormAddressLine1}
                        placeholder="e.g. House 12, Road 5, Block B"
                        placeholderTextColor={colors.textTertiary}
                      />

                      {/* Area & City Row */}
                      <View style={styles.inputRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: colors.text }]}>Area</Text>
                          <TextInput
                            style={[styles.inputField, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            value={formArea}
                            onChangeText={setFormArea}
                            placeholder="e.g. Dhanmondi"
                            placeholderTextColor={colors.textTertiary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: colors.text }]}>City</Text>
                          <TextInput
                            style={[styles.inputField, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                            value={formCity}
                            onChangeText={setFormCity}
                            placeholder="e.g. Dhaka"
                            placeholderTextColor={colors.textTertiary}
                          />
                        </View>
                      </View>

                      {formError ? <Text style={[styles.error, { color: colors.error }]}>{formError}</Text> : null}

                      <Button
                        title="Save & Deliver Here"
                        onPress={handleQuickSaveAddress}
                        loading={savingAddress}
                        size="lg"
                        style={{ marginTop: spacing.lg }}
                      />
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Full-Screen Real Map Picker Modal */}
        <Modal
          visible={isMapModalOpen}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsMapModalOpen(false)}
        >
          <MapPickerScreen
            onConfirm={handleMapConfirm}
            onClose={() => setIsMapModalOpen(false)}
            saving={savingMapAddress}
          />
        </Modal>

        {/* Mobile Banking Payment Modal */}
        {['BKASH', 'ROCKET', 'NOGOD'].includes(selectedOnlineMethod) && (
          <MobileBankingModal
            visible={isMobileModalOpen}
            methodKey={selectedOnlineMethod as 'BKASH' | 'ROCKET' | 'NOGOD'}
            amount={grandTotal}
            onClose={() => setIsMobileModalOpen(false)}
            onConfirm={handleMobilePaymentConfirm}
            isSubmitting={submittingPayment}
          />
        )}

        {/* Bank Transfer Modal */}
        <BankTransferModal
          visible={isBankModalOpen}
          amount={grandTotal}
          onClose={() => setIsBankModalOpen(false)}
          onConfirm={handleBankPaymentConfirm}
          isSubmitting={submittingPayment}
        />

        {/* Card Payment Modal */}
        <CardPaymentModal
          visible={isCardModalOpen}
          amount={grandTotal}
          onClose={() => setIsCardModalOpen(false)}
          onConfirm={handleCardPaymentConfirm}
          isSubmitting={submittingPayment}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h3 },
  content: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  sectionTitle: { ...typography.h4, marginBottom: spacing.md },
  addAddressCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  addAddressText: { ...typography.body, fontWeight: '600' },
  addNewLink: { ...typography.bodySmall, fontWeight: '600', marginTop: spacing.sm, textAlign: 'center' },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    width: '100%',
  },
  paymentTouchable: {
    width: '48%',
  },
  paymentCard: {
    width: '100%',
    padding: spacing.md,
  },
  paymentIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: { ...typography.bodySmall, fontWeight: '600' },
  paymentInstruction: { ...typography.bodySmall, marginBottom: spacing.md },
  transactionInput: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  summaryCard: { marginTop: spacing.xl },
  summaryTitle: { ...typography.h4, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { ...typography.bodySmall },
  summaryValue: { ...typography.body, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  grandTotalLabel: { ...typography.h4, fontSize: 16 },
  grandTotalValue: { ...typography.priceLarge, fontSize: 20 },
  error: { ...typography.bodySmall, textAlign: 'center', marginTop: spacing.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerInfo: { flex: 1, marginRight: spacing.md },
  footerLabel: { ...typography.caption },
  footerPrice: { ...typography.price },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.h4,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalBackBtn: {
    marginRight: 4,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: spacing.md,
  },
  optionsSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  optionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    ...typography.caption,
  },

  // Inline Address List Styles
  addressListContainer: {
    paddingBottom: spacing.md,
    gap: 10,
  },
  addressListSubtitle: {
    ...typography.bodySmall,
    marginBottom: 4,
  },
  emptyAddrBox: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyAddrText: {
    ...typography.bodySmall,
  },
  addrListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 12,
  },
  addrListIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addrListTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  addrLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addrLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  defaultBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  addrName: {
    ...typography.caption,
    fontWeight: '600',
  },
  addrLine: {
    ...typography.caption,
    marginTop: 1,
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginTop: 4,
  },
  createNewBtnText: {
    ...typography.body,
    fontWeight: '700',
  },

  // Quick Form Styles
  formContainer: {
    paddingBottom: spacing.md,
  },
  formSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  inputField: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  labelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  labelChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Payment Options Styles
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 12,
    marginTop: spacing.xs,
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  onlineSubBox: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
    gap: 4,
  },
  subOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  subOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subOptionText: {
    fontSize: 13,
  },
  subRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
