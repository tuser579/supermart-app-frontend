# Supermart Frontend — Detailed Implementation Plan
## React Native + TypeScript | Expo Managed | Both Platforms

> **Stack confirmed**: Expo Managed Workflow • Android + iOS • NativeWind v4 • Expo Push Notifications • Dedicated Address endpoint • 100% free tools

---

## Backend Additions Required First

> [!IMPORTANT]
> Two backend changes must be made before starting the frontend. These are small additions that unlock the features you confirmed.

### 1. Address Module (NEW)
A dedicated address book so users can save and reuse delivery addresses.

**Schema addition to `schema.prisma`:**
```prisma
model Address {
  id           String  @id @default(cuid())
  userId       String
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  label        String  // "Home", "Office", etc.
  fullName     String
  phone        String
  addressLine1 String
  addressLine2 String?
  city         String
  area         String
  postalCode   String?
  isDefault    Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("addresses")
}
```

**New endpoints:**
```
GET    /api/v1/addresses          — list all user's saved addresses
POST   /api/v1/addresses          — save a new address
PUT    /api/v1/addresses/:id      — update an address
DELETE /api/v1/addresses/:id      — delete an address
PATCH  /api/v1/addresses/:id/default  — set as default
```

### 2. Push Notification Token (EXISTING User model)
Add `expoPushToken String?` to `User` model + endpoint to save it after login.

```
POST /api/v1/users/push-token    — save Expo push token for the logged-in user
```

---

## Dependencies (All Free)

### Core
```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.0",
  "typescript": "^5.3.0"
}
```

### Navigation
```json
{
  "@react-navigation/native": "^6.1.17",
  "@react-navigation/stack": "^6.3.29",
  "@react-navigation/bottom-tabs": "^6.5.20",
  "@react-navigation/drawer": "^6.6.15",
  "react-native-screens": "~3.31.1",
  "react-native-safe-area-context": "4.10.5",
  "react-native-gesture-handler": "~2.16.1"
}
```

### Styling
```json
{
  "nativewind": "^4.0.1",
  "tailwindcss": "^3.4.0"
}
```

### State Management
```json
{
  "@reduxjs/toolkit": "^2.2.5",
  "react-redux": "^9.1.2"
}
```

### HTTP & Storage
```json
{
  "axios": "^1.7.2",
  "expo-secure-store": "~13.0.2",
  "expo-constants": "~16.0.2"
}
```

### Forms & Validation
```json
{
  "react-hook-form": "^7.52.1",
  "@hookform/resolvers": "^3.7.0",
  "zod": "^3.23.8"
}
```

### Push Notifications
```json
{
  "expo-notifications": "~0.28.15",
  "expo-device": "~6.0.2"
}
```

### UI Utilities
```json
{
  "react-native-reanimated": "~3.10.1",
  "react-native-vector-icons": "^10.1.0",
  "@expo/vector-icons": "^14.0.2",
  "react-native-image-carousel": "latest",
  "expo-image-picker": "~15.0.7",
  "react-native-gifted-charts": "^1.4.0",
  "react-native-swipeable": "latest",
  "expo-linear-gradient": "~13.0.2",
  "react-native-toast-message": "^2.2.0"
}
```

---

## Complete File Structure

```
supermart-app/
│
├── .env                                  # API_URL + EXPO_PROJECT_ID
├── app.json                              # Expo config (name, slug, icon, splash)
├── package.json
├── tsconfig.json                         # strict mode ON
├── tailwind.config.js                    # NativeWind v4 config
├── babel.config.js                       # expo preset + nativewind plugin
├── metro.config.js                       # NativeWind v4 metro config
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── splash.png
│   │   ├── icon.png
│   │   └── placeholder-product.png
│   └── fonts/
│       └── (custom fonts if needed)
│
└── src/
    │
    ├── App.tsx                           # Root: <ReduxProvider> + <NavigationContainer>
    │                                     # Hydrates token from SecureStore on boot
    │
    ├── shared/                           # Infrastructure — no business logic
    │   │
    │   ├── api/
    │   │   ├── axiosConfig.ts            # Base URL from .env, 10s timeout
    │   │   │                             # Request interceptor: attach Bearer token
    │   │   │                             # Response interceptor: silent refresh on 401
    │   │   └── apiClient.ts             # get(), post(), put(), patch(), del() wrappers
    │   │                                 # All return typed Promise<T>
    │   │
    │   ├── navigation/
    │   │   ├── AppNavigator.tsx          # Root switch: AuthNav / UserNav / StaffNav / AdminNav
    │   │   │                             # Reads role from Redux authSlice
    │   │   ├── AuthNavigator.tsx         # Stack: Splash → Login → Register → OTP
    │   │   ├── UserTabNavigator.tsx      # Bottom tabs: Home | Search | Cart | Orders | Profile
    │   │   │                             # Cart tab shows badge with item count
    │   │   ├── StaffDrawerNavigator.tsx  # Drawer: Dashboard | My Orders | Attendance | Earnings
    │   │   └── AdminDrawerNavigator.tsx  # Drawer: Dashboard | Products | Orders | Staff | Users | Reports
    │   │
    │   ├── store/
    │   │   ├── store.ts                  # configureStore with middleware
    │   │   ├── rootReducer.ts            # combineReducers
    │   │   └── slices/
    │   │       ├── authSlice.ts          # { user, accessToken, refreshToken, isLoggedIn, role }
    │   │       │                         # Actions: setCredentials, logout, updateUser
    │   │       ├── cartSlice.ts          # { items[], totalAmount, itemCount, isLoading }
    │   │       │                         # Actions: setCart, addItem, removeItem, updateQty, clearCart
    │   │       └── productSlice.ts       # { list[], categories[], selectedProduct, filters, pagination }
    │   │                                 # Actions: setProducts, setCategories, setSelected, setFilters
    │   │
    │   ├── hooks/
    │   │   ├── useAppSelector.ts         # TypedUseSelectorHook<RootState>
    │   │   ├── useAppDispatch.ts         # () => AppDispatch
    │   │   └── useDebounce.ts            # debounce(value, delay) — for search inputs
    │   │
    │   ├── types/
    │   │   ├── auth.types.ts             # User, LoginPayload, RegisterPayload, OTPPayload
    │   │   ├── product.types.ts          # Product, Category, ProductFilters, ProductQuery
    │   │   ├── order.types.ts            # Order, OrderItem, OrderStatus enum, PaymentMethod enum
    │   │   ├── cart.types.ts             # Cart, CartItem
    │   │   ├── address.types.ts          # Address, CreateAddressPayload
    │   │   ├── staff.types.ts            # Staff, StaffProfile, Attendance, Earnings
    │   │   ├── admin.types.ts            # DashboardStats, SalesReport, TopProduct
    │   │   └── notification.types.ts     # Notification, NotificationData
    │   │
    │   ├── utils/
    │   │   ├── formatters.ts             # formatCurrency(৳), formatDate(), formatPhone()
    │   │   ├── validators.ts             # Zod schemas matching backend validation exactly
    │   │   └── storage.ts                # SecureStore: getToken(), saveToken(), clearToken()
    │   │
    │   └── services/
    │       └── pushNotificationService.ts  # registerForPushNotifications()
    │                                        # sendLocalNotification()
    │                                        # handleForegroundNotification()
    │
    └── modules/
        │
        ├── common/                        # Reusable UI components (no API calls)
        │   ├── Button.tsx                 # variants: primary | secondary | outline | ghost | danger
        │   │                              # sizes: sm | md | lg, loading spinner built-in
        │   ├── Input.tsx                  # label, error, secureEntry, leftIcon, rightIcon
        │   ├── Card.tsx                   # shadow, rounded, padding variants
        │   ├── Modal.tsx                  # bottom sheet + center modal variants
        │   ├── Loader.tsx                 # full-screen spinner + skeleton variants
        │   ├── Toast.tsx                  # success | error | warning | info via react-native-toast-message
        │   ├── Badge.tsx                  # colored pill for order status
        │   ├── EmptyState.tsx             # icon + title + subtitle + optional CTA button
        │   ├── ScreenWrapper.tsx          # SafeAreaView + KeyboardAvoidingView + scroll wrapper
        │   ├── SearchBar.tsx              # debounced text input with clear button
        │   ├── ImageCarousel.tsx          # auto-scroll banner carousel
        │   └── ConfirmDialog.tsx          # "Are you sure?" modal with confirm/cancel
        │
        ├── auth/
        │   ├── screens/
        │   │   ├── SplashScreen.tsx           # App logo + auto-redirect after token check
        │   │   ├── LoginScreen.tsx             # Email + Password + "Forgot Password" link
        │   │   ├── RegisterScreen.tsx          # Name, Email, Phone, Password, Confirm
        │   │   └── OTPVerificationScreen.tsx   # 6-digit OTP input + resend timer
        │   ├── hooks/
        │   │   └── useAuth.ts                  # login(), register(), verifyOTP(), logout()
        │   │                                    # Dispatches to authSlice on success
        │   │                                    # Saves tokens via storage.ts on login
        │   └── services/
        │       └── authApi.ts
        │           # POST /auth/register     → { name, email, phone, password }
        │           # POST /auth/login        → { email, password }
        │           # POST /auth/verify-otp   → { email, otp }
        │           # POST /auth/resend-otp   → { email }
        │           # POST /auth/refresh-token → { refreshToken }
        │           # POST /auth/logout
        │
        ├── user/
        │   ├── screens/
        │   │   │
        │   │   ├── home/
        │   │   │   ├── HomeScreen.tsx
        │   │   │   │   # Hero banner carousel (auto-scroll)
        │   │   │   │   # Category pills — horizontal scroll
        │   │   │   │   # "Flash Sale" section — countdown timer
        │   │   │   │   # "All Products" — paginated FlatList grid (2 cols)
        │   │   │   │   # Pull-to-refresh
        │   │   │   │
        │   │   │   └── CategoryScreen.tsx
        │   │   │       # Products filtered by tapped category
        │   │   │       # Same grid layout as HomeScreen
        │   │   │
        │   │   ├── products/
        │   │   │   ├── ProductListScreen.tsx
        │   │   │   │   # SearchBar at top (debounced, hits GET /products?search=)
        │   │   │   │   # Filter sheet: category, price range, in-stock only, sort
        │   │   │   │   # Paginated FlatList grid — loads more on scroll
        │   │   │   │   # Empty state if no results
        │   │   │   │
        │   │   │   └── ProductDetailScreen.tsx
        │   │   │       # Image carousel (product images)
        │   │   │       # Name, brand, price (discountPrice if set)
        │   │   │       # Stock badge ("In Stock" / "Out of Stock")
        │   │   │       # Quantity selector (+/-)
        │   │   │       # "Add to Cart" button (disabled if out of stock)
        │   │   │       # Reviews section — star average + list
        │   │   │       # "Write a Review" form (if purchased)
        │   │   │
        │   │   ├── cart/
        │   │   │   ├── CartScreen.tsx
        │   │   │   │   # Swipeable cart rows (swipe left to delete)
        │   │   │   │   # Quantity +/- per item
        │   │   │   │   # Subtotal + delivery charge (৳60) + total
        │   │   │   │   # "Proceed to Checkout" CTA
        │   │   │   │   # Empty state with "Shop Now" link
        │   │   │   │
        │   │   │   └── CheckoutScreen.tsx
        │   │   │       # Saved addresses list — tap to select, "Add New" button
        │   │   │       # Payment Method picker:
        │   │   │       #   COD | Bkash | Rocket | Nogod | Bank Transfer | Visa/MC
        │   │   │       # Mobile banking flow: show merchant number + txn ID input
        │   │   │       # Bank/Card flow: calls /payments/bank or /payments/card first
        │   │   │       # Order summary card at bottom
        │   │   │       # "Place Order" button
        │   │   │
        │   │   ├── orders/
        │   │   │   ├── OrdersScreen.tsx
        │   │   │   │   # Tabs: All | Pending | Processing | Delivered | Cancelled
        │   │   │   │   # Order cards — orderId, date, items count, total, status badge
        │   │   │   │   # Tap → TrackOrderScreen
        │   │   │   │
        │   │   │   └── TrackOrderScreen.tsx
        │   │   │       # Order detail: items list, address, payment info, transactionId
        │   │   │       # Status timeline stepper (PENDING → CONFIRMED → ... → DELIVERED)
        │   │   │       # "Cancel Order" button (only if PENDING or CONFIRMED)
        │   │   │
        │   │   ├── profile/
        │   │   │   ├── ProfileScreen.tsx
        │   │   │   │   # Avatar + name + email + phone
        │   │   │   │   # Menu: Edit Profile | Saved Addresses | Change Password
        │   │   │   │   #       Notifications | Delete Account | Logout
        │   │   │   │
        │   │   │   ├── EditProfileScreen.tsx
        │   │   │   │   # Form: name, phone, profile image picker (expo-image-picker)
        │   │   │   │
        │   │   │   ├── AddressScreen.tsx
        │   │   │   │   # List of saved addresses with default badge
        │   │   │   │   # Swipe to delete, tap to edit
        │   │   │   │   # "+ Add New Address" button
        │   │   │   │
        │   │   │   ├── AddEditAddressScreen.tsx
        │   │   │   │   # Form: label, fullName, phone, addressLine1/2, city, area, postalCode
        │   │   │   │   # "Set as Default" toggle
        │   │   │   │
        │   │   │   ├── ChangePasswordScreen.tsx
        │   │   │   │   # Current password + New + Confirm
        │   │   │   │
        │   │   │   └── NotificationsScreen.tsx
        │   │   │       # List of notifications (title, message, time, read/unread)
        │   │   │       # "Mark all as read" button in header
        │   │   │       # Unread badge on Profile tab
        │   │   │
        │   ├── components/
        │   │   ├── ProductCard.tsx          # Image, name, price, discount badge, add-to-cart icon
        │   │   ├── CartItemRow.tsx          # Swipeable, image, name, price, qty controls
        │   │   ├── OrderCard.tsx            # orderId, date, status badge, total, items preview
        │   │   ├── PaymentMethodPicker.tsx  # Horizontal scroll of payment options with icons
        │   │   ├── MobileBankingSheet.tsx   # Bottom sheet: shows merchant number + txn ID input
        │   │   ├── AddressCard.tsx          # Address display with default badge + edit/delete icons
        │   │   ├── ReviewItem.tsx           # Avatar + star rating + comment + date
        │   │   ├── ReviewForm.tsx           # Star tap input + comment box
        │   │   ├── StatusTimeline.tsx       # Vertical stepper for order status
        │   │   ├── CategoryPill.tsx         # Tappable category chip with icon
        │   │   └── PriceTag.tsx             # Price + strikethrough discountPrice
        │   │
        │   ├── hooks/
        │   │   ├── useCart.ts               # addToCart(), removeFromCart(), updateQty()
        │   │   │                            # Syncs Redux cartSlice with backend
        │   │   └── useProducts.ts           # fetchProducts(filters), fetchById(id), searchProducts(q)
        │   │                                # Manages loading/error state locally
        │   │
        │   └── services/
        │       ├── productApi.ts
        │       │   # GET  /products?search=&category=&page=&limit=&sort=
        │       │   # GET  /products/categories
        │       │   # GET  /products/:id
        │       │
        │       ├── cartApi.ts
        │       │   # GET    /cart
        │       │   # POST   /cart/items        { productId, quantity }
        │       │   # PUT    /cart/items/:id    { quantity }
        │       │   # DELETE /cart/items/:id
        │       │   # DELETE /cart              (clear cart)
        │       │
        │       ├── orderApi.ts
        │       │   # POST   /orders            { deliveryAddress, paymentMethod, transactionId? }
        │       │   # GET    /orders?status=&page=
        │       │   # GET    /orders/:id
        │       │   # POST   /orders/:id/cancel  { reason? }
        │       │
        │       ├── addressApi.ts
        │       │   # GET    /addresses
        │       │   # POST   /addresses
        │       │   # PUT    /addresses/:id
        │       │   # DELETE /addresses/:id
        │       │   # PATCH  /addresses/:id/default
        │       │
        │       ├── paymentApi.ts
        │       │   # POST   /payments/bank    { bankName, accountNumber, amount }
        │       │   # POST   /payments/card    { cardNumber, expiryDate, cvv, amount }
        │       │
        │       ├── reviewApi.ts
        │       │   # POST   /reviews          { productId, rating, comment }
        │       │   # GET    /reviews?productId=
        │       │
        │       └── notificationApi.ts
        │           # GET  /notifications
        │           # PUT  /notifications/read-all
        │           # PUT  /notifications/:id/read
        │
        ├── staff/
        │   ├── screens/
        │   │   ├── dashboard/
        │   │   │   └── StaffDashboardScreen.tsx
        │   │   │       # StatsCards: Today's Deliveries | Total Earnings | Rating
        │   │   │       # Quick links to assigned orders and attendance
        │   │   │       # Availability toggle (PATCH /staff/availability)
        │   │   │
        │   │   ├── orders/
        │   │   │   ├── AssignedOrdersScreen.tsx
        │   │   │   │   # FlatList of orders assigned to this staff
        │   │   │   │   # Filter tabs: All | Active | Completed
        │   │   │   │   # Each row: orderId, customer name, address, status
        │   │   │   │
        │   │   │   └── UpdateOrderStatusScreen.tsx
        │   │   │       # Full order detail
        │   │   │       # StatusStepper showing current step
        │   │   │       # "Update to Next Status" button (CONFIRMED→SHIPPED→DELIVERED)
        │   │   │       # Customer phone (tap to call via Linking.openURL)
        │   │   │
        │   │   ├── attendance/
        │   │   │   └── AttendanceScreen.tsx
        │   │   │       # Today's check-in/check-out status
        │   │   │       # "Mark Check-In" / "Mark Check-Out" button
        │   │   │       # Past 30-day attendance calendar view
        │   │   │
        │   │   └── earnings/
        │   │       └── EarningsScreen.tsx
        │   │           # Total earnings card
        │   │           # Per-delivery breakdown list
        │   │           # Monthly summary bar
        │   │
        │   ├── components/
        │   │   ├── OrderListItem.tsx        # Compact row: orderId, address, status, time
        │   │   ├── StatusStepper.tsx        # Horizontal progress stepper
        │   │   ├── AvailabilityToggle.tsx   # Switch component with label
        │   │   └── AttendanceCalendar.tsx   # Simple calendar with color-coded days
        │   │
        │   └── services/
        │       ├── deliveryApi.ts
        │       │   # GET   /staff/orders
        │       │   # GET   /staff/profile
        │       │   # PUT   /orders/:id/status   { status }
        │       │   # PATCH /staff/availability  { isAvailable }
        │       │
        │       └── attendanceApi.ts
        │           # POST  /staff/attendance    { checkIn | checkOut }
        │           # GET   /staff/attendance
        │           # GET   /staff/earnings
        │
        └── admin/
            ├── screens/
            │   ├── dashboard/
            │   │   └── AdminDashboardScreen.tsx
            │   │       # StatsCards: Total Revenue | Orders Today | Active Users | Staff Count
            │   │       # SalesChart (last 7 days line chart — Gifted Charts, free)
            │   │       # Top 5 Products list
            │   │       # Recent orders table
            │   │
            │   ├── products/
            │   │   ├── ProductManagementScreen.tsx
            │   │   │   # Searchable FlatList of all products
            │   │   │   # Each row: image, name, price, stock, status toggle
            │   │   │   # Swipe actions: edit, delete
            │   │   │   # FAB "+" → AddEditProductScreen
            │   │   │
            │   │   └── AddEditProductScreen.tsx
            │   │       # Form: name, description, price, discountPrice
            │   │       #       category (dropdown), brand, stock, images
            │   │       # expo-image-picker for image upload
            │   │       # Works for both ADD (POST) and EDIT (PUT)
            │   │
            │   ├── orders/
            │   │   └── AllOrdersScreen.tsx
            │   │       # Filter tabs: All | Pending | Confirmed | Shipped | Delivered
            │   │       # Each order: orderId, user, total, date, status, payment badge
            │   │       # "Assign Staff" bottom sheet — dropdown of available staff
            │   │       # Tap → order detail view
            │   │
            │   ├── staff/
            │   │   ├── StaffListScreen.tsx
            │   │   │   # Table: name, position, deliveries, rating, availability dot
            │   │   │   # FAB "+" → AddStaffScreen
            │   │   │
            │   │   └── AddStaffScreen.tsx
            │   │       # Form: userId (from user list), position, shift, salary
            │   │
            │   ├── users/
            │   │   └── UsersScreen.tsx
            │   │       # User list: name, email, phone, status badge
            │   │       # Toggle active/inactive (PATCH /admin/users/:id/status)
            │   │
            │   └── reports/
            │       └── SalesReportScreen.tsx
            │           # Date range picker (free: react-native-date-picker)
            │           # Revenue line chart (Gifted Charts — free)
            │           # Top products bar chart
            │           # GET /admin/reports/sales + /admin/reports/products
            │
            ├── components/
            │   ├── StatsCard.tsx             # Icon + label + value + % change arrow
            │   ├── SalesChart.tsx            # Gifted Charts LineChart wrapper
            │   ├── AdminOrderRow.tsx          # Compact row with "Assign" button
            │   ├── AssignStaffSheet.tsx       # Bottom sheet picker for staff assignment
            │   └── TopProductRow.tsx          # Rank + image + name + sales count
            │
            └── services/
                └── adminApi.ts
                    # GET   /admin/dashboard
                    # GET   /admin/reports/sales?from=&to=
                    # GET   /admin/reports/products
                    # GET   /admin/users
                    # PATCH /admin/users/:id/status   { isActive }
                    # GET   /admin/staff/performance
                    # GET   /staff                    (list all staff)
                    # POST  /staff                    (add staff)
```

---

## Phased Build Plan

### ⚙️ Phase 0 — Backend Additions (Before Frontend)
- [ ] Add `Address` model to `schema.prisma`
- [ ] Add `expoPushToken` field to `User` model
- [ ] Create `address` module: controller, service, routes, validation
- [ ] Add `POST /users/push-token` endpoint to `user.routes.ts`
- [ ] Run `npx prisma db push` + `npx prisma generate`
- [ ] Verify with `npx tsc --noEmit`

### 🏗️ Phase 1 — Project Setup & Infrastructure
- [ ] `npx create-expo-app supermart-app --template expo-template-blank-typescript`
- [ ] Install all dependencies from the list above
- [ ] Configure `tailwind.config.js` + `babel.config.js` for NativeWind v4
- [ ] Configure `metro.config.js` for NativeWind v4
- [ ] Set up `.env`: `API_URL`, `EXPO_PROJECT_ID`
- [ ] Create `tsconfig.json` with `strict: true`, path aliases (`@shared/*`, `@modules/*`)
- [ ] Build `axiosConfig.ts` — base URL, 10s timeout, JWT interceptor, refresh logic
- [ ] Build `storage.ts` — SecureStore wrappers for token management
- [ ] Create Redux store with `authSlice`, `cartSlice`, `productSlice` (empty stubs)
- [ ] Create all TypeScript type files under `shared/types/`
- [ ] Build `AppNavigator.tsx` — renders correct navigator by role

### 🔐 Phase 2 — Auth Module
- [ ] `SplashScreen` — logo + token hydration + redirect
- [ ] `LoginScreen` — form with react-hook-form + zod
- [ ] `RegisterScreen` — full registration form
- [ ] `OTPVerificationScreen` — 6-digit OTP + 60s resend timer
- [ ] `authApi.ts` — all 6 endpoints
- [ ] `useAuth.ts` hook — full login/register/logout flow
- [ ] `authSlice.ts` — save user + tokens, hydrate on boot
- [ ] `pushNotificationService.ts` — request permission + get token + save via `/users/push-token`

### 🛍️ Phase 3 — User Panel
- [ ] All common components (Button, Input, Card, Modal, Loader, Toast, etc.)
- [ ] `UserTabNavigator` with cart count badge
- [ ] `HomeScreen` — carousel + categories + product grid
- [ ] `productApi.ts` + `productSlice.ts` + `useProducts.ts`
- [ ] `ProductListScreen` — search + filter + paginated grid
- [ ] `ProductDetailScreen` — images + reviews + add to cart
- [ ] `cartApi.ts` + `cartSlice.ts` + `useCart.ts`
- [ ] `CartScreen` — swipeable rows + totals
- [ ] `addressApi.ts` — all 5 address endpoints
- [ ] `CheckoutScreen` — address picker + payment flow
- [ ] `paymentApi.ts` — bank + card endpoints
- [ ] `orderApi.ts` — create + list + cancel
- [ ] `OrdersScreen` + `TrackOrderScreen`
- [ ] `ProfileScreen` + `EditProfileScreen`
- [ ] `AddressScreen` + `AddEditAddressScreen`
- [ ] `NotificationsScreen` + `notificationApi.ts`

### 👷 Phase 4 — Staff Panel
- [ ] `StaffDrawerNavigator`
- [ ] `StaffDashboardScreen` — stats + availability toggle
- [ ] `AssignedOrdersScreen` + `UpdateOrderStatusScreen`
- [ ] `AttendanceScreen` — check-in/check-out + history
- [ ] `EarningsScreen`
- [ ] All staff components

### 👑 Phase 5 — Admin Panel
- [ ] `AdminDrawerNavigator`
- [ ] `AdminDashboardScreen` — stats + charts
- [ ] `ProductManagementScreen` + `AddEditProductScreen`
- [ ] `AllOrdersScreen` + assign staff flow
- [ ] `StaffListScreen` + `AddStaffScreen`
- [ ] `UsersScreen` — block/unblock
- [ ] `SalesReportScreen` — charts

### ✨ Phase 6 — Polish & QA
- [ ] Skeleton loaders for all list/detail screens
- [ ] Pull-to-refresh on all FlatLists
- [ ] Optimistic UI on cart add/remove
- [ ] Error boundary + network error screen
- [ ] `npx tsc --noEmit` — zero errors
- [ ] Test on Android emulator + iOS simulator
- [ ] Test full flows: register → browse → cart → checkout → order tracking

---

## State Management Design

```
Redux Store (persisted auth to SecureStore)
│
├── authSlice
│   ├── user: { id, name, email, phone, role, profileImage }
│   ├── accessToken: string | null
│   ├── refreshToken: string | null
│   └── isLoggedIn: boolean
│
├── cartSlice
│   ├── items: CartItem[]          ← synced with backend
│   ├── totalAmount: number
│   └── itemCount: number          ← drives the tab badge
│
└── productSlice
    ├── list: Product[]
    ├── categories: string[]
    ├── selectedProduct: Product | null
    ├── filters: ProductFilters
    └── pagination: { page, total, hasMore }
```

**Notifications & Addresses** — fetched on demand with local `useState` (no Redux needed).

---

## Navigation Tree

```
AppNavigator
│
├── [!isLoggedIn] AuthNavigator (Stack)
│   └── Splash → Login → Register → OTP
│
├── [role = USER] UserTabNavigator (Bottom Tabs)
│   ├── Tab Home
│   │   └── Stack: Home → Category → ProductDetail
│   ├── Tab Search
│   │   └── Stack: ProductList → ProductDetail
│   ├── Tab Cart [badge: itemCount]
│   │   └── Stack: Cart → Checkout
│   ├── Tab Orders
│   │   └── Stack: Orders → TrackOrder
│   └── Tab Profile
│       └── Stack: Profile → EditProfile → AddressList → AddEditAddress
│                        → ChangePassword → Notifications
│
├── [role = STAFF] StaffDrawerNavigator (Drawer)
│   ├── Dashboard
│   ├── My Orders → Stack: AssignedOrders → UpdateStatus
│   ├── Attendance
│   └── Earnings
│
└── [role = ADMIN] AdminDrawerNavigator (Drawer)
    ├── Dashboard
    ├── Products → Stack: ProductManagement → AddEditProduct
    ├── Orders → AllOrders
    ├── Staff → Stack: StaffList → AddStaff
    ├── Users
    └── Reports
```

---

## Push Notification Flow

```
App Boot
  └── pushNotificationService.registerForPushNotifications()
        ├── expo-device.isDevice check (won't work on simulator)
        ├── Notifications.requestPermissionsAsync()
        ├── Notifications.getExpoPushTokenAsync({ projectId })
        └── POST /api/v1/users/push-token { token }

Backend (when order status changes)
  └── notificationService.create() + send Expo Push via API (free tier)
        └── https://exp.host/--/api/v2/push/send

App Foreground
  └── Notifications.addNotificationReceivedListener()
        └── Show in-app Toast + refresh notification list

App Background/Killed
  └── OS handles push display automatically
```

---

## Free Tools Summary

| Tool | Free Tier |
|---|---|
| Expo EAS Build | Free tier (30 builds/month) |
| Expo Push Notifications | 100% free, no limits |
| NeonDB (your backend DB) | Free tier |
| Gifted Charts | MIT open source |
| React Native Toast Message | MIT open source |
| All npm packages listed | MIT / open source |
