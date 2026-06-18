import { UserRole, OrderStatus, OrderPriority, ItemStatus, PaymentStatus, PaymentMethod } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  user_id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  salary: number;
  joining_date: string;
  status: "Active" | "Inactive";
}

export interface Attendance {
  id: string;
  staff_id: string;
  staff_name: string;
  role: UserRole;
  date: string;
  clock_in: string;
  clock_out?: string;
  working_hours?: number;
  status: "Present" | "Late" | "Absent";
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  is_vegetarian: boolean;
  is_available: boolean;
  preparation_time: number; // in minutes
  image_url?: string;
  created_at: string;
}

export interface MenuItemIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity: number; // required per portion
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_level: number; // reorder trigger level
  price_per_unit: number;
  supplier_id: string;
  storage_location?: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reference_id?: string; // e.g. order_id or purchase_id
  notes?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  payment_terms?: string;
  lead_time?: number; // in days
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  status: "Pending" | "Ordered" | "Received" | "Cancelled";
  order_date: string;
  delivery_date?: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: OrderStatus;
  priority: OrderPriority;
  order_date: string;
  delivery_address: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  items?: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  price: number;
  status: ItemStatus;
  special_instructions?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  expense_date: string;
  created_at: string;
}

export interface Revenue {
  id: string;
  order_id?: string;
  amount: number;
  source: string;
  revenue_date: string;
  created_at: string;
}

export interface KitchenStation {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

export interface ChefAssignment {
  id: string;
  order_id: string;
  order_number: string;
  chef_id: string;
  chef_name: string;
  assigned_at: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  role: UserRole;
  action: string;
  details?: string;
  created_at: string;
}

export interface DeliveryDriver {
  id: string;
  employee_id: string;
  full_name: string;
  phone_number: string;
  vehicle_number: string;
  vehicle_type: string;
  status: "Available" | "On Delivery" | "Offline" | string;
}

export interface Delivery {
  id: string;
  order_id: string;
  driver_id: string;
  pickup_time: string;
  delivery_start_time: string;
  delivered_time?: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  delivery_status: "Assigned" | "Out For Delivery" | "Delivered" | "Failed" | string;
  notes?: string;
}

export interface SupplierDeliveryProduct {
  ingredient_id: string;
  ingredient_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit: string;
  batch_number?: string;
  expiry_date?: string;
  status: "Good" | "Damaged" | "Missing" | string;
}

export interface SupplierDelivery {
  id: string;
  purchase_order_id?: string;
  supplier_id: string;
  supplier_name: string;
  source_warehouse: string;
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  dispatch_time: string;
  arrival_time?: string;
  estimated_arrival_time?: string;
  status: "Pending" | "Dispatched" | "Delivered" | "Rejected" | "Delayed" | string;
  delivery_notes?: string;
  invoice_number?: string;
  invoice_amount?: number;
  products: SupplierDeliveryProduct[];
  created_at: string;
}
