import { z } from "zod";
import { ORDER_STATUS, ORDER_PRIORITY, USER_ROLES, PAYMENT_METHOD, PAYMENT_STATUS } from "../constants";

// --- Authentication Schemas ---
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// --- Staff Schemas ---
export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.nativeEnum(USER_ROLES, { errorMap: () => ({ message: "Please select a valid role" }) }),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  email: z.string().email("Please enter a valid email address"),
  salary: z.coerce.number().min(0, "Salary must be greater than or equal to 0"),
  joining_date: z.string().min(1, "Please select a joining date"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

// --- Menu Item Schemas ---
export const menuItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  description: z.string().optional(),
  is_vegetarian: z.boolean().default(true),
  is_available: z.boolean().default(true),
  preparation_time: z.coerce.number().min(1, "Prep time must be at least 1 minute"),
  ingredients: z.array(z.object({
    ingredient_id: z.string().min(1, "Please select an ingredient"),
    quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0")
  })).min(1, "Menu item must have at least one ingredient")
});

// --- Inventory Schemas ---
export const inventorySchema = z.object({
  name: z.string().min(2, "Ingredient name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  quantity: z.coerce.number().min(0, "Quantity must be greater than or equal to 0"),
  unit: z.string().min(1, "Please enter a unit (e.g. kg, L, pcs)"),
  min_level: z.coerce.number().min(0, "Minimum level must be greater than or equal to 0"),
  price_per_unit: z.coerce.number().min(0, "Price per unit must be greater than or equal to 0"),
  supplier_id: z.string().min(1, "Please select a supplier"),
  storage_location: z.string().optional(),
});

// --- Supplier Schemas ---
export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  contact_person: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  payment_terms: z.string().optional(),
  lead_time: z.coerce.number().min(0, "Lead time must be greater than or equal to 0").optional(),
});

// --- Order Schemas ---
export const orderItemSchema = z.object({
  menu_item_id: z.string().min(1, "Please select a menu item"),
  menu_item_name: z.string(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0),
  special_instructions: z.string().optional(),
});

export const orderSchema = z.object({
  customer_name: z.string().min(2, "Customer name must be at least 2 characters"),
  customer_phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  delivery_address: z.string().min(5, "Delivery address must be at least 5 characters"),
  priority: z.nativeEnum(ORDER_PRIORITY).default(ORDER_PRIORITY.NORMAL),
  payment_method: z.nativeEnum(PAYMENT_METHOD).default(PAYMENT_METHOD.UPI),
  payment_status: z.nativeEnum(PAYMENT_STATUS).default(PAYMENT_STATUS.PENDING),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
});

// --- Expense Schemas ---
export const expenseSchema = z.object({
  category: z.string().min(1, "Please select an expense category"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Please select an expense date"),
});
