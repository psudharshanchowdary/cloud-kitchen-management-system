"use server";

import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { getStartDateForPeriod, getEndDateForPeriod, isWithinPeriod, parseToLocalDate } from "@/lib/date-utils";

export async function getAnalyticsData(period: string = "Last 7 Days", customStart?: string, customEnd?: string) {
  try {
    const orders = await db.getOrders();
    const expenses = await db.getExpenses();
    const revenue = await db.getRevenue();
    const staff = await db.getStaff();
    const attendance = await db.getAttendance();
    const deliveries = await db.getDeliveries();
    const supplierDeliveries = await db.getSupplierDeliveries();
    const inventoryTransactions = await db.getInventoryTransactions();

    const startDate = getStartDateForPeriod(period, customStart);
    const endDate = getEndDateForPeriod(period, customEnd);

    // 1. Filtered Collections
    const filteredOrders = orders.filter(o => isWithinPeriod(o.order_date, startDate, endDate));
    const filteredExpenses = expenses.filter(e => isWithinPeriod(e.expense_date, startDate, endDate));
    const filteredRevenue = revenue.filter(r => isWithinPeriod(r.revenue_date, startDate, endDate));
    const filteredAttendance = attendance.filter(a => isWithinPeriod(a.date, startDate, endDate));
    const filteredDeliveries = deliveries.filter(d => d.delivered_time && isWithinPeriod(d.delivered_time, startDate, endDate));
    const filteredSupplierDeliveries = supplierDeliveries.filter(sd => sd.arrival_time && isWithinPeriod(sd.arrival_time, startDate, endDate));
    const filteredInventoryTransactions = inventoryTransactions.filter(t => isWithinPeriod(t.created_at, startDate, endDate));

    // 2. Calculations
    const totalRev = filteredRevenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = totalRev - totalExp;

    const completedOrders = filteredOrders.filter(o => o.status === "Delivered");
    const activeOrdersCount = orders.filter(o => ["Pending", "Accepted", "Preparing", "Ready", "Packed", "Out For Delivery"].includes(o.status)).length;

    // 3. Category distribution (from filtered orders)
    const categorySales: Record<string, number> = {};
    const itemVolume: Record<string, { name: string; quantity: number; total: number; category: string }> = {};

    filteredOrders.forEach(o => {
      if (o.status === "Cancelled") return;
      
      (o.items || []).forEach(item => {
        const qty = item.quantity;
        const subtotal = item.price * qty;

        if (!itemVolume[item.menu_item_id]) {
          itemVolume[item.menu_item_id] = {
            name: item.menu_item_name,
            quantity: 0,
            total: 0,
            category: "Main Course"
          };
        }
        itemVolume[item.menu_item_id].quantity += qty;
        itemVolume[item.menu_item_id].total += subtotal;
      });
    });

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

    // 4. Top Selling Items (from filtered orders)
    const topSellingItems = Object.values(itemVolume)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        sales: item.total,
        quantity: item.quantity
      }));

    // 5. Peak Hours Analysis (from filtered orders)
    const hourCounts = Array.from({ length: 24 }).fill(0) as number[];
    filteredOrders.forEach(o => {
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
      const staffAtt = filteredAttendance.filter(a => a.staff_id === s.id);
      const totalDays = staffAtt.length;
      const presentDays = staffAtt.filter(a => a.status === "Present" || a.status === "Late").length;
      const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
      
      return {
        name: s.name,
        role: s.role,
        attendanceRate: rate,
        status: s.status
      };
    });

    // 7. Dynamic Trend Data Points
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let interval: "hour" | "day" | "month" = "day";
    if (diffDays <= 1) {
      interval = "hour";
    } else if (diffDays > 60) {
      interval = "month";
    } else {
      interval = "day";
    }

    const trendData: any[] = [];

    if (interval === "hour") {
      for (let h = 0; h < 24; h++) {
        const label = h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
        const hourStart = new Date(startDate);
        hourStart.setHours(h, 0, 0, 0);
        const hourEnd = new Date(startDate);
        hourEnd.setHours(h, 59, 59, 999);

        const revAmt = filteredRevenue
          .filter(r => isWithinPeriod(r.revenue_date || r.created_at, hourStart, hourEnd))
          .reduce((sum, r) => sum + r.amount, 0);

        const expAmt = filteredExpenses
          .filter(e => isWithinPeriod(e.expense_date || e.created_at, hourStart, hourEnd))
          .reduce((sum, e) => sum + e.amount, 0);

        const orderCount = filteredOrders
          .filter(o => isWithinPeriod(o.order_date, hourStart, hourEnd) && o.status !== "Cancelled")
          .length;

        const delTimeCount = filteredDeliveries
          .filter(d => d.delivered_time && isWithinPeriod(d.delivered_time, hourStart, hourEnd));
        const totalDelTime = delTimeCount.reduce((sum, d) => sum + Number(d.actual_delivery_time || 0), 0);
        const avgDelTime = delTimeCount.length > 0 ? Math.round(totalDelTime / delTimeCount.length) : 0;

        const completedSdel = filteredSupplierDeliveries
          .filter(sd => sd.arrival_time && isWithinPeriod(sd.arrival_time, hourStart, hourEnd)).length;

        const attPresent = filteredAttendance
          .filter(a => isWithinPeriod(a.date, hourStart, hourEnd) && (a.status === "Present" || a.status === "Late")).length;

        const invUsed = filteredInventoryTransactions
          .filter(t => t.type === "OUT" && isWithinPeriod(t.created_at, hourStart, hourEnd))
          .reduce((sum, t) => sum + t.quantity, 0);

        const payrollAmt = filteredExpenses
          .filter(e => e.category === "Staff Salary" && isWithinPeriod(e.expense_date || e.created_at, hourStart, hourEnd))
          .reduce((sum, e) => sum + e.amount, 0);

        trendData.push({
          date: label,
          revenue: revAmt,
          expense: expAmt,
          profit: revAmt - expAmt,
          orders: orderCount,
          deliveryTime: avgDelTime,
          supplierDeliveries: completedSdel,
          attendance: attPresent,
          inventoryUsage: invUsed,
          payroll: payrollAmt
        });
      }
    } else if (interval === "day") {
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = current.toISOString().split("T")[0];
        const label = current.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

        const revAmt = filteredRevenue
          .filter(r => r.revenue_date === dateStr)
          .reduce((sum, r) => sum + r.amount, 0);

        const expAmt = filteredExpenses
          .filter(e => e.expense_date === dateStr)
          .reduce((sum, e) => sum + e.amount, 0);

        const orderCount = filteredOrders
          .filter(o => o.order_date.startsWith(dateStr) && o.status !== "Cancelled")
          .length;

        const delTimeCount = filteredDeliveries
          .filter(d => d.delivered_time && d.delivered_time.startsWith(dateStr));
        const totalDelTime = delTimeCount.reduce((sum, d) => sum + Number(d.actual_delivery_time || 0), 0);
        const avgDelTime = delTimeCount.length > 0 ? Math.round(totalDelTime / delTimeCount.length) : 0;

        const completedSdel = filteredSupplierDeliveries
          .filter(sd => sd.arrival_time && sd.arrival_time.startsWith(dateStr)).length;

        const attPresent = filteredAttendance
          .filter(a => a.date === dateStr && (a.status === "Present" || a.status === "Late")).length;

        const invUsed = filteredInventoryTransactions
          .filter(t => t.type === "OUT" && t.created_at.startsWith(dateStr))
          .reduce((sum, t) => sum + t.quantity, 0);

        const payrollAmt = filteredExpenses
          .filter(e => e.category === "Staff Salary" && e.expense_date === dateStr)
          .reduce((sum, e) => sum + e.amount, 0);

        trendData.push({
          date: label,
          revenue: revAmt,
          expense: expAmt,
          profit: revAmt - expAmt,
          orders: orderCount,
          deliveryTime: avgDelTime,
          supplierDeliveries: completedSdel,
          attendance: attPresent,
          inventoryUsage: invUsed,
          payroll: payrollAmt
        });

        current.setDate(current.getDate() + 1);
      }
    } else {
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
        const label = current.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

        const revAmt = filteredRevenue
          .filter(r => r.revenue_date.startsWith(monthStr))
          .reduce((sum, r) => sum + r.amount, 0);

        const expAmt = filteredExpenses
          .filter(e => e.expense_date.startsWith(monthStr))
          .reduce((sum, e) => sum + e.amount, 0);

        const orderCount = filteredOrders
          .filter(o => o.order_date.startsWith(monthStr) && o.status !== "Cancelled")
          .length;

        const delTimeCount = filteredDeliveries
          .filter(d => d.delivered_time && d.delivered_time.startsWith(monthStr));
        const totalDelTime = delTimeCount.reduce((sum, d) => sum + Number(d.actual_delivery_time || 0), 0);
        const avgDelTime = delTimeCount.length > 0 ? Math.round(totalDelTime / delTimeCount.length) : 0;

        const completedSdel = filteredSupplierDeliveries
          .filter(sd => sd.arrival_time && sd.arrival_time.startsWith(monthStr)).length;

        const attPresent = filteredAttendance
          .filter(a => a.date.startsWith(monthStr) && (a.status === "Present" || a.status === "Late")).length;

        const invUsed = filteredInventoryTransactions
          .filter(t => t.type === "OUT" && t.created_at.startsWith(monthStr))
          .reduce((sum, t) => sum + t.quantity, 0);

        const payrollAmt = filteredExpenses
          .filter(e => e.category === "Staff Salary" && e.expense_date.startsWith(monthStr))
          .reduce((sum, e) => sum + e.amount, 0);

        trendData.push({
          date: label,
          revenue: revAmt,
          expense: expAmt,
          profit: revAmt - expAmt,
          orders: orderCount,
          deliveryTime: avgDelTime,
          supplierDeliveries: completedSdel,
          attendance: attPresent,
          inventoryUsage: invUsed,
          payroll: payrollAmt
        });

        current.setMonth(current.getMonth() + 1);
      }
    }

    return {
      metrics: {
        totalRevenue: totalRev,
        totalExpenses: totalExp,
        profit,
        completedCount: completedOrders.length,
        activeCount: activeOrdersCount,
        efficiencyScore: 94,
        inventoryHealth: 88,
      },
      revenueTrend: trendData,
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
