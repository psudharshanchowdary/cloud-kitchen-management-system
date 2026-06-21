"use server";

import { db } from "@/lib/db";
import { SupplierDelivery } from "@/types";
import { cookies } from "next/headers";
import { getStartDateForPeriod, getEndDateForPeriod, isWithinPeriod } from "@/lib/date-utils";

async function getLoggedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return await db.getUserById(token);
  } catch {
    return null;
  }
}

export async function getSupplierDeliveriesList(): Promise<SupplierDelivery[]> {
  try {
    return await db.getSupplierDeliveries();
  } catch (error) {
    console.error("Failed to get supplier deliveries", error);
    return [];
  }
}

export async function acceptSupplierDeliveryAction(
  deliveryId: string,
  actualProducts: Array<{ ingredient_id: string; ingredient_name: string; quantity_received: number; unit: string; batch_number?: string; expiry_date?: string; status: string }>
): Promise<SupplierDelivery> {
  const logged = await getLoggedUser();
  if (!logged) throw new Error("Unauthorized");

  const database_deliveries = await db.getSupplierDeliveries();
  const delivery = database_deliveries.find(d => d.id === deliveryId);
  if (!delivery) throw new Error("Supplier delivery not found");

  // Update product received quantities
  const updatedProducts = delivery.products.map(p => {
    const actual = actualProducts.find(ap => ap.ingredient_id === p.ingredient_id);
    if (actual) {
      return { ...p, quantity_received: actual.quantity_received, status: actual.status, batch_number: actual.batch_number || p.batch_number, expiry_date: actual.expiry_date || p.expiry_date };
    }
    return p;
  });

  // Update supplier delivery status
  const updated = await db.updateSupplierDelivery(deliveryId, {
    status: "Delivered",
    arrival_time: new Date().toISOString(),
    products: updatedProducts
  });

  // Adjust inventory stock levels for each received product
  const inventory = await db.getInventory();
  for (const product of updatedProducts) {
    if (product.quantity_received > 0 && product.status !== "Missing") {
      const invItem = inventory.find(i => i.id === product.ingredient_id || i.name.toLowerCase().includes(product.ingredient_name.toLowerCase()));
      if (invItem) {
        await db.adjustStock(invItem.id, product.quantity_received, "IN", `Supplier delivery from ${delivery.supplier_name}`, deliveryId);
      }
    }
  }

  // Log activity
  await db.createActivityLog({
    user_id: logged.id,
    user_name: logged.name,
    role: logged.role,
    action: "ACCEPT_SUPPLIER_DELIVERY",
    details: `Supplier delivery ${deliveryId} from ${delivery.supplier_name} accepted by ${logged.name}.`
  });

  return updated;
}

export async function rejectSupplierDeliveryAction(
  deliveryId: string,
  reason: string
): Promise<SupplierDelivery> {
  const logged = await getLoggedUser();
  if (!logged) throw new Error("Unauthorized");

  const updated = await db.updateSupplierDelivery(deliveryId, {
    status: "Rejected",
    arrival_time: new Date().toISOString(),
    delivery_notes: reason
  });

  await db.createActivityLog({
    user_id: logged.id,
    user_name: logged.name,
    role: logged.role,
    action: "REJECT_SUPPLIER_DELIVERY",
    details: `Supplier delivery ${deliveryId} rejected. Reason: ${reason}`
  });

  return updated;
}

export async function reportDeliveryIssueAction(
  deliveryId: string,
  notes: string
): Promise<SupplierDelivery> {
  const logged = await getLoggedUser();
  if (!logged) throw new Error("Unauthorized");

  const deliveries = await db.getSupplierDeliveries();
  const existing = deliveries.find(d => d.id === deliveryId);
  if (!existing) throw new Error("Delivery not found");

  const updated = await db.updateSupplierDelivery(deliveryId, {
    delivery_notes: `${existing.delivery_notes ? existing.delivery_notes + " | " : ""}Issue reported: ${notes}`
  });

  await db.createActivityLog({
    user_id: logged.id,
    user_name: logged.name,
    role: logged.role,
    action: "REPORT_DELIVERY_ISSUE",
    details: `Delivery ${deliveryId} issue reported: ${notes}`
  });

  return updated;
}

export async function getSupplierLogisticsDashboardData(period: string = "All", customStart?: string, customEnd?: string) {
  try {
    const [deliveries, suppliers, purchaseOrders] = await Promise.all([
      db.getSupplierDeliveries(),
      db.getSuppliers(),
      db.getPurchaseOrders()
    ]);

    let targetDeliveries = deliveries;
    if (period !== "All") {
      const startDate = getStartDateForPeriod(period, customStart);
      const endDate = getEndDateForPeriod(period, customEnd);
      targetDeliveries = deliveries.filter(d => isWithinPeriod(d.created_at, startDate, endDate));
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Today's deliveries (always absolute)
    const todayDeliveries = deliveries.filter(d => d.created_at.startsWith(todayStr));
    const totalToday = todayDeliveries.length;

    // This week's deliveries (always absolute)
    const weekDeliveries = deliveries.filter(d => d.created_at >= weekStartStr);
    const totalThisWeek = weekDeliveries.length;

    // Delayed deliveries in selected target
    const delayedDeliveries = targetDeliveries.filter(d => d.status === "Delayed");
    const delayedCount = delayedDeliveries.length;

    // Success rate in selected target
    const completedCount = targetDeliveries.filter(d => d.status === "Delivered").length;
    const successRate = targetDeliveries.length > 0
      ? Math.round((completedCount / targetDeliveries.length) * 100)
      : 100;

    // Most used supplier in selected target
    const supplierCounts: Record<string, { name: string; count: number; successCount: number }> = {};
    targetDeliveries.forEach(d => {
      if (!supplierCounts[d.supplier_id]) {
        supplierCounts[d.supplier_id] = { name: d.supplier_name, count: 0, successCount: 0 };
      }
      supplierCounts[d.supplier_id].count++;
      if (d.status === "Delivered") supplierCounts[d.supplier_id].successCount++;
    });

    const sortedSuppliers = Object.values(supplierCounts).sort((a, b) => b.count - a.count);
    const mostUsedSupplier = sortedSuppliers[0]?.name || "N/A";

    // Supplier performance ratings in selected target
    const supplierPerformance = sortedSuppliers.map(s => ({
      name: s.name,
      totalDeliveries: s.count,
      successRate: s.count > 0 ? Math.round((s.successCount / s.count) * 100) : 0,
      successCount: s.successCount
    }));

    const delayedSupplierNames = [...new Set(delayedDeliveries.map(d => d.supplier_name))];

    return {
      totalToday,
      totalThisWeek,
      delayedCount,
      successRate,
      mostUsedSupplier,
      supplierPerformance,
      delayedSupplierNames,
      recentDeliveries: targetDeliveries
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10),
      allDeliveries: targetDeliveries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      pendingPOs: purchaseOrders.filter(po => po.status === "Ordered" || po.status === "Pending")
    };
  } catch (error) {
    console.error("Failed to load supplier logistics dashboard data", error);
    return {
      totalToday: 0,
      totalThisWeek: 0,
      delayedCount: 0,
      successRate: 100,
      mostUsedSupplier: "N/A",
      supplierPerformance: [],
      delayedSupplierNames: [],
      recentDeliveries: [],
      allDeliveries: [],
      pendingPOs: []
    };
  }
}
