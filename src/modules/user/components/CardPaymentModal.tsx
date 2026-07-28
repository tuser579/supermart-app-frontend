import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { CreditCard, X } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { formatCurrency } from '../../../shared/utils/formatters';

interface CardPaymentModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onConfirm: (cardNumber: string, expiryDate: string, cvv: string) => void;
  isSubmitting?: boolean;
}

export const CardPaymentModal: React.FC<CardPaymentModalProps> = ({
  visible,
  amount,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { colors } = useTheme();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!cleanCard || cleanCard.length < 13 || cleanCard.length > 19) {
      setError('Please enter a valid 13-19 digit card number');
      return;
    }
    if (!expiryDate.trim() || !expiryDate.includes('/')) {
      setError('Please enter expiry date (MM/YY)');
      return;
    }
    if (!cvv.trim() || cvv.length < 3) {
      setError('Please enter a valid 3-4 digit CVV');
      return;
    }
    setError('');
    onConfirm(cleanCard, expiryDate.trim(), cvv.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={Keyboard.dismiss}>
        <TouchableOpacity activeOpacity={1}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.iconBadge, { backgroundColor: '#3B82F620' }]}>
                  <CreditCard size={22} color="#3B82F6" />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Visa / Mastercard</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
              Pay amount: <Text style={{ color: '#CC397B', fontWeight: '700' }}>{formatCurrency(amount)}</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Card Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="4532 0000 0000 0000"
                placeholderTextColor={colors.textSecondary}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Expiry (MM/YY) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="12/28"
                  placeholderTextColor={colors.textSecondary}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>CVV *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder="123"
                  placeholderTextColor={colors.textSecondary}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Pay Now" onPress={handleConfirm} loading={isSubmitting} style={{ flex: 1.5, backgroundColor: '#3B82F6' }} />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 14,
  },
  closeBtn: {
    padding: 6,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.xs,
  },
});
