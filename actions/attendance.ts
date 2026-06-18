"use server";

import { db } from "@/lib/db";
import { Attendance } from "@/types";

export async function getAttendanceToday(): Promise<Attendance[]> {
  try {
    const list = await db.getAttendance();
    const todayStr = new Date().toISOString().split("T")[0];
    return list.filter(a => a.date === todayStr);
  } catch (error) {
    console.error("Failed to get attendance today", error);
    return [];
  }
}

export async function clockIn(staffId: string): Promise<Attendance> {
  return db.clockIn(staffId);
}

export async function clockOut(staffId: string): Promise<Attendance> {
  return db.clockOut(staffId);
}

export async function getAttendanceReport(dateRange?: { from: string; to: string }): Promise<Attendance[]> {
  try {
    const list = await db.getAttendance();
    if (!dateRange) return list;
    
    const fromTime = new Date(dateRange.from).getTime();
    const toTime = new Date(dateRange.to).getTime();

    return list.filter(a => {
      const t = new Date(a.date).getTime();
      return t >= fromTime && t <= toTime;
    });
  } catch (error) {
    console.error("Failed to get attendance report", error);
    return [];
  }
}
