"use server";

import { db } from "@/lib/db";
import { Staff } from "@/types";
import { cookies } from "next/headers";

async function getLoggedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return await db.getUserById(token);
  } catch (err) {
    return null;
  }
}

export async function getStaffList(): Promise<Staff[]> {
  try {
    return await db.getStaff();
  } catch (error) {
    console.error("Failed to get staff list", error);
    return [];
  }
}

export async function createStaffMember(data: Omit<Staff, "id">): Promise<Staff> {
  const logged = await getLoggedUser();
  if (data.role === "Owner" && logged?.role !== "Owner") {
    throw new Error("Unauthorized: Only owners can create Owner accounts");
  }
  return db.createStaff(data);
}

export async function updateStaffMember(id: string, data: Partial<Staff>): Promise<Staff> {
  const logged = await getLoggedUser();
  const staff = await db.getStaff();
  const target = staff.find(s => s.id === id);
  if (target?.role === "Owner" && logged?.role !== "Owner") {
    throw new Error("Unauthorized: Only owners can modify Owner accounts");
  }
  return db.updateStaff(id, data);
}
