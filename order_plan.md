# Frontend Integration Plan — Order Step Workflow & Cash on Payment System (`order_plan.md`)

This document provides a complete frontend integration specification with exact **Request Headers**, **Request Bodies**, and **Response Bodies** for implementing the **Order Step Progression** (`PENDING` -> `CANCELLED` / `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED` / `RETURN_REQUESTED` -> `RETURNED`) and the **Cash on Payment System** after order delivery across **User App**, **Staff Panel**, and **Admin Panel**.

---

## 1. Order Status Progression Flow

```
1. PENDING          -> Initial state after checkout completed
   └─> CANCELLED    -> Cancelled by User/Admin before staff assignment/shipping
2. CONFIRMED        -> Staff Assigned by Admin (POST /api/v1/orders/:id/assign)
3. PROCESSING       -> Warehouse processing & packaging
4. SHIPPED          -> Dispatched for transit
5. OUT_FOR_DELIVERY -> Handed to assigned delivery agent (Staff)
6. DELIVERED        -> Delivered to customer (Cash collection pending/completed)
7. COMPLETED        -> Order accepted & finalized by customer/admin (COD auto-completes)
   └─> RETURN_REQUESTED -> Customer submits return request after delivery/completion
       └─> RETURNED     -> Return approved & refund processed by Admin
```

### Payment & Verification Rules
- **Cash on Delivery (COD)**:
  - When payment is recorded for COD (`paymentMethod: "COD"` via `POST /api/v1/orders/:id/pay`), `paymentStatus` is set to `COMPLETED` and `status` automatically transitions to `COMPLETED`.
  - Notification sent to Admin and User.
- **Mobile Banking (bKash / Rocket / Nagad / Card / Bank Transfer)**:
  - User submits `transactionId` during payment or checkout.
  - Automatically dispatches high-priority notification to Admin with `transactionId` for review (`paymentStatus`: `PENDING`).
  - **Admin Verification (`POST /api/v1/orders/:id/verify-payment`)**:
    - **Valid (`isValid: true`)**: Sets `paymentStatus` = `COMPLETED`, `status` = `COMPLETED`, notifies User.
    - **Invalid (`isValid: false`)**: Sets `paymentStatus` = `FAILED`, `status` = `CANCELLED`, restores product inventory stock, notifies User with reason.

---

## 2. User App Frontend Integration

### 2.1 Place New Order (Checkout Screen)
- **Method & URL**: `POST /api/v1/orders`
- **Headers**:
```http
Authorization: Bearer <USER_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "deliveryAddress": {
    "fullName": "Jane Customer",
    "phone": "+8801800000002",
    "addressLine1": "House 45, Road 11, Block B",
    "addressLine2": "Apartment 4A",
    "city": "Dhaka",
    "area": "Dhanmondi",
    "postalCode": "1209"
  },
  "paymentMethod": "COD",
  "notes": "Call customer upon arrival"
}
```
- **Response Body (201 Created)**:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "userId": "user_uuid_301",
    "totalAmount": 560,
    "discount": 0,
    "deliveryCharge": 60,
    "status": "PENDING",
    "paymentMethod": "COD",
    "paymentStatus": "PENDING",
    "transactionId": null,
    "deliveryAddress": {
      "fullName": "Jane Customer",
      "phone": "+8801800000002",
      "addressLine1": "House 45, Road 11, Block B",
      "city": "Dhaka",
      "area": "Dhanmondi"
    },
    "notes": "Call customer upon arrival",
    "statusHistory": [
      {
        "status": "PENDING",
        "timestamp": "2026-08-02T14:50:00.000Z"
      }
    ],
    "items": [
      {
        "id": "item_uuid_1",
        "productId": "prod_uuid_1",
        "quantity": 2,
        "price": 250,
        "product": {
          "id": "prod_uuid_1",
          "name": "Fresh Organic Honey (500g)",
          "images": ["https://example.com/honey.jpg"]
        }
      }
    ],
    "user": {
      "id": "user_uuid_301",
      "name": "Jane Customer",
      "email": "jane@example.com"
    },
    "createdAt": "2026-08-02T14:50:00.000Z",
    "updatedAt": "2026-08-02T14:50:00.000Z"
  }
}
```

---

### 2.2 Get User Orders List
- **Method & URL**: `GET /api/v1/orders?page=1&limit=20&status=DELIVERED`
- **Headers**: `Authorization: Bearer <USER_JWT_TOKEN>`
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Orders retrieved",
  "data": [
    {
      "id": "ord_uuid_101",
      "orderId": "SM-L1K23-A99",
      "totalAmount": 560,
      "status": "DELIVERED",
      "paymentMethod": "COD",
      "paymentStatus": "PENDING",
      "createdAt": "2026-08-02T14:50:00.000Z",
      "items": [
        {
          "quantity": 2,
          "price": 250,
          "product": { "id": "prod_uuid_1", "name": "Fresh Organic Honey (500g)", "images": ["https://example.com/honey.jpg"] }
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 2.3 Post-Delivery Payment Submission (Cash on Delivery / Mobile Banking)
When an order status is `DELIVERED` and `paymentStatus` is `PENDING`, the customer can submit payment:
- **Method & URL**: `POST /api/v1/orders/:id/pay`
- **Headers**:
```http
Authorization: Bearer <USER_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "paymentMethod": "COD",
  "transactionId": "CASH-PAID-CUSTOMER-001"
}
```
*(Or mobile payment: `{ "paymentMethod": "BKASH", "transactionId": "BKASH-TRX-99008877" }`)*
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "DELIVERED",
    "paymentMethod": "COD",
    "paymentStatus": "COMPLETED",
    "transactionId": "CASH-PAID-CUSTOMER-001",
    "updatedAt": "2026-08-02T15:05:00.000Z"
  }
}
```

---

### 2.4 Accept Order (Finalize Completion)
- **Method & URL**: `POST /api/v1/orders/:id/accept`
- **Headers**: `Authorization: Bearer <USER_JWT_TOKEN>`
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "COMPLETED",
    "updatedAt": "2026-08-02T15:10:00.000Z"
  }
}
```

---

### 2.5 Submit Return Request
- **Method & URL**: `POST /api/v1/orders/:id/pay` or `POST /api/v1/orders/:id/return`
- **Headers**:
```http
Authorization: Bearer <USER_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "reason": "Damaged Item",
  "details": "Outer package crushed during transit.",
  "images": ["https://example.com/proof-damage-1.jpg"]
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Return request submitted successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "RETURN_REQUESTED",
    "returnReason": "Damaged Item",
    "returnDetails": "Outer package crushed during transit.",
    "returnImages": ["https://example.com/proof-damage-1.jpg"],
    "updatedAt": "2026-08-02T15:12:00.000Z"
  }
}
```

---

## 3. Staff Panel Frontend Integration (Delivery Agent)

### 3.1 Get Staff Dashboard Quick Options & Cash Metrics
- **Method & URL**: `GET /api/v1/staff/quick-options`
- **Headers**: `Authorization: Bearer <STAFF_JWT_TOKEN>`
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Staff quick options retrieved successfully",
  "data": {
    "profile": {
      "staffId": "STAFF-0001",
      "position": "DELIVERY_BOY",
      "shift": "MORNING",
      "rating": 4.85,
      "isAvailable": true,
      "totalDeliveries": 42,
      "earnings": 2100
    },
    "todayAttendance": {
      "attendanceId": "att_uuid_501",
      "status": "PRESENT",
      "checkIn": "2026-08-02T08:00:00.000Z",
      "checkOut": null,
      "canCheckIn": false,
      "canCheckOut": true
    },
    "workload": {
      "totalAssignedOrders": 6,
      "activeDeliveriesCount": 2,
      "completedDeliveriesTodayCount": 4
    },
    "cashSummary": {
      "pendingCashToCollect": 1120,
      "totalCashCollected": 8500,
      "cashCollectedToday": 2240
    },
    "recentAssignedOrders": [
      {
        "id": "ord_uuid_101",
        "orderId": "SM-L1K23-A99",
        "status": "OUT_FOR_DELIVERY",
        "totalAmount": 560,
        "paymentMethod": "COD",
        "paymentStatus": "PENDING",
        "deliveryAddress": {
          "fullName": "Jane Customer",
          "phone": "+8801800000002",
          "addressLine1": "House 45, Road 11",
          "city": "Dhaka",
          "area": "Dhanmondi"
        },
        "createdAt": "2026-08-02T14:50:00.000Z",
        "updatedAt": "2026-08-02T15:00:00.000Z"
      }
    ],
    "quickActions": [
      {
        "action": "MARK_ATTENDANCE_CHECKIN",
        "method": "POST",
        "endpoint": "/api/v1/staff/attendance",
        "description": "Mark check-in for today attendance"
      },
      {
        "action": "UPDATE_ORDER_STATUS",
        "method": "PUT",
        "endpoint": "/api/v1/orders/:id/status",
        "description": "Update assigned order status (CONFIRMED -> PROCESSING -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED)"
      },
      {
        "action": "COLLECT_CASH_PAYMENT",
        "method": "POST",
        "endpoint": "/api/v1/orders/:id/pay",
        "description": "Record cash payment collected after order delivery"
      }
    ]
  }
}
```

---

### 3.2 Update Assigned Order Status
- **Method & URL**: `PUT /api/v1/orders/:id/status`
- **Headers**:
```http
Authorization: Bearer <STAFF_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "status": "DELIVERED"
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "DELIVERED",
    "deliveredAt": "2026-08-02T15:02:00.000Z",
    "assignedStaffId": "staff_uuid_101",
    "paymentMethod": "COD",
    "paymentStatus": "PENDING",
    "updatedAt": "2026-08-02T15:02:00.000Z"
  }
}
```

---

### 3.3 Staff Record Cash Collected Upon Delivery
- **Method & URL**: `POST /api/v1/orders/:id/pay`
- **Headers**:
```http
Authorization: Bearer <STAFF_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "paymentMethod": "COD",
  "transactionId": "STAFF-CASH-REC-101"
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "DELIVERED",
    "paymentMethod": "COD",
    "paymentStatus": "COMPLETED",
    "transactionId": "STAFF-CASH-REC-101",
    "updatedAt": "2026-08-02T15:03:00.000Z"
  }
}
```

---

## 4. Admin Panel Frontend Integration

### 4.1 Admin Dashboard Statistics & Financial Analytics
- **Method & URL**: `GET /api/v1/admin/dashboard`
- **Headers**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved",
  "data": {
    "users": { "total": 150, "active": 142, "newToday": 5 },
    "orders": {
      "total": 450,
      "pending": 12,
      "delivered": 400,
      "completed": 10,
      "cancelled": 28,
      "revenue": 185000
    },
    "cashPayment": {
      "pendingCodAmount": 1450,
      "collectedCodAmount": 12800,
      "totalCodOrders": 25
    },
    "products": { "total": 85, "outOfStock": 3 },
    "staff": { "total": 10, "available": 7 }
  }
}
```

---

### 4.2 Admin Quick Options Widget & COD Payment Reports
- **Method & URL**: `GET /api/v1/admin/quick-options`
- **Headers**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Admin quick options retrieved successfully",
  "data": {
    "assignedOrdersOptions": {
      "totalAssignedOrders": 14,
      "unassignedPendingOrders": 2,
      "availableDeliveryStaff": 6
    },
    "orderCancelOptions": {
      "cancellableOrdersCount": 8,
      "totalCancelledCount": 5
    },
    "cashPaymentOptions": {
      "totalCodOrders": 25,
      "pendingCodOrders": 4,
      "pendingCodAmount": 1450,
      "collectedCodAmount": 12800
    },
    "quickActions": [
      { "action": "ASSIGN_STAFF", "method": "POST", "endpoint": "/api/v1/orders/:id/assign" },
      { "action": "CANCEL_ORDER", "method": "POST", "endpoint": "/api/v1/admin/orders/:id/cancel" },
      { "action": "RECORD_PAYMENT", "method": "POST", "endpoint": "/api/v1/orders/:id/pay" }
    ]
  }
}
```

---

### 4.3 Assign Delivery Staff to Order
- **Method & URL**: `POST /api/v1/orders/:id/assign`
- **Headers**:
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "staffId": "staff_uuid_101"
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Delivery assigned successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "assignedStaffId": "staff_uuid_101",
    "status": "CONFIRMED",
    "updatedAt": "2026-08-02T14:55:00.000Z"
  }
}
```

---

### 4.4 Admin Quick Cancel Order (Restores Stock)
- **Method & URL**: `POST /api/v1/admin/orders/:id/cancel`
- **Headers**:
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "reason": "Customer request / Out of stock item"
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "CANCELLED",
    "cancellationReason": "Customer request / Out of stock item",
    "paymentStatus": "FAILED",
    "updatedAt": "2026-08-02T15:00:00.000Z"
  }
}
```

---

### 4.5 Admin Mobile Banking Transaction Verification
- **Method & URL**: `POST /api/v1/orders/:id/verify-payment`
- **Headers**:
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```
- **Request Body (Approve / Valid TxnID)**:
```json
{
  "isValid": true
}
```
- **Request Body (Reject / Invalid TxnID)**:
```json
{
  "isValid": false,
  "reason": "Transaction ID not found in bank records"
}
```
- **Response Body (200 OK)**:
```json
{
  "success": true,
  "message": "Payment verification processed successfully",
  "data": {
    "id": "ord_uuid_101",
    "orderId": "SM-L1K23-A99",
    "status": "COMPLETED",
    "paymentStatus": "COMPLETED",
    "updatedAt": "2026-08-02T15:05:00.000Z"
  }
}
```

---

## 5. Frontend TypeScript API Client Helper (`orderApiClient.ts`)

```typescript
import axios from 'axios';

const BASE_URL = 'https://your-supermart-api.up.railway.app/api/v1';

export const orderApiClient = {
  // Place Order (User)
  createOrder: async (token: string, payload: { deliveryAddress: any; paymentMethod: string; notes?: string }) => {
    const res = await axios.post(`${BASE_URL}/orders`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Update Order Status (Staff / Admin)
  updateOrderStatus: async (token: string, orderId: string, status: string) => {
    const res = await axios.put(`${BASE_URL}/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Record Cash / Online Payment (User / Staff / Admin)
  recordPayment: async (token: string, orderId: string, paymentMethod = 'COD', transactionId?: string) => {
    const res = await axios.post(`${BASE_URL}/orders/${orderId}/pay`, { paymentMethod, transactionId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Admin Mobile Banking Transaction Verification (Admin)
  verifyPayment: async (adminToken: string, orderId: string, isValid: boolean, reason?: string) => {
    const res = await axios.post(`${BASE_URL}/orders/${orderId}/verify-payment`, { isValid, reason }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.data;
  },

  // Staff Quick Options & Cash Metrics
  getStaffQuickOptions: async (staffToken: string) => {
    const res = await axios.get(`${BASE_URL}/staff/quick-options`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    return res.data;
  },

  // Admin Quick Options & Dashboard Stats
  getAdminQuickOptions: async (adminToken: string) => {
    const res = await axios.get(`${BASE_URL}/admin/quick-options`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.data;
  },

  getAdminDashboard: async (adminToken: string) => {
    const res = await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return res.data;
  }
};
```
