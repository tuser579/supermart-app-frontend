import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Phone, Edit2, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { Address } from '../../../shared/types/address.types';

interface AddressCardProps {
  address: Address;
  onPress?: (address: Address) => void;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  isSelected?: boolean;
}

export function AddressCard({ address, onPress, onEdit, onDelete, isSelected }: AddressCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress?.(address)} disabled={!onPress}>
      <Card
        padding="md"
        style={[
          styles.card,
          { borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text }]}>{address.label}</Text>
            {address.isDefault && <Badge label="Default" variant="primary" />}
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
              <Check size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{address.fullName}</Text>
        <View style={styles.contactRow}>
          <Phone size={14} color={colors.textSecondary} />
          <Text style={[styles.contact, { color: colors.textSecondary }]}>{address.phone}</Text>
        </View>
        <View style={styles.addressRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.address, { color: colors.textSecondary }]}>
            {address.addressLine1}
            {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.area}, {address.city}
            {address.postalCode ? ` - ${address.postalCode}` : ''}
          </Text>
        </View>

        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(address)} style={styles.actionBtn}>
                <Edit2 size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(address)} style={styles.actionBtn}>
                <Trash2 size={16} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    marginHorizontal: 4,
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...typography.label,
    fontSize: 15,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  contact: {
    ...typography.bodySmall,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  address: {
    ...typography.bodySmall,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
