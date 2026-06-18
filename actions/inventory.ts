"use server";

import { db } from "@/lib/db";
import { InventoryItem, InventoryTransaction } from "@/types";

export async function getInventoryList(): Promise<InventoryItem[]> {
  try {
    return await db.getInventory();
  } catch (error) {
    console.error("Failed to get inventory", error);
    return [];
  }
}

export async function createInventoryItem(data: Omit<InventoryItem, "id" | "updated_at">): Promise<InventoryItem> {
  return db.createInventoryItem(data);
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
  return db.updateInventoryItem(id, data);
}

export async function recordStockAdjustment(
  id: string, 
  quantity: number, 
  type: "IN" | "OUT" | "ADJUSTMENT", 
  notes?: string
): Promise<InventoryItem> {
  // If it's an OUT transaction, delta quantity should be negative
  const delta = type === "OUT" ? -quantity : quantity;
  return db.adjustStock(id, delta, type, notes);
}

export async function getStockTransactions(): Promise<InventoryTransaction[]> {
  try {
    const list = await db.getInventoryTransactions();
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error("Failed to fetch inventory transactions", error);
    return [];
  }
}
