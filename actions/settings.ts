"use server";

import { db } from "@/lib/db";
import { ActivityLog, Notification } from "@/types";

export async function getActivityLogsList(): Promise<ActivityLog[]> {
  try {
    return await db.getActivityLogs();
  } catch (error) {
    console.error("Failed to fetch activity logs", error);
    return [];
  }
}

export async function getNotificationsList(): Promise<Notification[]> {
  try {
    return await db.getNotifications();
  } catch (error) {
    console.error("Failed to fetch notifications", error);
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    return await db.markNotificationRead(id);
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    return false;
  }
}
