"use server";

import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export async function getAnalyticsData() {
  try {
    const orders = await db.getOrders();
    const expenses = await db.getExpenses();
    const revenue = await db.getRevenue();
    const staff = await db.getStaff();
    const attendance = await db.getAttendance();

    // 1. Calculations
    const totalRev = revenue.reduce((sum, r) => sum + r.amount, 0);
    
    // Dynamic employee salaries (excluding Owner)
    const employeeSalaries = staff
      .filter(s => s.role !== "Owner" && s.status === "Active")
      .reduce((sum, s) => sum + s.salary, 0);

    // Operational costs (all non-salary expenses)
    const operationalCosts = expenses
      .filter(e => e.category !== "Staff Salary")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExp = operationalCosts + employeeSalaries;
    const profit = totalRev - totalExp;

    // Completed orders
    const completedOrders = orders.filter(o => o.status === "Delivered");
    const activeOrders = orders.filter(o => ["Pending", "Accepted", "Preparing", "Ready", "Packed", "Out For Delivery"].includes(o.status));

    // 2. Revenue Trends (7 Days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const revenueTrend = last7Days.map(date => {
      const dayRev = revenue
        .filter(r => r.revenue_date === date)
        .reduce((sum, r) => sum + r.amount, 0);
      const dayExp = expenses
        .filter(e => e.expense_date === date)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const dayName = new Date(date).toLocaleDateString("en-IN", { weekday: "short" });

      return {
        date: dayName,
        revenue: dayRev,
        expense: dayExp,
        profit: dayRev - dayExp
      };
    });

    // 3. Category distribution
    const categorySales: Record<string, number> = {};
    const itemVolume: Record<string, { name: string; quantity: number; total: number; category: string }> = {};

    orders.forEach(o => {
      if (o.status === "Cancelled") return;
      
      (o.items || []).forEach(item => {
        const qty = item.quantity;
        const subtotal = item.price * qty;

        // Count volume
        if (!itemVolume[item.menu_item_id]) {
          itemVolume[item.menu_item_id] = {
            name: item.menu_item_name,
            quantity: 0,
            total: 0,
            category: "Main Course" // fallback
          };
        }
        itemVolume[item.menu_item_id].quantity += qty;
        itemVolume[item.menu_item_id].total += subtotal;
      });
    });

    // Hydrate item category from menu catalog
    const menuItems = await db.getMenuItems();
    Object.keys(itemVolume).forEach(id => {
      const menu = menuItems.find(m => m.id === id);
      if (menu) {
        itemVolume[id].category = menu.category;
        categorySales[menu.category] = (categorySales[menu.category] || 0) + itemVolume[id].total;
      } else {
        categorySales["Miscellaneous"] = (categorySales["Miscellaneous"] || 0) + itemVolume[id].total;
      }
    });

    const categoryData = Object.keys(categorySales).map(cat => ({
      name: cat,
      value: categorySales[cat]
    }));

    // 4. Top Selling Items
    const topSellingItems = Object.values(itemVolume)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        sales: item.total,
        quantity: item.quantity
      }));

    // 5. Peak Hours Analysis (12 AM - 11 PM)
    const hourCounts = Array.from({ length: 24 }).fill(0) as number[];
    orders.forEach(o => {
      const date = new Date(o.order_date);
      const hour = date.getHours();
      if (hour >= 0 && hour < 24) {
        hourCounts[hour]++;
      }
    });

    const peakHours = hourCounts.map((count, hour) => {
      const label = hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      return { hour: label, orders: count };
    });

    // 6. Staff Attendance & Performance
    const attendanceStats = staff.map(s => {
      const totalDays = attendance.filter(a => a.staff_id === s.id).length;
      const presentDays = attendance.filter(a => a.staff_id === s.id && (a.status === "Present" || a.status === "Late")).length;
      const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
      
      return {
        name: s.name,
        role: s.role,
        attendanceRate: rate,
        status: s.status
      };
    });

    return {
      metrics: {
        totalRevenue: totalRev,
        totalExpenses: totalExp,
        profit,
        completedCount: completedOrders.length,
        activeCount: activeOrders.length,
        efficiencyScore: 94, // Mock calculated metrics
        inventoryHealth: 88, // Mock health score
      },
      revenueTrend,
      categoryData,
      topSellingItems,
      peakHours,
      attendanceStats
    };
  } catch (error) {
    console.error("Failed to generate analytics", error);
    return null;
  }
}
