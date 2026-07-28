import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="products" />
      <Stack.Screen name="product-edit" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="users" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
