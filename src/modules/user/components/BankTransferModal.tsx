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
import { Building2, X } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { formatCurrency } from '../../../shared/utils/formatters';

interface BankTransferModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onConfirm: (bankName: string, accountNumber: string) => void;
  isSubmitting?: boolean;
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  visible,
  amount,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { colors } = useTheme();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!bankName.trim() || !accountNumber.trim()) {
      setError('Please enter both Bank Name and Account Number');
      return;
    }
    setError('');
    onConfirm(bankName.trim(), accountNumber.trim());
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
                <View style={[styles.iconBadge, { backgroundColor: '#10B98120' }]}>
                  <Building2 size={22} color="#10B981" />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Bank Transfer</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
              Transfer amount: <Text style={{ color: '#CC397B', fontWeight: '700' }}>{formatCurrency(amount)}</Text>
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Bank Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Islami Bank, DBBL, Brac Bank"
                placeholderTextColor={colors.textSecondary}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Account Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter account number"
                placeholderTextColor={colors.textSecondary}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Pay Now" onPress={handleConfirm} loading={isSubmitting} style={{ flex: 1.5, backgroundColor: '#10B981' }} />
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
