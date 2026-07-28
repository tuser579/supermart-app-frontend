# Mobile Banking Payment & Order Lifecycle Plan (`payment_plan.md`)

This document outlines the architecture and implementation plan for the **Mobile Banking Payment System**, **Admin Transaction Verification**, and **Post-Delivery Order Accept / Return Workflow** across both the **Frontend (React Native / Expo / TypeScript)** and **Backend (`supermart-api` / Express / Prisma / TypeScript)**.

---

## 📋 Complete System Requirements & Workflows

### 1. User Order Placement at Checkout
1. Customer selects a Mobile Banking Provider at Checkout (**bKash**, **Rocket**, or **Nagad**).
2. Displays Send Money merchant number: **`01760049326`** with a **Copy Number** button and step-by-step instructions.
3. Customer completes "Send Money" on their mobile app and inputs their received **Transaction ID (TxnID)**.
4. Customer submits order.
5. Order is created with initial state:
   - `status`: **`PENDING`** (*Awaiting Admin Verification*)
   - `paymentStatus`: **`PENDING`**
   - `transactionId`: Attached to order
6. **Note**: Customers cannot cancel an order while it is in the `PENDING` state, as they have already transferred money. Only Admin can reject/cancel.

### 2. Admin Transaction ID Verification (Pending Orders)
1. Admin opens the Admin Panel (**All Orders Screen**).
2. Admin reviews incoming pending orders featuring the customer's Mobile Banking Provider (**bKash** / **Rocket** / **Nagad**) and submitted **Transaction ID** (e.g. `TRX9876543210`).
3. Admin checks the Transaction ID against their merchant SMS statement.
4. **Approve (Valid TxnID)**:
   - Admin clicks **Approve Txn & Confirm Order**.
   - Backend updates `status` -> **`CONFIRMED`** and `paymentStatus` -> **`COMPLETED`**.
   - Customer receives notification: *"Order Confirmed! Your mobile payment has been verified by Admin."*
5. **Reject / Cancel (Invalid / Non-Validated TxnID)**:
   - Admin clicks **Reject Txn & Cancel Order** (reason: *"Invalid Transaction ID submitted"*).
   - Backend updates `status` -> **`CANCELLED`** and `paymentStatus` -> **`FAILED`**, restoring item stock.
   - Customer receives notification: *"Order Cancelled! Transaction ID could not be verified."*

### 3. Post-Delivery Options: Accept Order vs. Return Order (Customer)
When an order reaches **`DELIVERED`** status, the customer has two options on **TrackOrderScreen**:
1. **Accept Order** (Green Action Button):
   - Customer confirms receipt and accepts the delivered order.
   - Order marked as Accepted and Completed.
2. **Return Order / Report Issue** (Red/Outline Action Button):
   - Customer opens Return Request modal, selects reason (e.g. *"Damaged Product"*, *"Wrong Item"*, *"Quality Issue"*), and enters details.
   - Backend updates order `status` -> **`RETURN_REQUESTED`** and saves `returnReason` and `returnDetails`.

### 4. Admin & Staff Panel: Return Orders Management
1. **Filter Tabs**: Both **Admin Panel** (`AllOrdersScreen.tsx`) and **Staff Panel** (`AssignedOrdersScreen.tsx`) include dedicated filter tabs for **Return Requested** (`RETURN_REQUESTED`) and **Returned** (`RETURNED`).
2. **Return Order Information Card**:
   - Displays prominent Return Request details: Reason, Customer Remarks, and Date.
3. **Approve / Reject Return Controls**:
   - **Approve Return**: Updates order `status` -> **`RETURNED`**, `paymentStatus` -> **`REFUNDED`**, and automatically restores inventory stock.
   - **Reject Return**: Transitions order status back to **`DELIVERED`** with explanation.

---

## ⚙️ Backend API Specifications (`supermart-api`)

### Endpoint 1: Admin Order Status Update & Txn Validation
- **URL**: `PUT /api/v1/orders/:id/status`
- **Auth Required**: Yes (`ADMIN` or `STAFF` role)
- **Approve Txn & Confirm**: Body `{ "status": "CONFIRMED" }` -> sets `paymentStatus: "COMPLETED"`.
- **Cancel Non-Validated Txn**: Body `{ "status": "CANCELLED", "cancellationReason": "Invalid Transaction ID submitted" }` -> sets `paymentStatus: "FAILED"` and restores stock.

### Endpoint 2: Customer Submit Return Request
- **URL**: `POST /api/v1/orders/:id/return`
- **Auth Required**: Yes (`Bearer <token>`)
- **Body**: `{ "reason": "Damaged Item", "details": "Package received broken" }`
- **Action**: Sets `status: "RETURN_REQUESTED"`, saves reason and details.

### Endpoint 3: Admin / Staff Process Return Request (With Refund)
- **URL**: `PUT /api/v1/orders/:id/status`
- **Body**: `{ "status": "RETURNED", "refundTransactionId": "TRX9876543210" }` -> sets `paymentStatus: "REFUNDED"`, saves `refundTransactionId`, restores stock, and sends a notification with the TxnID to the user.

### Endpoint 4: Delete Notification
- **URL**: `DELETE /api/v1/notifications/:id`
- **Auth Required**: Yes
- **Action**: Deletes a specific notification so Admin, Staff, and Users can clear their notification feeds.

---

## 🕒 Order Status Timeline Tracking
- The system automatically sends a notification to the customer for **every** status change (e.g., PENDING -> CONFIRMED, CONFIRMED -> PROCESSING).
- The `Order` model includes a `statusHistory` field (`JSON`) which records the exact timestamp of every status transition.
- **Frontend Display**: The `TrackOrderScreen.tsx` uses this data in `StatusTimeline.tsx` to display the exact date/time and relative interval (e.g., "2 hours ago") for each completed step.

---

## 📁 Modified Files Summary

### Frontend (`src/`)
1. **[TrackOrderScreen.tsx](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/src/modules/user/screens/TrackOrderScreen.tsx)**: Added **Accept Order** and **Return Order / Report Issue** actions for delivered orders. Uses `StatusTimeline` with `statusHistory`.
2. **[StatusTimeline.tsx](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/src/modules/user/components/StatusTimeline.tsx)**: Added exact timestamp and relative interval display for completed order statuses.
3. **[AllOrdersScreen.tsx](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/src/modules/admin/screens/AllOrdersScreen.tsx)**: Added Return Requested filter, Approve/Reject Return controls, and Refund TxnID input.
4. **[AssignedOrdersScreen.tsx](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/src/modules/staff/screens/AssignedOrdersScreen.tsx)**: Added Return Requested filter tab and return request details for staff.
5. **[NotificationsScreen.tsx](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/src/modules/user/screens/NotificationsScreen.tsx)**: Added a delete (trash) button for users to delete their notifications.
6. **[UpdateOrderStatusScreen.tsx](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/src/modules/staff/screens/UpdateOrderStatusScreen.tsx)**: Staff return order processing controls.

### Backend (`supermart-api/`)
1. **[schema.prisma](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/supermart-api/src/prisma/schema.prisma)**: Added `refundTransactionId` and `statusHistory` to `Order` model.
2. **[order.service.ts](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/supermart-api/src/modules/order/order.service.ts)**: Handles transition timestamps, refund TxnIDs, and sends notifications for status changes.
3. **[notification.service.ts](file:///c:/Users/Tushar%20PC/Downloads/project-bolt-sb1-wiv5gmet/project/supermart-api/src/modules/notification/notification.service.ts)**: Added notification delete functionality and endpoints.