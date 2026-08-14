# 🛒 SuperMart — Cross-Platform Grocery & Retail Application

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.36-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.12.0-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-Cloud_DB-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless_PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)](https://supermart-lac.vercel.app/)
[![Railway API](https://img.shields.io/badge/Railway-REST_API-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://supermart-api.up.railway.app/api/v1)

> **SuperMart** is a production-ready, full-stack cross-platform e-commerce application unifying **Customer Shopping**, **Executive Admin Store Management**, and **Field Staff Logistics** into a single, high-performance **React Native (Expo)** and **TypeScript** codebase.

---

## 🌐 Live Deployments & Endpoints

| Platform / Service | Environment | Live URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Production (Vercel) | [https://supermart-lac.vercel.app/](https://supermart-lac.vercel.app/) |
| **RESTful API Engine** | Production (Railway) | [https://supermart-api.up.railway.app/api/v1](https://supermart-api.up.railway.app/api/v1) |
| **Cloud Database** | Serverless Neon PostgreSQL | Managed via Prisma ORM Connection Pooling |
| **Mobile Bundles** | Android & iOS | Distributed via Expo EAS Application Services |

---

## 🎯 Key Portals & Core Features

```
                               ┌───────────────────────────┐
                               │   SUPERMART APPLICATION   │
                               │ (Expo / React Native / TS)│
                               └─────────────┬─────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
   │    CUSTOMER PORTAL    │     │  EXECUTIVE ADMIN SUITE│     │  STAFF LOGISTICS HUB  │
   ├───────────────────────┤     ├───────────────────────┤     ├───────────────────────┤
   │ • 8 Taxonomic Chips   │     │ • Real-time KPI Cards │     │ • Duty Status Toggle  │
   │ • Multi-filter Search │     │ • Product/Category    │     │ • Assigned Orders     │
   │ • Redux Cart & Promo  │     │   CRUD Management     │     │ • Shift Attendance    │
   │ • 4-Method MFS (COD,  │     │ • Order Status Update │     │ • Automated Delivery  │
   │   bKash, Nagad, Rocket│     │ • Daily Revenue &     │     │   Earnings Calculator │
   │ • 5-Stage Order Track │     │   Sales Analytics     │     └───────────────────────┘
   │ • Dynamic PDF Receipt │     └───────────────────────┘
   └───────────────────────┘
```

### 1. 🛍️ Customer Shopping & E-Commerce Funnel
* **Discovery Feed:** Hero promotional banners, 8-category taxonomic chips, 2-column FlatList product grid with instant search and multi-parameter filters (`category`, `minPrice`, `maxPrice`, `inStock`, `sortBy`).
* **Product Details & Wishlist:** High-res image gallery, stock availability badges, product specifications, unit pricing in BDT (৳), and one-tap bookmarking.
* **Redux Cart Engine:** Real-time quantity steppers, minimum order validation, single-pass tax/shipping calculations, and dynamic promotional coupon discounts (`SUPER10` for 10% off, `SUPER20` for 20% off).
* **Delivery Address Book:** Multi-address management with interactive location picker, contact notes, and default address selection.
* **4-Method Payment Gateway:**
  1. **Cash on Delivery (COD)**
  2. **bKash MFS** (Mobile banking verification)
  3. **Nagad MFS** (Digital wallet verification)
  4. **Rocket MFS** (DBBL mobile banking verification)
* **Lifecycle Order Tracking:** Visual 5-stage status progress timeline (`Placed` → `Confirmed` → `Processing` → `Shipped` → `Delivered`).
* **Dynamic PDF Receipts:** Instant client-side PDF invoice generation and download (`downloadReceiptPdf`) containing itemized breakdowns, transaction IDs, timestamps, and customer metadata.

### 2. 👔 Executive Administrative Suite (`/admin`)
* **Real-time KPI Dashboard:** Executive cards displaying total active customers, pending/completed orders, gross revenue (৳), and live inventory metrics.
* **Catalog Management (CRUD):** Add, update, archive, and delete products, categories, unit prices, discount rates, and stock units.
* **Global Order Management:** Full order ledger with live multi-status filters and status transition controls.
* **Sales Analytics & Reports:** Daily/weekly revenue aggregations and trend charts.

### 3. 🚚 Delivery Staff Logistics Hub (`/staff`)
* **Duty Availability Toggle:** Real-time shift status toggle (`Active On-Duty` / `Off-Duty`).
* **Assigned Orders Fulfillment:** Order pickup verification, customer address routing, delivery confirmation, and cash collection logging.
* **Digital Attendance & Timesheets:** Shift clock-in/out timestamps and attendance logging.
* **Earnings Breakdown:** Automated commission and per-delivery wage calculation summary.

---

## 🏗️ System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATION                                 │
│  React Native (0.81) | Expo (~54.0) | TypeScript | Expo Router | Redux Toolkit │
└───────────────────────────────┬─────────────────────────────────────────────────┘
                                │ Axios HTTP Client + Silent JWT Refresh Queue
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               CLOUD BACKEND API                                 │
│       Node.js / Express REST API (/api/v1) deployed on Railway Cloud            │
└───────────────────────────────┬─────────────────────────────────────────────────┘
                                │ Prisma ORM (Type-Safe Query Layer)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             SERVERLESS DATABASE                                 │
│                   Neon PostgreSQL Database with Connection Pooling               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 💻 Technologies Used

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React Native `0.81.5`, React `19.1.0`, Expo SDK `~54.0.36` |
| **Language & Typing** | TypeScript `5.9.2` (Strict type checking enabled) |
| **Navigation & Routing** | Expo Router `~6.0.24` (File-based typed routing) |
| **Global State Management** | Redux Toolkit `@reduxjs/toolkit` (`authSlice`, `cartSlice`, `productSlice`, `themeSlice`) |
| **Local Storage & Security** | `expo-secure-store` (Hardware-backed encrypted token persistence) |
| **Form Management & Validation** | `react-hook-form` with `zod` schema validation resolvers |
| **UI Components & Icons** | Vanilla CSS styling, `lucide-react-native`, `@expo/vector-icons`, `expo-linear-gradient` |
| **Document Generation** | `expo-print` & `expo-sharing` (Client-side dynamic PDF invoice compiler) |
| **Networking** | `axios` (with custom Bearer token injector and 401 subscriber queue interceptors) |
| **Backend & ORM** | Node.js REST API on Railway, Prisma ORM, Neon Serverless PostgreSQL |
| **Web & Native Hosting** | Vercel (Web Bundler), Expo EAS (Android APK / iOS IPA) |

---

## 📂 Project Directory Structure

```
supermart-app/
├── app/                           # Expo Router File-Based Navigation
│   ├── (auth)/                    # Authentication Route Group (Login, Register, Forgot)
│   ├── (tabs)/                    # Customer Tab Navigation (Home, Cart, Orders, Profile)
│   ├── admin/                     # Executive Admin Portal Routes
│   │   ├── dashboard.tsx          # Real-time KPI Analytics Cards
│   │   ├── orders.tsx             # All-Orders Management Table
│   │   ├── products.tsx           # Product CRUD Interface
│   │   └── sales-report.tsx       # Revenue Analytics & Sales Reports
│   ├── staff/                     # Field Staff Logistics Routes
│   │   └── dashboard.tsx          # Availability Toggle, Assigned Orders, Earnings
│   ├── order/                     # Order Sub-routes
│   │   └── [id].tsx               # Visual 5-stage Order Tracking Screen
│   ├── product/                   # Product Catalog Sub-routes
│   │   └── [id].tsx               # Detailed Product View & Add-to-Cart
│   ├── checkout.tsx               # 4-Method MFS Payment & Order Confirmation
│   ├── addresses.tsx              # Delivery Address Book & Location Selector
│   ├── wishlist.tsx               # Saved Items Screen
│   ├── notifications.tsx          # System & Order Push Notifications Screen
│   └── _layout.tsx                # Root App Layout with Redux & Theme Providers
├── src/
│   ├── modules/                   # Domain-Driven Feature Modules
│   │   ├── admin/                 # Admin Components, Services & Types
│   │   ├── auth/                  # Auth Guards, Login/Register Forms, Token Hydration
│   │   ├── common/                # Shared UI Components (Buttons, Inputs, Cards, Headers)
│   │   ├── staff/                 # Delivery Workforce Services & Views
│   │   └── user/                  # Customer Profile, Address Management & Cart Logic
│   └── shared/                    # Core Infrastructure & Cross-Cutting Utilities
│       ├── api/                   # Axios Client Instance & 401 Silent Refresh Queue
│       ├── hooks/                 # Custom Hooks (useResponsiveLayout, useAuth, useTheme)
│       ├── store/                 # Redux Toolkit Slices (auth, cart, product, theme)
│       ├── theme/                 # Design Tokens (Colors, Typography, Light/Dark Modes)
│       ├── types/                 # Shared TypeScript Interfaces & Data Models
│       └── utils/                 # PDF Receipt Compiler, Currency Formatter, Date Helpers
├── assets/                        # Static Assets (Logos, Icons, Splash Screens, Fonts)
├── .env                           # Environment Variables Configuration
├── app.json                       # Expo Application Configuration & EAS Project ID
├── eas.json                       # EAS Build & Distribution Profiles
├── package.json                   # Project Dependencies & Build Scripts
├── tsconfig.json                  # TypeScript Compiler Configuration
└── vercel.json                    # Vercel Single-Page Application (SPA) Web Routing
```

---

## ⚡ Getting Started (Local Development)

### 📋 Prerequisites
* **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
* **npm** or **yarn** package manager
* **Expo Go** mobile app (available on Google Play Store & Apple App Store) or an Android/iOS Emulator

### 🚀 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tuser579/supermart-app-frontend.git
   cd supermart-app-frontend
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or use existing defaults):
   ```env
   EXPO_PUBLIC_API_URL=https://supermart-api.up.railway.app/api/v1
   ```

4. **Start the Development Server:**
   ```bash
   npx expo start
   ```

5. **Run on Desired Target:**
   * **Web Browser:** Press `w` in the terminal or run `npm run dev -- --web`.
   * **Android Device / Emulator:** Press `a` in the terminal.
   * **iOS Simulator:** Press `i` in the terminal.
   * **Physical Device (Expo Go):** Scan the QR code displayed in the terminal using the **Expo Go** app.

---

## 📜 Available NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `expo start` | Starts the Expo Metro development server |
| `npm run build:web` | `expo export --platform web` | Compiles a production-ready static web bundle to `dist/` |
| `npm run typecheck` | `tsc --noEmit` | Runs strict TypeScript type verification across all files |
| `npm run lint` | `expo lint` | Performs code formatting and ESLint quality checks |

---

## 🛡️ Security, Authentication & State Resilience

* **Hardware-Backed JWT Storage:** Access and refresh tokens are encrypted and persisted inside hardware keystores via `expo-secure-store`.
* **Silent Token Refresh Queue:** Custom Axios interceptor (`src/shared/api/axiosConfig.ts`) captures `401 Unauthorized` responses and suspends failing requests in a subscriber queue (`refreshSubscribers[]`) while fetching a fresh access token seamlessly in the background.
* **Role-Based Access Control (RBAC):** Type-safe router guards redirect authenticated users dynamically to `/(tabs)` (Customers), `/admin/dashboard` (Admins), or `/staff/dashboard` (Delivery Personnel).
* **Responsive Layout Hook:** Custom `useResponsiveLayout` hook computes viewport dimensions in real-time, dynamically switching grid columns (2 cols on mobile, 3 on tablet, 4 on desktop) with zero visual glitches.

---

## 👥 Project Development Team

Presented in fulfillment of the course **CSE315: Software Engineering** at **Daffodil International University**:

| Student Name | Student ID | Department | Primary Technical Role |
| :--- | :---: | :---: | :--- |
| **MD. MUTTAKIUL ISLAM TUSER** | `241-15-579` | Dept. of CSE, DIU | **Team Lead & Full-Stack Architect** (Expo setup, Vercel web deployment, Axios JWT silent refresh, Redux store, Railway & Neon DB integration) |
| **Md. A. Barik Sarkar** | `241-15-121` | Dept. of CSE, DIU | **Full-Stack & DB Engineer** (Prisma ORM modeling, Neon PostgreSQL pooling, Product list search filters, Product detail screen) |
| **Md. Nurul Islam** | `241-15-167` | Dept. of CSE, DIU | **Backend & Staff Logistics Lead** (Staff dashboard, duty toggle, assigned orders, attendance logging, themeSlice) |
| **Md. Shakhaout Hossain** | `241-15-207` | Dept. of CSE, DIU | **Frontend & Admin Suite Engineer** (Admin KPI cards, order management table, product/category CRUD, revenue sales reports) |
| **Tahim Ibn Tazul** | `241-15-977` | Dept. of CSE, DIU | **Frontend & Payment/QA Engineer** (4-method MFS payment gateway, dynamic PDF receipt generator, end-to-end integration QA) |

* **Project Supervisor:** **Dr. Mohammad Nuruzzaman Bhuiyan**, Associate Professor, Department of Computer Science and Engineering, Daffodil International University.

---

## 📄 License & Acknowledgements

This project is licensed under the **MIT License** — feel free to explore, fork, and contribute.

Special thanks to:
* [Expo](https://expo.dev/) & [React Native](https://reactnative.dev/) teams for cross-platform toolchains.
* [Prisma](https://www.prisma.io/) & [Neon](https://neon.tech/) for cloud database infrastructure.
* [Vercel](https://vercel.com/) & [Railway](https://railway.app/) for seamless hosting and deployment.
* [Chaldal](https://chaldal.com/) & [Shopware](https://github.com/shopware/shopware) for design and architectural inspiration.
