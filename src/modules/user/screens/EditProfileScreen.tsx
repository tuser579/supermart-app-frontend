import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, User, Phone } from 'lucide-react-native';
import { useTheme } from '../../../shared/hooks/useTheme';
import { showToast } from '../../common/Toast';
import { useAuth } from '../../auth/hooks/useAuth';
import { ScreenWrapper } from '../../common/ScreenWrapper';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { spacing, radius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { useResponsiveLayout } from '../../../shared/hooks/useResponsiveLayout';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const { contentMaxWidth, containerPadding } = useResponsiveLayout();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const rawUri = event.target?.result as string;
              if (rawUri) {
                const img = new (window as any).Image();
                img.src = rawUri;
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_SIZE = 300;
                  let width = img.width;
                  let height = img.height;
                  if (width > height) {
                    if (width > MAX_SIZE) {
                      height *= MAX_SIZE / width;
                      width = MAX_SIZE;
                    }
                  } else {
                    if (height > MAX_SIZE) {
                      width *= MAX_SIZE / height;
                      height = MAX_SIZE;
                    }
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                  setProfileImage(resizedDataUrl);
                };
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Dynamic import for native platforms
      const ImagePicker = await import('expo-image-picker');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('warning', 'Permission Denied', 'Permission to access gallery is required to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfileImage(imageUri);
      }
    } catch (e) {
      console.error('Image picker error:', e);
    }
  };

  const handleSave = async () => {
    if (!name || !phone) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    const res = await updateProfile({
      name,
      phone,
      profileImage: profileImage || undefined,
    });
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      setError(res.error || 'Failed to update profile');
    }
  };

  return (
    <ScreenWrapper scroll avoidKeyboard>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={[styles.headerRow, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.inputBg }]}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <View style={[styles.content, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: containerPadding }]}>
        <TouchableOpacity style={styles.avatarSection} onPress={handlePickImage} activeOpacity={0.8}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
            <Camera size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Card padding="lg" style={styles.formCard}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            leftIcon={<User size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Email"
            value={user?.email || ''}
            onChangeText={() => {}}
            placeholder="Email"
            editable={false}
            leftIcon={<User size={20} color={colors.textSecondary} />}
          />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Button title="Save Changes" onPress={handleSave} loading={loading} fullWidth size="lg" />
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: { ...typography.h1, fontSize: 36 },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: '38%',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  formCard: { marginBottom: spacing.xl },
  error: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
});
