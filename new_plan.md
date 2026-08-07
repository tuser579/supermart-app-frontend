# Backend API Specification: Notifications & Products

This document contains the exact REST API endpoint specifications, HTTP Methods, Request Bodies, and Response Bodies for the **Notifications** and **Products** modules.

---

## 1. Notifications Module

### 1.1 `GET /notifications`
Fetch all notifications for the authenticated user.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "notif_65f1a9b82",
      "userId": "usr_98765",
      "title": "Order Shipped",
      "message": "Your order #ORD-20260805-001 has been shipped.",
      "type": "ORDER_STATUS",
      "isRead": false,
      "createdAt": "2026-08-05T18:00:00.000Z"
    },
    {
      "id": "notif_65f1a9b83",
      "userId": "usr_98765",
      "title": "Payment Confirmed",
      "message": "Mobile banking payment (bKash TRX987654) verified.",
      "type": "PAYMENT",
      "isRead": true,
      "createdAt": "2026-08-05T17:30:00.000Z"
    }
  ]
}
```

---

### 1.2 `PUT /notifications/read-all`
Mark all notifications as read for the authenticated user.
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "message": "All notifications marked as read"
  }
}
```

---

### 1.3 `PUT /notifications/:id/read`
Mark a single notification as read by notification ID.
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "message": "Notification marked as read"
  }
}
```

---

### 1.4 `DELETE /notifications/:id`
Delete a single notification from the database by ID.
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "message": "Notification deleted"
  }
}
```

---

### 1.5 `DELETE /notifications`
Bulk delete/clear all notifications for the authenticated user from the database.
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "All notifications cleared from database",
  "data": {
    "message": "Cleared"
  }
}
```

---

## 2. Products Module

### 2.1 `GET /products`
Fetch product list with optional filtering, search, pagination, and sorting.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>` (Optional)
- **Query Parameters**:
  - `search` (string): e.g. `"Apple"`
  - `category` (string): e.g. `"Fruits"`
  - `minPrice` (number): e.g. `50`
  - `maxPrice` (number): e.g. `500`
  - `sortBy` (string): `"createdAt"` | `"price"` | `"rating"`
  - `sortOrder` (string): `"asc"` | `"desc"`
  - `page` (number): e.g. `1`
  - `limit` (number): e.g. `20`
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "prod_991823",
      "name": "Fresh Organic Red Apples (1kg)",
      "description": "Crisp and sweet farm fresh red apples.",
      "price": 280,
      "discountPrice": 250,
      "category": "Fruits",
      "brand": "GreenValley Organic",
      "stock": 45,
      "images": [
        "https://example.com/images/apple_1.jpg",
        "https://example.com/images/apple_2.jpg"
      ],
      "rating": 4.9,
      "numReviews": 38,
      "isActive": true,
      "createdAt": "2026-08-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 2.2 `GET /products/:id`
Fetch detailed product information by Product ID.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>` (Optional)
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Product details fetched successfully",
  "data": {
    "id": "prod_991823",
    "name": "Fresh Organic Red Apples (1kg)",
    "description": "Crisp and sweet farm fresh red apples.",
    "price": 280,
    "discountPrice": 250,
    "category": "Fruits",
    "brand": "GreenValley Organic",
    "stock": 45,
    "images": [
      "https://example.com/images/apple_1.jpg"
    ],
    "rating": 4.9,
    "numReviews": 38,
    "isActive": true,
    "reviews": [
      {
        "id": "rev_771",
        "userName": "Akash Rahman",
        "rating": 5,
        "comment": "Very fresh and great packaging!",
        "createdAt": "2026-08-03T14:20:00.000Z"
      }
    ]
  }
}
```

---

### 2.3 `POST /admin/products`
Create a new product in the database (Admin Access Required).
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>` (Admin Role)
- **Request Body**:
```json
{
  "name": "Fresh Organic Farm Eggs (12 pcs)",
  "description": "100% organic brown eggs from free-range chickens.",
  "price": 160,
  "discountPrice": 150,
  "category": "Dairy & Eggs",
  "brand": "FarmFresh",
  "stock": 100,
  "images": [
    "https://example.com/images/eggs_1.jpg"
  ]
}
```
- **Response Body** (`201 Created`):
```json
{
  "success": true,
  "message": "Product created successfully in database",
  "data": {
    "id": "prod_991824",
    "name": "Fresh Organic Farm Eggs (12 pcs)",
    "description": "100% organic brown eggs from free-range chickens.",
    "price": 160,
    "discountPrice": 150,
    "category": "Dairy & Eggs",
    "brand": "FarmFresh",
    "stock": 100,
    "images": [
      "https://example.com/images/eggs_1.jpg"
    ],
    "rating": 0,
    "numReviews": 0,
    "isActive": true,
    "createdAt": "2026-08-05T21:00:00.000Z"
  }
}
```

---

### 2.4 `PUT /admin/products/:id`
Update an existing product by Product ID in the database (Admin Access Required).
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>` (Admin Role)
- **Request Body**:
```json
{
  "name": "Fresh Organic Farm Eggs (12 pcs - Jumbo Size)",
  "price": 170,
  "discountPrice": 155,
  "stock": 120
}
```
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Product updated successfully in database",
  "data": {
    "id": "prod_991824",
    "name": "Fresh Organic Farm Eggs (12 pcs - Jumbo Size)",
    "price": 170,
    "discountPrice": 155,
    "stock": 120,
    "updatedAt": "2026-08-05T21:30:00.000Z"
  }
}
```

---

### 2.5 `DELETE /admin/products/:id`
Delete a product permanently from the database table (Admin Access Required).
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>` (Admin Role)
- **Request Body**: `None`
- **Response Body** (`200 OK`):
```json
{
  "success": true,
  "message": "Product deleted successfully from database",
  "data": {
    "success": true,
    "message": "Product deleted"
  }
}
```