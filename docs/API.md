# 🔐 API & Security Documentation — Queen's Cloud Kitchen

All business logic transactions and writes in the platform are encapsulated inside secure **Next.js 15 Server Actions**. This document lists the core methods and access control policies.

---

## 1. Authentication Actions

### `loginAction(email)`
- **Role Requirement:** Public
- **Input:** `email` (string)
- **Output:** `{ success: boolean; user?: User; error?: string }`
- **Details:** Validates email against database user profiles, generates and signs a secure `auth_token` cookie.

### `logoutAction()`
- **Role Requirement:** Authenticated
- **Output:** `{ success: boolean }`
- **Details:** Logs out the active session and clears the cookie.

---

## 2. Order Actions

### `createNewOrder(orderData, items)`
- **Role Requirement:** Owner, Operations Manager
- **Input:** Zod-validated `orderSchema` details and line items.
- **Output:** Fully populated `Order` object with sequencially generated order number.
- **Side Effects:** Automatically deducts recipe ingredients from raw stock, triggers low stock alerts if quantities cross safety thresholds, and creates activity logs.

### `updateOrderStatus(id, status)`
- **Role Requirement:** Owner, Operations Manager, Head Chef, Chef
- **Input:** `order_id` (string), `status` (OrderStatus enum)
- **Details:** Performs state machine verification before applying transition. Reverts raw stock ingredients if order is cancelled.

---

## 3. Inventory Stock Actions

### `recordStockAdjustment(id, quantity, type, notes)`
- **Role Requirement:** Owner, Operations Manager, Inventory Manager
- **Input:** `ingredient_id` (string), `quantity` (number), `type` ('IN' | 'OUT' | 'ADJUSTMENT'), `notes` (string)
- **Output:** Refreshed `InventoryItem` with logs appended to transactions table.

---

## 4. AI Business Assistant Actions

### `queryAssistant(message)`
- **Role Requirement:** Owner, Operations Manager
- **Input:** User text prompt string.
- **Output:** Markdown-formatted business summary, procurement forecasts, or bottleneck diagnoses.
