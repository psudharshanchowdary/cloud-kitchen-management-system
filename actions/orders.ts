"use server";

import { db } from "@/lib/db";
import { Order, OrderItem } from "@/types";
import { OrderStatus, OrderPriority } from "@/lib/constants";

export async function getOrdersList(): Promise<Order[]> {
  try {
    const list = await db.getOrders();
    // Sort orders by date descending
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error("Failed to get orders list", error);
    return [];
  }
}

export async function createNewOrder(
  orderData: Omit<Order, "id" | "order_number" | "created_at">,
  items: Omit<OrderItem, "id" | "order_id" | "status">[]
): Promise<Order> {
  return db.createOrder(orderData, items);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return db.updateOrderStatus(id, status);
}

export async function updateOrderPriority(id: string, priority: OrderPriority): Promise<Order> {
  return db.updateOrderPriority(id, priority);
}

export async function updateOrderItemStatus(itemId: string, status: "Pending" | "Cooking" | "Ready"): Promise<OrderItem> {
  return db.updateOrderItemStatus(itemId, status);
}
