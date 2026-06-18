export const APP_NAME = "Queen's Cloud Kitchen";

export const USER_ROLES = {
  OWNER: "Owner",
  OPS_MANAGER: "Operations Manager",
  HEAD_CHEF: "Head Chef",
  CHEF: "Chef",
  KITCHEN_ASSISTANT: "Kitchen Assistant",
  INVENTORY_MANAGER: "Inventory Manager",
  PACKING_STAFF: "Packing Staff",
  DELIVERY_DRIVER: "Delivery Driver"
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ORDER_STATUS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED
];

export const ORDER_PRIORITY = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High"
} as const;

export type OrderPriority = typeof ORDER_PRIORITY[keyof typeof ORDER_PRIORITY];

export const ITEM_STATUS = {
  PENDING: "Pending",
  COOKING: "Cooking",
  READY: "Ready"
} as const;

export type ItemStatus = typeof ITEM_STATUS[keyof typeof ITEM_STATUS];

export const PAYMENT_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded"
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHOD = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  NET_BANKING: "Net Banking"
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

export const MENU_CATEGORIES = [
  "Starters",
  "Main Course",
  "Rice & Biryani",
  "Breads",
  "Desserts",
  "Beverages",
  "Chinese",
  "Combos"
] as const;

export const INVENTORY_CATEGORIES = [
  "Vegetables",
  "Meat & Seafood",
  "Dairy",
  "Grains & Spices",
  "Oils & Condiments",
  "Packaging",
  "Beverage Supplies",
  "Cleaning Supplies"
] as const;

export const EXPENSE_CATEGORIES = [
  "Ingredients Stock",
  "Kitchen Equipment",
  "Staff Salary",
  "Rent & Utilities",
  "Marketing & Promotions",
  "Packaging Material",
  "Miscellaneous"
] as const;
