import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Plus, Trash2, Smartphone } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { paymentMethodApi, SavedPaymentMethod } from '../services/paymentApi';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMethods = async () => {
    try {
      const data = await paymentMethodApi.getSavedMethods();
      setMethods(data);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMethods();
  };

  const handleDelete = async (id: string) => {
    try {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      await paymentMethodApi.deleteSavedMethod(id);
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      fetchMethods(); // revert on failure
    }
  };

  // Dummy action for demo
  const handleAddNew = async () => {
    try {
      const newMethod = await paymentMethodApi.addSavedMethod({
        type: 'MOBILE_BANKING',
        provider: 'BKASH',
        last4: '1234',
        isDefault: methods.length === 0,
      });
      setMethods([newMethod, ...methods]);
    } catch (error) {
      console.error('Failed to add demo method:', error);
    }
  };

  return (
    <ScreenWrapper>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Payment Methods</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {methods.length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCard size={64} color={colors.textSecondary} style={{ marginBottom: spacing.lg }} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Payment Methods</Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                You haven't saved any payment methods yet.
              </Text>
              <Button 
                title="Add Mock Method" 
                onPress={handleAddNew} 
                style={{ marginTop: spacing.xl }}
              />
            </View>
          ) : (
            <View style={styles.list}>
              {methods.map((method) => (
                <Card key={method.id} padding="md" style={styles.methodCard}>
                  <View style={styles.methodContent}>
                    <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
                      {method.type === 'CARD' ? (
                        <CreditCard size={24} color={colors.primary} />
                      ) : (
                        <Smartphone size={24} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={[styles.methodProvider, { color: colors.text }]}>
                        {method.provider}
                      </Text>
                      <Text style={[styles.methodNumber, { color: colors.textSecondary }]}>
                        **** **** **** {method.last4 || '0000'}
                      </Text>
                      {method.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(method.id)}
                    >
                      <Trash2 size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: { ...typography.h4 },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyStateTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  methodCard: {
    borderWidth: 1,
    borderColor: 'transparent', // Can change if needed
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodProvider: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodNumber: {
    ...typography.caption,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
