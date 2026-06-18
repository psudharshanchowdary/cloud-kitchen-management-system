"use server";

import { db } from "@/lib/db";
import { Expense } from "@/types";

export async function getExpensesList(): Promise<Expense[]> {
  try {
    const list = await db.getExpenses();
    return list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  } catch (error) {
    console.error("Failed to get expenses list", error);
    return [];
  }
}

export async function recordExpense(data: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  return db.createExpense(data);
}
