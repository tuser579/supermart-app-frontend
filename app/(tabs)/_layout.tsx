import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react-native';
import { useTheme } from '@/src/shared/hooks/useTheme';
import { useAppSelector } from '@/src/shared/hooks/useRedux';
import { useResponsiveLayout } from '@/src/shared/hooks/useResponsiveLayout';
import { DesktopNavbar } from '@/src/modules/common/DesktopNavbar';
import { CustomTabBar } from '@/src/modules/common/CustomTabBar';

export default function TabLayout() {
  const { colors } = useTheme();
  const cartCount = useAppSelector((s) => s.cart.itemCount);
  const { isDesktop } = useResponsiveLayout();

  return (
    <View style={{ flex: 1 }}>
      {isDesktop && <DesktopNavbar />}
      <Tabs
        tabBar={(props) =>
          isDesktop ? null : <CustomTabBar {...props} />
        }
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.iconActive,
          tabBarInactiveTintColor: colors.icon,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
            tabBarBadge: cartCount > 0 ? cartCount : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.badge, color: '#FFFFFF', fontSize: 10 },
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
