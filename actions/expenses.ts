"use server";

import { db } from "@/lib/db";
import { Expense } from "@/types";
import { getStartDateForPeriod, getEndDateForPeriod, isWithinPeriod } from "@/lib/date-utils";

export async function getExpensesList(period: string = "All", customStart?: string, customEnd?: string): Promise<Expense[]> {
  try {
    const list = await db.getExpenses();
    if (period === "All") {
      return list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
    }
    const startDate = getStartDateForPeriod(period, customStart);
    const endDate = getEndDateForPeriod(period, customEnd);
    
    return list
      .filter(e => isWithinPeriod(e.expense_date, startDate, endDate))
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  } catch (error) {
    console.error("Failed to get expenses list", error);
    return [];
  }
}

export async function recordExpense(data: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  return db.createExpense(data);
}
