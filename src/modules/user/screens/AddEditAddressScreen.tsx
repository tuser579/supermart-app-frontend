import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Phone, MapPin, Home, Truck } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as addressApi from '../services/addressApi';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { getErrorMessage } from '../../../shared/api/apiClient';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function AddEditAddressScreen() {
  const router = useRouter();
  const { id, checkout } = useLocalSearchParams<{ id: string; checkout: string }>();
  const { colors } = useTheme();
  const { contentMaxWidth, containerPadding } = useResponsiveLayout();
  const isEdit = !!id;
  // checkout=true means this form was opened from checkout — show "Deliver Here" button only
  const isCheckoutMode = checkout === 'true';

  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const addresses = await addressApi.fetchAddresses();
      const addr = addresses.find((a) => a.id === id);
      if (addr) {
        setLabel(addr.label);
        setFullName(addr.fullName);
        setPhone(addr.phone);
        setAddressLine1(addr.addressLine1);
        setAddressLine2(addr.addressLine2 || '');
        setCity(addr.city);
        setArea(addr.area);
        setPostalCode(addr.postalCode || '');
        setIsDefault(addr.isDefault);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!label || !fullName || !phone || !addressLine1 || !city || !area) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        label,
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        area,
        postalCode: postalCode || undefined,
        isDefault,
      };
      if (isEdit && id) {
        await addressApi.updateAddress(id, payload);
      } else {
        await addressApi.createAddress(payload);
      }
      router.back();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullscreen />;


  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={[styles.headerRow, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isCheckoutMode ? 'Delivery Address' : isEdit ? 'Edit Address' : 'Add New Address'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={[styles.content, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
        <Card padding="lg" style={styles.formCard}>
          <Input
            label="Label (e.g. Home, Office)"
            value={label}
            onChangeText={setLabel}
            placeholder="Home"
            leftIcon={<Home size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            leftIcon={<User size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Phone *"
            value={phone}
            onChangeText={setPhone}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Address Line 1 *"
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="House #, Road #"
            leftIcon={<MapPin size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Address Line 2"
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Apartment, suite (optional)"
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="City *"
                value={city}
                onChangeText={setCity}
                placeholder="Dhaka"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Area *"
                value={area}
                onChangeText={setArea}
                placeholder="Dhanmondi"
              />
            </View>
          </View>
          <Input
            label="Postal Code"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="1209"
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Set as default address</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          {isCheckoutMode ? (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[
                styles.deliverBtn,
                { backgroundColor: saving ? colors.border : colors.primary },
              ]}
            >
              <Truck size={20} color="#FFFFFF" />
              <Text style={styles.deliverBtnText}>
                {saving ? 'Saving...' : 'Deliver Here'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Button
              title={isEdit ? 'Update Address' : 'Save Address'}
              onPress={handleSave}
              loading={saving}
              fullWidth
              size="lg"
            />
          )}
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h4 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  formCard: { marginBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  switchLabel: { ...typography.body },
  error: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  deliverBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
