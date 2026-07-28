import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Upload, ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import * as adminApi from '../services/adminApi';
import * as productApi from '../../user/services/productApi';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Loader } from '../../common/Loader';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { getErrorMessage } from '../../../shared/api/apiClient';

export default function AddEditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const product = await productApi.fetchProductById(id);
      setName(product.name);
      setDescription(product.description);
      setPrice(String(product.price));
      setDiscountPrice(product.discountPrice ? String(product.discountPrice) : '');
      setCategory(product.category);
      setBrand(product.brand);
      setStock(String(product.stock));
      setImageUrl(product.images[0] || '');
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePickImage = async () => {
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64Uri = event.target?.result as string;
              if (base64Uri) {
                setImageUrl(base64Uri);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !category || !brand || !stock) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const parsedPrice = parseFloat(price);
      const parsedStock = parseInt(stock, 10);
      const parsedDiscount = discountPrice && !isNaN(parseFloat(discountPrice)) ? parseFloat(discountPrice) : undefined;

      const payload: any = {
        name,
        description: description || undefined,
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        category,
        brand: brand || undefined,
        stock: isNaN(parsedStock) ? 0 : parsedStock,
        images: imageUrl ? [imageUrl] : ['https://placehold.co/400x300?text=Product'],
      };
      if (parsedDiscount !== undefined) {
        payload.discountPrice = parsedDiscount;
      }

      if (isEdit && id) {
        await adminApi.updateProduct(id, payload);
      } else {
        await adminApi.createProduct(payload);
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{isEdit ? 'Edit Product' : 'Add Product'}</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.imageSection}>
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={[styles.imagePlaceholder, { backgroundColor: colors.inputBg, borderColor: colors.primary }]}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Camera size={32} color={colors.primary} />
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickImage}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              marginBottom: 14,
            }}
          >
            <Upload size={16} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
              {imageUrl ? 'Change Image from Device' : 'Upload Image from Device'}
            </Text>
          </TouchableOpacity>

          <Input
            label="Or Image URL (Optional)"
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
          />
        </View>

        <Card padding="lg" style={styles.formCard}>
          <Input label="Name *" value={name} onChangeText={setName} placeholder="Product name" />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Product description"
            multiline
            numberOfLines={3}
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input label="Price *" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={styles.halfInput}>
              <Input label="Discount Price" value={discountPrice} onChangeText={setDiscountPrice} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input label="Category *" value={category} onChangeText={setCategory} placeholder="Fruits" />
            </View>
            <View style={styles.halfInput}>
              <Input label="Brand *" value={brand} onChangeText={setBrand} placeholder="Brand name" />
            </View>
          </View>
          <Input label="Stock *" value={stock} onChangeText={setStock} placeholder="0" keyboardType="numeric" />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Button
            title={isEdit ? 'Update Product' : 'Add Product'}
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
          />
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h4 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  imageSection: { alignItems: 'center', marginBottom: spacing.lg },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  productImage: { width: 120, height: 120, borderRadius: 60 },
  formCard: { marginBottom: spacing.xl },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  error: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
});
