"use server";

import { db } from "@/lib/db";
import { Attendance } from "@/types";
import { getStartDateForPeriod, getEndDateForPeriod, isWithinPeriod } from "@/lib/date-utils";

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

export async function getAttendanceReport(
  period: string = "All",
  customStart?: string,
  customEnd?: string
): Promise<Attendance[]> {
  try {
    const list = await db.getAttendance();
    if (period === "All") return list;
    
    const startDate = getStartDateForPeriod(period, customStart);
    const endDate = getEndDateForPeriod(period, customEnd);

    return list.filter(a => isWithinPeriod(a.date, startDate, endDate));
  } catch (error) {
    console.error("Failed to get attendance report", error);
    return [];
  }
}
