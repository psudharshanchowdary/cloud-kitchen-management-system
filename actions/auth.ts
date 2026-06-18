"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { User } from "@/types";

export async function loginAction(email: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid email address. Please check your credentials." };
    }

    if (!user.is_active) {
      return { success: false, error: "This account has been deactivated." };
    }

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax"
    });

    // Log user login in activity logs
    await db.createActivityLog({
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      action: "LOGIN",
      details: `${user.name} logged in successfully.`
    });

    return { success: true, user };
  } catch (error: any) {
    console.error("Login action error", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (token) {
      const user = await db.getUserById(token);
      if (user) {
        // Log logout activity
        await db.createActivityLog({
          user_id: user.id,
          user_name: user.name,
          role: user.role,
          action: "LOGOUT",
          details: `${user.name} logged out.`
        });
      }
    }

    cookieStore.delete("auth_token");
    return { success: true };
  } catch (error) {
    console.error("Logout action error", error);
    return { success: false };
  }
}
