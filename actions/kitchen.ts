"use server";

import { db } from "@/lib/db";
import { Order, ChefAssignment, KitchenStation } from "@/types";

export async function getKitchenQueue(): Promise<Order[]> {
  try {
    const list = await db.getOrders();
    // Kitchen queue shows orders that are Pending, Accepted, Preparing, or Ready (not yet Packed/Delivered)
    return list.filter(o => ["Pending", "Accepted", "Preparing", "Ready"].includes(o.status));
  } catch (error) {
    console.error("Failed to get kitchen queue", error);
    return [];
  }
}

export async function getStations(): Promise<KitchenStation[]> {
  try {
    return await db.getKitchenStations();
  } catch (error) {
    console.error("Failed to get stations", error);
    return [];
  }
}

export async function getChefAssignmentsList(): Promise<ChefAssignment[]> {
  try {
    return await db.getChefAssignments();
  } catch (error) {
    console.error("Failed to get chef assignments", error);
    return [];
  }
}

export async function assignChefToOrder(orderId: string, chefId: string): Promise<ChefAssignment> {
  return db.assignChef(orderId, chefId);
}
