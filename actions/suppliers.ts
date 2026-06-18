"use server";

import { db } from "@/lib/db";
import { Supplier, PurchaseOrder, PurchaseOrderItem } from "@/types";

export async function getSuppliersList(): Promise<Supplier[]> {
  try {
    return await db.getSuppliers();
  } catch (error) {
    console.error("Failed to get suppliers list", error);
    return [];
  }
}

export async function createSupplier(data: Omit<Supplier, "id" | "created_at">): Promise<Supplier> {
  return db.createSupplier(data);
}

export async function getPurchaseOrdersList(): Promise<PurchaseOrder[]> {
  try {
    const list = await db.getPurchaseOrders();
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error("Failed to get purchase orders", error);
    return [];
  }
}

export async function getPurchaseOrderDetails(id: string): Promise<{ po: PurchaseOrder | null; items: PurchaseOrderItem[] }> {
  try {
    const list = await db.getPurchaseOrders();
    const po = list.find(p => p.id === id) || null;
    if (!po) return { po: null, items: [] };

    const items = await db.getPurchaseOrderItems(id);
    return { po, items };
  } catch (error) {
    console.error("Failed to get PO details", error);
    return { po: null, items: [] };
  }
}

export async function createPO(
  supplierId: string, 
  items: { ingredient_id: string; quantity: number; price_per_unit: number }[]
): Promise<PurchaseOrder> {
  return db.createPurchaseOrder(supplierId, items);
}

export async function receivePO(id: string): Promise<PurchaseOrder> {
  return db.receivePurchaseOrder(id);
}
