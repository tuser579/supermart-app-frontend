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
import { Wallet, Copy, Check, X } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { formatCurrency } from '../../../shared/utils/formatters';

export interface MobileBankingConfig {
  key: 'BKASH' | 'ROCKET' | 'NOGOD';
  displayName: string;
  number: string;
  color: string;
}

export const PAYMENT_CONFIGS: Record<'BKASH' | 'ROCKET' | 'NOGOD', MobileBankingConfig> = {
  BKASH: {
    key: 'BKASH',
    displayName: 'bKash',
    number: '01760049326',
    color: '#E2136E',
  },
  ROCKET: {
    key: 'ROCKET',
    displayName: 'Rocket',
    number: '01760049326',
    color: '#8C3494',
  },
  NOGOD: {
    key: 'NOGOD',
    displayName: 'Nagad',
    number: '01760049326',
    color: '#F7921E',
  },
};

interface MobileBankingModalProps {
  visible: boolean;
  methodKey: 'BKASH' | 'ROCKET' | 'NOGOD';
  amount: number;
  onClose: () => void;
  onConfirm: (transactionId: string) => void;
  isSubmitting?: boolean;
}

export const MobileBankingModal: React.FC<MobileBankingModalProps> = ({
  visible,
  methodKey,
  amount,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { colors } = useTheme();
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const config = PAYMENT_CONFIGS[methodKey] || PAYMENT_CONFIGS.BKASH;

  const handleCopyNumber = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(config.number);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirm = () => {
    const trimmed = transactionId.trim();
    if (!trimmed) {
      setError('Please enter the Transaction ID from your payment SMS');
      return;
    }
    if (trimmed.length < 4) {
      setError('Transaction ID must be at least 4 characters long');
      return;
    }
    setError('');
    onConfirm(trimmed);
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
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.iconBadge, { backgroundColor: config.color + '20' }]}>
                  <Wallet size={22} color={config.color} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {config.displayName} Payment
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Merchant / Personal Number Card */}
            <View style={[styles.numberCard, { backgroundColor: config.color + '10', borderColor: config.color + '30' }]}>
              <Text style={[styles.numberLabel, { color: colors.textSecondary }]}>
                {config.displayName} Send Money Number
              </Text>
              <View style={styles.numberRow}>
                <Text style={[styles.numberText, { color: config.color }]}>
                  {config.number}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyNumber}
                  style={[styles.copyBtn, { backgroundColor: config.color }]}
                >
                  {copied ? (
                    <Check size={16} color="#FFFFFF" />
                  ) : (
                    <Copy size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.copyBtnText}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment Instructions */}
            <View style={[styles.instructionBox, { backgroundColor: colors.inputBg }]}>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                1. Open your <Text style={{ fontWeight: '700', color: config.color }}>{config.displayName}</Text> app or dial code.
              </Text>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                2. Select <Text style={{ fontWeight: '700' }}>"Send Money"</Text> to number above.
              </Text>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                3. Amount to send: <Text style={{ fontWeight: '700', color: '#CC397B' }}>{formatCurrency(amount)}</Text>
              </Text>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                4. Enter the received <Text style={{ fontWeight: '700' }}>Transaction ID (TxnID)</Text> below.
              </Text>
            </View>

            {/* Transaction ID Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Transaction ID *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: error ? '#EF4444' : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. TRX89234AB"
                placeholderTextColor={colors.textSecondary}
                value={transactionId}
                onChangeText={(text) => {
                  setTransactionId(text.toUpperCase());
                  if (error) setError('');
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Payment"
                onPress={handleConfirm}
                loading={isSubmitting}
                style={{ flex: 1.5, backgroundColor: config.color }}
              />
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
    marginBottom: spacing.xs,
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
  closeBtn: {
    padding: 6,
  },
  numberCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  numberLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 18,
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
    fontWeight: '600',
    letterSpacing: 1,
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
