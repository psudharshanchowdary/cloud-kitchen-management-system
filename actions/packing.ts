"use server";

import { db } from "@/lib/db";
import { Order } from "@/types";

export async function getPackingQueue(): Promise<Order[]> {
  try {
    const list = await db.getOrders();
    // Packing station shows orders that are Ready or Packed (not yet Out for Delivery or Cancelled)
    return list.filter(o => ["Ready", "Packed"].includes(o.status));
  } catch (error) {
    console.error("Failed to get packing queue", error);
    return [];
  }
}
