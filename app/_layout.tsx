import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Provider } from 'react-redux';
import { store } from '@/src/shared/store/store';
import { ThemeProvider, useTheme } from '@/src/shared/hooks/useTheme';
import { initTokens } from '@/src/shared/api/axiosConfig';
import { getAccessToken, getRefreshToken, getStoredUser, getStoredTheme, getStoredCart, saveStoredUser } from '@/src/shared/utils/storage';
import { hydrateAuth, setHydrated, updateUser } from '@/src/shared/store/slices/authSlice';
import { setTheme } from '@/src/shared/store/slices/themeSlice';
import { setCart } from '@/src/shared/store/slices/cartSlice';
import { useAppSelector } from '@/src/shared/hooks/useRedux';
import { userApi } from '@/src/modules/user/services/userApi';

function RootContent() {
  useFrameworkReady();
  const { isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { isLoggedIn, isHydrated, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    (async () => {
      await initTokens();
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const userStr = await getStoredUser();
      const themeMode = await getStoredTheme();
      const storedCart = await getStoredCart();

      if (storedCart && storedCart.length > 0) {
        store.dispatch(setCart(storedCart));
      }

      if (themeMode === 'light' || themeMode === 'dark' || themeMode === 'system') {
        store.dispatch(setTheme(themeMode));
      }

      if (accessToken && refreshToken && userStr) {
        const u = JSON.parse(userStr);
        store.dispatch(hydrateAuth({ user: u, accessToken, refreshToken }));

        // Sync with backend on reload
        userApi.getProfile().then((freshUser) => {
          if (freshUser) {
            const merged = { ...u, ...freshUser };
            store.dispatch(updateUser(merged));
            saveStoredUser(JSON.stringify(merged));
          }
        }).catch(() => {});
      } else {
        store.dispatch(setHydrated());
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inStaffGroup = segments[0] === 'staff';
    const inAdminGroup = segments[0] === 'admin';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLoggedIn && inAuthGroup) {
      if (user?.role === 'STAFF') {
        router.replace('/staff/dashboard');
      } else if (user?.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } else if (isLoggedIn && user?.role === 'STAFF' && inTabsGroup) {
      router.replace('/staff/dashboard');
    } else if (isLoggedIn && user?.role === 'ADMIN' && inTabsGroup) {
      router.replace('/admin/dashboard');
    }
  }, [isHydrated, isLoggedIn, user, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="address-edit" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="search" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </Provider>
  );
}
