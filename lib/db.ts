import fs from "fs";
import path from "path";
import { 
  User, Staff, Attendance, MenuItem, MenuItemIngredient, 
  InventoryItem, InventoryTransaction, Supplier, PurchaseOrder, 
  PurchaseOrderItem, Order, OrderItem, Expense, Revenue, 
  KitchenStation, ChefAssignment, Notification, ActivityLog,
  DeliveryDriver, Delivery, SupplierDelivery
} from "@/types";
import { OrderStatus, OrderPriority, ItemStatus, PaymentStatus } from "./constants";
import seedDbData from "../database/db.json";

// Resolved path for local database file - Fallback to /tmp if in Vercel environment
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER || typeof process.env.AWS_LAMBDA !== "undefined";
const originalDbPath = path.join(process.cwd(), "database", "db.json");
const dbPath = isVercel ? path.join("/tmp", "db.json") : originalDbPath;

// Helper to read the database
function readDb(): any {
  try {
    if (isVercel && !fs.existsSync(dbPath)) {
      // Copy template seed data to /tmp on serverless spin-up
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(seedDbData, null, 2), "utf8");
    }

    if (!fs.existsSync(dbPath)) {
      // Create parent directories if they don't exist
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Write template seed data
      fs.writeFileSync(dbPath, JSON.stringify(seedDbData, null, 2), "utf8");
      return JSON.parse(JSON.stringify(seedDbData));
    }
    const data = fs.readFileSync(dbPath, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.delivery_drivers) parsed.delivery_drivers = [];
    if (!parsed.deliveries) parsed.deliveries = [];
    if (!parsed.supplier_deliveries) parsed.supplier_deliveries = [];
    return parsed;
  } catch (error) {
    console.error("Error reading db.json, returning seed data fallback", error);
    return JSON.parse(JSON.stringify(seedDbData));
  }
}

// Helper to write the database
function writeDb(data: any) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to db.json", error);
  }
}

// Database Operations Layer
export const db = {
  // --- Users ---
  getUsers: async (): Promise<User[]> => {
    const data = readDb();
    return data.users || [];
  },
  getUserById: async (id: string): Promise<User | null> => {
    const users = await db.getUsers();
    return users.find(u => u.id === id) || null;
  },
  getUserByEmail: async (email: string): Promise<User | null> => {
    const users = await db.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  updateUserPreferences: async (userId: string, preferences: any): Promise<User> => {
    const database = readDb();
    const index = database.users.findIndex((u: any) => u.id === userId);
    if (index === -1) throw new Error("User not found");
    const updatedUser = {
      ...database.users[index],
      preferences
    };
    database.users[index] = updatedUser;
    writeDb(database);
    return updatedUser;
  },

  // --- Staff ---
  getStaff: async (): Promise<Staff[]> => {
    const data = readDb();
    return data.staff || [];
  },
  createStaff: async (staffData: Omit<Staff, "id">): Promise<Staff> => {
    const database = readDb();
    const newStaff: Staff = {
      ...staffData,
      id: `staff-${Date.now()}`
    };
    // Also create corresponding user profile if not exists
    const userExists = database.users.some((u: any) => u.email === staffData.email);
    if (!userExists) {
      const newUser: User = {
        id: staffData.user_id || `user-${Date.now()}`,
        email: staffData.email,
        name: staffData.name,
        role: staffData.role,
        phone: staffData.phone,
        is_active: true,
        created_at: new Date().toISOString()
      };
      database.users.push(newUser);
      newStaff.user_id = newUser.id;
    }
    database.staff.push(newStaff);
    writeDb(database);
    return newStaff;
  },
  updateStaff: async (id: string, staffData: Partial<Staff>): Promise<Staff> => {
    const database = readDb();
    const index = database.staff.findIndex((s: any) => s.id === id);
    if (index === -1) throw new Error("Staff member not found");
    const updated = { ...database.staff[index], ...staffData };
    database.staff[index] = updated;

    // Update corresponding user profile role/name/phone
    const userIndex = database.users.findIndex((u: any) => u.id === updated.user_id);
    if (userIndex !== -1) {
      database.users[userIndex] = {
        ...database.users[userIndex],
        role: updated.role,
        name: updated.name,
        phone: updated.phone
      };
    }
    writeDb(database);
    return updated;
  },

  // --- Attendance ---
  getAttendance: async (): Promise<Attendance[]> => {
    const data = readDb();
    return data.attendance || [];
  },
  clockIn: async (staffId: string): Promise<Attendance> => {
    const database = readDb();
    const staff = database.staff.find((s: any) => s.id === staffId);
    if (!staff) throw new Error("Staff member not found");

    const todayStr = new Date().toISOString().split("T")[0];
    
    // Check if already clocked in today
    const existing = database.attendance.find((a: any) => a.staff_id === staffId && a.date === todayStr);
    if (existing) return existing;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    // Late threshold (e.g. after 09:30 AM)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    
    const newRecord: Attendance = {
      id: `att-${Date.now()}`,
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.role,
      date: todayStr,
      clock_in: timeStr,
      status: isLate ? "Late" : "Present"
    };

    database.attendance.push(newRecord);
    writeDb(database);
    
    // Log Activity
    await db.createActivityLog({
      user_id: staff.user_id,
      user_name: staff.name,
      role: staff.role,
      action: "CLOCK_IN",
      details: `${staff.name} clocked in at ${timeStr}.`
    });

    return newRecord;
  },
  clockOut: async (staffId: string): Promise<Attendance> => {
    const database = readDb();
    const staff = database.staff.find((s: any) => s.id === staffId);
    if (!staff) throw new Error("Staff member not found");

    const todayStr = new Date().toISOString().split("T")[0];
    const index = database.attendance.findIndex((a: any) => a.staff_id === staffId && a.date === todayStr);
    if (index === -1) throw new Error("No clock-in record found for today");

    const record = database.attendance[index];
    if (record.clock_out) return record; // Already clocked out

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Parse clock_in to calculate working hours
    const clockInTime = record.clock_in; // e.g. "09:15 AM"
    const [time, modifier] = clockInTime.split(" ");
    let [inHours, inMinutes] = time.split(":").map(Number);
    if (modifier === "PM" && inHours < 12) inHours += 12;
    if (modifier === "AM" && inHours === 12) inHours = 0;

    const clockInDate = new Date();
    clockInDate.setHours(inHours, inMinutes, 0, 0);
    
    const hoursWorked = Math.max(0.1, Number(((now.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)).toFixed(2)));

    const updated: Attendance = {
      ...record,
      clock_out: timeStr,
      working_hours: hoursWorked
    };

    database.attendance[index] = updated;
    writeDb(database);

    // Log Activity
    await db.createActivityLog({
      user_id: staff.user_id,
      user_name: staff.name,
      role: staff.role,
      action: "CLOCK_OUT",
      details: `${staff.name} clocked out at ${timeStr}. Worked for ${hoursWorked} hours.`
    });

    return updated;
  },

  // --- Menu Items ---
  getMenuItems: async (): Promise<MenuItem[]> => {
    const data = readDb();
    const items = data.menu_items || [];
    return items.map((item: any) => ({
      ...item,
      status: item.status || "Active"
    }));
  },
  getMenuItemIngredients: async (): Promise<MenuItemIngredient[]> => {
    const data = readDb();
    return data.menu_item_ingredients || [];
  },
  createMenuItem: async (itemData: Omit<MenuItem, "id" | "created_at">, ingredients: { ingredient_id: string; quantity: number }[]): Promise<MenuItem> => {
    const database = readDb();
    const newItem: MenuItem = {
      ...itemData,
      id: `menu-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    database.menu_items.push(newItem);

    // Add ingredients mapping
    ingredients.forEach(ing => {
      database.menu_item_ingredients.push({
        id: `m-ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menu_item_id: newItem.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity
      });
    });

    writeDb(database);
    return newItem;
  },
  updateMenuItem: async (id: string, itemData: Partial<MenuItem>, ingredients?: { ingredient_id: string; quantity: number }[]): Promise<MenuItem> => {
    const database = readDb();
    const index = database.menu_items.findIndex((m: any) => m.id === id);
    if (index === -1) throw new Error("Menu item not found");

    const updated = { ...database.menu_items[index], ...itemData };
    database.menu_items[index] = updated;

    if (ingredients) {
      // Clear old ingredients mapping
      database.menu_item_ingredients = database.menu_item_ingredients.filter((mi: any) => mi.menu_item_id !== id);
      // Add new ingredients mapping
      ingredients.forEach(ing => {
        database.menu_item_ingredients.push({
          id: `m-ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          menu_item_id: id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity
        });
      });
    }

    writeDb(database);
    return updated;
  },
  deleteMenuItem: async (id: string): Promise<boolean> => {
    const database = readDb();
    database.menu_items = database.menu_items.filter((m: any) => m.id !== id);
    database.menu_item_ingredients = database.menu_item_ingredients.filter((mi: any) => mi.menu_item_id !== id);
    writeDb(database);
    return true;
  },

  // --- Inventory ---
  getInventory: async (): Promise<InventoryItem[]> => {
    const data = readDb();
    return data.inventory || [];
  },
  getInventoryItemById: async (id: string): Promise<InventoryItem | null> => {
    const inv = await db.getInventory();
    return inv.find(i => i.id === id) || null;
  },
  createInventoryItem: async (itemData: Omit<InventoryItem, "id" | "updated_at">): Promise<InventoryItem> => {
    const database = readDb();
    const newItem: InventoryItem = {
      opening_stock: itemData.opening_stock ?? itemData.quantity,
      ...itemData,
      id: `inv-${Date.now()}`,
      updated_at: new Date().toISOString()
    };
    database.inventory.push(newItem);
    writeDb(database);
    return newItem;
  },
  updateInventoryItem: async (id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> => {
    const database = readDb();
    const index = database.inventory.findIndex((i: any) => i.id === id);
    if (index === -1) throw new Error("Inventory item not found");

    const updated = { 
      ...database.inventory[index], 
      ...itemData,
      updated_at: new Date().toISOString()
    };
    database.inventory[index] = updated;
    writeDb(database);
    return updated;
  },
  adjustStock: async (id: string, deltaQty: number, type: "IN" | "OUT" | "ADJUSTMENT", notes?: string, refId?: string): Promise<InventoryItem> => {
    const database = readDb();
    const index = database.inventory.findIndex((i: any) => i.id === id);
    if (index === -1) throw new Error("Inventory item not found");

    const item = database.inventory[index];
    const newQty = Math.max(0, item.quantity + deltaQty);

    const updated = {
      ...item,
      quantity: newQty,
      updated_at: new Date().toISOString()
    };

    database.inventory[index] = updated;

    // Record Transaction log
    const transaction: InventoryTransaction = {
      id: `inv-tr-${Date.now()}`,
      ingredient_id: item.id,
      ingredient_name: item.name,
      type,
      quantity: Math.abs(deltaQty),
      reference_id: refId,
      notes: notes || `${type} transaction of ${Math.abs(deltaQty)} ${item.unit}`,
      created_at: new Date().toISOString()
    };
    database.inventory_transactions.push(transaction);

    // Trigger low stock warning notification
    if (newQty <= item.min_level) {
      const notif: Notification = {
        id: `not-${Date.now()}`,
        title: "Low Stock Warning",
        message: `${item.name} stock level is down to ${newQty} ${item.unit}. Minimum required is ${item.min_level} ${item.unit}.`,
        type: "WARNING",
        is_read: false,
        created_at: new Date().toISOString()
      };
      database.notifications.push(notif);
    }

    writeDb(database);
    return updated;
  },
  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    const data = readDb();
    return data.inventory_transactions || [];
  },

  // --- Suppliers & Purchases ---
  getSuppliers: async (): Promise<Supplier[]> => {
    const data = readDb();
    return data.suppliers || [];
  },
  createSupplier: async (supplierData: Omit<Supplier, "id" | "created_at">): Promise<Supplier> => {
    const database = readDb();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    database.suppliers.push(newSupplier);
    writeDb(database);
    return newSupplier;
  },
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const data = readDb();
    return data.purchase_orders || [];
  },
  getPurchaseOrderItems: async (poId: string): Promise<PurchaseOrderItem[]> => {
    const data = readDb();
    return (data.purchase_order_items || []).filter((item: any) => item.purchase_order_id === poId);
  },
  createPurchaseOrder: async (supplierId: string, items: { ingredient_id: string; quantity: number; price_per_unit: number }[]): Promise<PurchaseOrder> => {
    const database = readDb();
    const supplier = database.suppliers.find((s: any) => s.id === supplierId);
    if (!supplier) throw new Error("Supplier not found");

    let totalAmount = 0;
    const poId = `po-${Date.now()}`;
    const poItems: PurchaseOrderItem[] = [];

    items.forEach(item => {
      const invItem = database.inventory.find((i: any) => i.id === item.ingredient_id);
      if (!invItem) throw new Error(`Inventory item ${item.ingredient_id} not found`);
      
      const itemCost = item.quantity * item.price_per_unit;
      totalAmount += itemCost;

      poItems.push({
        id: `po-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        purchase_order_id: poId,
        ingredient_id: item.ingredient_id,
        ingredient_name: invItem.name,
        quantity: item.quantity,
        unit: invItem.unit,
        price_per_unit: item.price_per_unit
      });
    });

    const newPO: PurchaseOrder = {
      id: poId,
      supplier_id: supplierId,
      supplier_name: supplier.name,
      total_amount: totalAmount,
      status: "Ordered",
      order_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString()
    };

    database.purchase_orders.push(newPO);
    database.purchase_order_items.push(...poItems);

    writeDb(database);
    return newPO;
  },
  receivePurchaseOrder: async (poId: string): Promise<PurchaseOrder> => {
    const database = readDb();
    const index = database.purchase_orders.findIndex((po: any) => po.id === poId);
    if (index === -1) throw new Error("Purchase Order not found");

    const po = database.purchase_orders[index];
    if (po.status === "Received") return po;

    po.status = "Received";
    po.delivery_date = new Date().toISOString().split("T")[0];
    database.purchase_orders[index] = po;

    // Load PO items
    const poItems = database.purchase_order_items.filter((item: any) => item.purchase_order_id === poId);
    
    // Add items to stock
    for (const item of poItems) {
      const invIndex = database.inventory.findIndex((i: any) => i.id === item.ingredient_id);
      if (invIndex !== -1) {
        const invItem = database.inventory[invIndex];
        database.inventory[invIndex].quantity += item.quantity;
        database.inventory[invIndex].updated_at = new Date().toISOString();

        // Log transaction
        database.inventory_transactions.push({
          id: `inv-tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient_name,
          type: "IN",
          quantity: item.quantity,
          reference_id: poId,
          notes: `Stock entry from Purchase Order: ${poId}`,
          created_at: new Date().toISOString()
        });
      }
    }

    // Add an expense record for the PO
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      category: "Ingredients Stock",
      amount: po.total_amount,
      description: `Purchase Order receipt: ${po.id} from ${po.supplier_name}`,
      expense_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString()
    };
    database.expenses.push(newExpense);

    writeDb(database);
    return po;
  },

  // --- Expenses & Finance ---
  getExpenses: async (): Promise<Expense[]> => {
    const data = readDb();
    return data.expenses || [];
  },
  createExpense: async (expenseData: Omit<Expense, "id" | "created_at">): Promise<Expense> => {
    const database = readDb();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    database.expenses.push(newExpense);
    writeDb(database);
    return newExpense;
  },
  getRevenue: async (): Promise<Revenue[]> => {
    const data = readDb();
    return data.revenue || [];
  },

  // --- Orders & Order Lifecycle ---
  getOrders: async (): Promise<Order[]> => {
    const data = readDb();
    const orders = data.orders || [];
    const items = data.order_items || [];
    
    // Hydrate items
    return orders.map((o: any) => ({
      ...o,
      items: items.filter((i: any) => i.order_id === o.id)
    }));
  },
  getOrderById: async (id: string): Promise<Order | null> => {
    const orders = await db.getOrders();
    return orders.find(o => o.id === id) || null;
  },
  createOrder: async (orderData: Omit<Order, "id" | "order_number" | "created_at">, items: Omit<OrderItem, "id" | "order_id" | "status">[]): Promise<Order> => {
    const database = readDb();
    const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    
    // Count today's orders to generate sequential number
    const todayOrdersCount = database.orders.filter((o: any) => o.order_date.startsWith(new Date().toISOString().split("T")[0])).length;
    const orderNum = `QCK-${todayStr}-${String(todayOrdersCount + 1).padStart(3, "0")}`;
    
    const orderId = `order-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      order_number: orderNum,
      created_at: new Date().toISOString()
    };

    const orderItems: OrderItem[] = [];
    
    // Check recipes and deduct ingredients from stock
    for (const item of items) {
      orderItems.push({
        id: `o-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item_name,
        quantity: item.quantity,
        price: item.price,
        status: "Pending",
        special_instructions: item.special_instructions
      });

      // Deduct recipes from inventory
      const recipes = database.menu_item_ingredients.filter((ri: any) => ri.menu_item_id === item.menu_item_id);
      for (const recipe of recipes) {
        const invIndex = database.inventory.findIndex((inv: any) => inv.id === recipe.ingredient_id);
        if (invIndex !== -1) {
          const deduction = recipe.quantity * item.quantity;
          const invItem = database.inventory[invIndex];
          database.inventory[invIndex].quantity = Math.max(0, invItem.quantity - deduction);
          database.inventory[invIndex].updated_at = new Date().toISOString();

          // Log transaction
          database.inventory_transactions.push({
            id: `inv-tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            ingredient_id: invItem.id,
            ingredient_name: invItem.name,
            type: "OUT",
            quantity: deduction,
            reference_id: orderId,
            notes: `Recipe deduction for ${item.quantity} portions of ${item.menu_item_name}`,
            created_at: new Date().toISOString()
          });

          // Check if low stock warning needed
          if (database.inventory[invIndex].quantity <= invItem.min_level) {
            database.notifications.push({
              id: `not-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: "Low Stock Alert",
              message: `${invItem.name} stock level is low: ${database.inventory[invIndex].quantity} ${invItem.unit}.`,
              type: "WARNING",
              is_read: false,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    }

    database.orders.push(newOrder);
    database.order_items.push(...orderItems);

    // If order is paid, record revenue
    if (newOrder.payment_status === "Paid") {
      database.revenue.push({
        id: `rev-${Date.now()}`,
        order_id: orderId,
        amount: newOrder.total_amount,
        source: `${newOrder.payment_method} Order - ${newOrder.order_number}`,
        revenue_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString()
      });
    }

    // Trigger notification
    database.notifications.push({
      id: `not-${Date.now()}`,
      title: "New Order Received",
      message: `Order ${orderNum} (₹${newOrder.total_amount}) received for ${newOrder.customer_name}.`,
      type: "INFO",
      is_read: false,
      created_at: new Date().toISOString()
    });

    writeDb(database);
    newOrder.items = orderItems;
    return newOrder;
  },
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const database = readDb();
    const index = database.orders.findIndex((o: any) => o.id === id);
    if (index === -1) throw new Error("Order not found");

    const order = database.orders[index];
    
    // Status validation
    order.status = status;
    
    // Handle status side effects
    if (status === "Delivered") {
      // Complete active delivery if exists
      const delIndex = database.deliveries.findIndex((d: any) => d.order_id === id && d.delivery_status !== "Delivered");
      if (delIndex !== -1) {
        const del = database.deliveries[delIndex];
        const now = new Date();
        del.delivered_time = now.toISOString();
        del.delivery_status = "Delivered";
        
        // Calculate actual duration in minutes
        const pickup = new Date(del.pickup_time || del.delivery_start_time);
        const diffMins = Math.max(1, Math.round((now.getTime() - pickup.getTime()) / 60000));
        del.actual_delivery_time = String(diffMins);
        
        // Release driver
        const drvIndex = database.delivery_drivers.findIndex((d: any) => d.id === del.driver_id);
        if (drvIndex !== -1) {
          database.delivery_drivers[drvIndex].status = "Available";
        }
      }

      if (order.payment_status !== "Paid") {
        order.payment_status = "Paid";
        database.revenue.push({
          id: `rev-${Date.now()}`,
          order_id: id,
          amount: order.total_amount,
          source: `${order.payment_method} Delivery Order - ${order.order_number}`,
          revenue_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString()
        });
      }
    }

    if (status === "Cancelled") {
      // Mark delivery as Failed and release driver
      const delIndex = database.deliveries.findIndex((d: any) => d.order_id === id && d.delivery_status !== "Delivered");
      if (delIndex !== -1) {
        const del = database.deliveries[delIndex];
        del.delivery_status = "Failed";
        del.notes = (del.notes ? del.notes + ". " : "") + "Order Cancelled";
        
        // Release driver
        const drvIndex = database.delivery_drivers.findIndex((d: any) => d.id === del.driver_id);
        if (drvIndex !== -1) {
          database.delivery_drivers[drvIndex].status = "Available";
        }
      }
    }

    if (status === "Cancelled") {
      // Restore inventory ingredients if order is cancelled
      const items = database.order_items.filter((item: any) => item.order_id === id);
      for (const item of items) {
        const recipes = database.menu_item_ingredients.filter((ri: any) => ri.menu_item_id === item.menu_item_id);
        for (const recipe of recipes) {
          const invIndex = database.inventory.findIndex((inv: any) => inv.id === recipe.ingredient_id);
          if (invIndex !== -1) {
            const restoration = recipe.quantity * item.quantity;
            database.inventory[invIndex].quantity += restoration;
            database.inventory[invIndex].updated_at = new Date().toISOString();

            database.inventory_transactions.push({
              id: `inv-tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              ingredient_id: recipe.ingredient_id,
              ingredient_name: database.inventory[invIndex].name,
              type: "IN",
              quantity: restoration,
              reference_id: id,
              notes: `Stock restoration from cancelled order ${order.order_number}`,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    }

    database.orders[index] = order;
    writeDb(database);

    // Fetch refreshed order
    const allItems = database.order_items.filter((item: any) => item.order_id === id);
    return { ...order, items: allItems };
  },
  updateOrderPriority: async (id: string, priority: OrderPriority): Promise<Order> => {
    const database = readDb();
    const index = database.orders.findIndex((o: any) => o.id === id);
    if (index === -1) throw new Error("Order not found");

    database.orders[index].priority = priority;
    writeDb(database);

    const order = database.orders[index];
    const allItems = database.order_items.filter((item: any) => item.order_id === id);
    return { ...order, items: allItems };
  },
  updateOrderItemStatus: async (orderItemId: string, status: "Pending" | "Cooking" | "Ready"): Promise<OrderItem> => {
    const database = readDb();
    const index = database.order_items.findIndex((item: any) => item.id === orderItemId);
    if (index === -1) throw new Error("Order item not found");

    const item = database.order_items[index];
    item.status = status;
    database.order_items[index] = item;

    // Cascade to parent order status
    const orderId = item.order_id;
    const parentIndex = database.orders.findIndex((o: any) => o.id === orderId);
    if (parentIndex !== -1) {
      const parentOrder = database.orders[parentIndex];
      const sisterItems = database.order_items.filter((si: any) => si.order_id === orderId);
      
      let nextStatus = parentOrder.status;
      const allReady = sisterItems.every((si: any) => si.status === "Ready");
      const anyCookingOrReady = sisterItems.some((si: any) => si.status === "Cooking" || si.status === "Ready");

      if (allReady) {
        nextStatus = "Ready";
      } else if (anyCookingOrReady) {
        nextStatus = "Preparing";
      }

      if (nextStatus !== parentOrder.status) {
        database.orders[parentIndex].status = nextStatus;
        
        // Log notification if status changes
        database.notifications.push({
          id: `not-${Date.now()}`,
          title: `Order Status: ${nextStatus}`,
          message: `Order ${parentOrder.order_number} is now ${nextStatus}.`,
          type: "SUCCESS",
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    writeDb(database);
    return item;
  },

  // --- Kitchen Stations ---
  getKitchenStations: async (): Promise<KitchenStation[]> => {
    const data = readDb();
    return data.kitchen_stations || [];
  },

  // --- Chef Assignments ---
  getChefAssignments: async (): Promise<ChefAssignment[]> => {
    const data = readDb();
    return data.chef_assignments || [];
  },
  assignChef: async (orderId: string, chefId: string): Promise<ChefAssignment> => {
    const database = readDb();
    const order = database.orders.find((o: any) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const staff = database.staff.find((s: any) => s.id === chefId);
    if (!staff) throw new Error("Chef not found");

    // Remove existing assignment for this order if any
    database.chef_assignments = database.chef_assignments.filter((ca: any) => ca.order_id !== orderId);

    const assignment: ChefAssignment = {
      id: `assign-${Date.now()}`,
      order_id: orderId,
      order_number: order.order_number,
      chef_id: chefId,
      chef_name: staff.name,
      assigned_at: new Date().toISOString()
    };

    database.chef_assignments.push(assignment);

    // Automatically transition order to preparing if it was pending
    const orderIndex = database.orders.findIndex((o: any) => o.id === orderId);
    if (orderIndex !== -1 && database.orders[orderIndex].status === "Pending") {
      database.orders[orderIndex].status = "Accepted";
    }

    writeDb(database);
    return assignment;
  },

  // --- Notifications ---
  getNotifications: async (): Promise<Notification[]> => {
    const data = readDb();
    return data.notifications || [];
  },
  markNotificationRead: async (id: string): Promise<boolean> => {
    const database = readDb();
    const index = database.notifications.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      database.notifications[index].is_read = true;
      writeDb(database);
      return true;
    }
    return false;
  },

  // --- Activity Logs ---
  getActivityLogs: async (): Promise<ActivityLog[]> => {
    const data = readDb();
    return data.activity_logs || [];
  },
  createActivityLog: async (logData: Omit<ActivityLog, "id" | "created_at">): Promise<ActivityLog> => {
    const database = readDb();
    const newLog: ActivityLog = {
      ...logData,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    database.activity_logs.push(newLog);
    writeDb(database);
    return newLog;
  },

  // --- Delivery Drivers ---
  getDeliveryDrivers: async (): Promise<DeliveryDriver[]> => {
    const data = readDb();
    return data.delivery_drivers || [];
  },
  createDeliveryDriver: async (driverData: Omit<DeliveryDriver, "id">): Promise<DeliveryDriver> => {
    const database = readDb();
    const newDriver: DeliveryDriver = {
      ...driverData,
      id: `drv-${Date.now()}`
    };
    database.delivery_drivers.push(newDriver);
    writeDb(database);
    return newDriver;
  },
  updateDeliveryDriver: async (id: string, driverData: Partial<DeliveryDriver>): Promise<DeliveryDriver> => {
    const database = readDb();
    const index = database.delivery_drivers.findIndex((d: any) => d.id === id);
    if (index === -1) throw new Error("Driver not found");
    const updated = { ...database.delivery_drivers[index], ...driverData };
    database.delivery_drivers[index] = updated;
    writeDb(database);
    return updated;
  },

  // --- Deliveries ---
  getDeliveries: async (): Promise<Delivery[]> => {
    const data = readDb();
    return data.deliveries || [];
  },
  createDelivery: async (deliveryData: Omit<Delivery, "id">): Promise<Delivery> => {
    const database = readDb();
    const newDelivery: Delivery = {
      ...deliveryData,
      id: `del-${Date.now()}`
    };
    database.deliveries.push(newDelivery);
    writeDb(database);
    return newDelivery;
  },
  updateDelivery: async (id: string, deliveryData: Partial<Delivery>): Promise<Delivery> => {
    const database = readDb();
    const index = database.deliveries.findIndex((d: any) => d.id === id);
    if (index === -1) throw new Error("Delivery not found");
    const updated = { ...database.deliveries[index], ...deliveryData };
    database.deliveries[index] = updated;
    writeDb(database);
    return updated;
  },

  // --- Supplier Deliveries ---
  getSupplierDeliveries: async (): Promise<SupplierDelivery[]> => {
    const data = readDb();
    return data.supplier_deliveries || [];
  },
  createSupplierDelivery: async (deliveryData: Omit<SupplierDelivery, "id" | "created_at">): Promise<SupplierDelivery> => {
    const database = readDb();
    const newDelivery: SupplierDelivery = {
      ...deliveryData,
      id: `sdel-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    database.supplier_deliveries.push(newDelivery);
    writeDb(database);
    return newDelivery;
  },
  updateSupplierDelivery: async (id: string, deliveryData: Partial<SupplierDelivery>): Promise<SupplierDelivery> => {
    const database = readDb();
    const index = database.supplier_deliveries.findIndex((d: any) => d.id === id);
    if (index === -1) throw new Error("Supplier delivery not found");
    const updated = { ...database.supplier_deliveries[index], ...deliveryData };
    database.supplier_deliveries[index] = updated;
    writeDb(database);
    return updated;
  }
};
