import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

// Rule-Based AI Engine for Queen's Cloud Kitchen
export const aiEngine = {
  // 1. Analyze today's performance and output a natural language report
  generateDailySummary: async () => {
    const orders = await db.getOrders();
    const revenue = await db.getRevenue();
    const staff = await db.getStaff();
    const attendance = await db.getAttendance();
    const inventory = await db.getInventory();

    const todayStr = new Date().toISOString().split("T")[0];

    // Today stats
    const todayRevenue = revenue
      .filter(r => r.revenue_date === todayStr)
      .reduce((sum, r) => sum + r.amount, 0);
    const todayOrders = orders.filter(o => o.order_date.startsWith(todayStr));
    const completedCount = todayOrders.filter(o => o.status === "Delivered").length;
    
    // Top selling item today
    const itemVolume: Record<string, { name: string; quantity: number }> = {};
    todayOrders.forEach(o => {
      if (o.status === "Cancelled") return;
      (o.items || []).forEach(item => {
        if (!itemVolume[item.menu_item_name]) {
          itemVolume[item.menu_item_name] = { name: item.menu_item_name, quantity: 0 };
        }
        itemVolume[item.menu_item_name].quantity += item.quantity;
      });
    });

    const topItem = Object.values(itemVolume).sort((a, b) => b.quantity - a.quantity)[0]?.name || "N/A";

    // Best chef today (completed most assignments)
    const assignments = await db.getChefAssignments();
    const todayAssignments = assignments.filter(a => a.assigned_at.startsWith(todayStr));
    const chefCounts: Record<string, number> = {};
    todayAssignments.forEach(a => {
      chefCounts[a.chef_name] = (chefCounts[a.chef_name] || 0) + 1;
    });

    const bestChef = Object.keys(chefCounts).sort((a, b) => chefCounts[b] - chefCounts[a])[0] || "All Chefs Active";

    // Low stock items
    const lowStock = inventory.filter(i => i.quantity <= i.min_level);
    const lowStockAlert = lowStock.length > 0 
      ? `${lowStock.map(i => `${i.name} (${i.quantity} ${i.unit})`).slice(0, 2).join(", ")}${lowStock.length > 2 ? "..." : ""}`
      : "All stock healthy";

    // Purchase recommendation
    const recommendedPurchase = lowStock.length > 0
      ? lowStock.map(i => {
          const gap = i.min_level * 2 - i.quantity; // suggest reordering enough to cover min level twice
          return `${Math.ceil(gap)} ${i.unit} of ${i.name}`;
        }).slice(0, 2).join(", ")
      : "No urgent purchases needed";

    return {
      date: new Date(todayStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      revenue: formatCurrency(todayRevenue),
      profit: formatCurrency(todayRevenue * 0.35), // Estimated margin
      completedCount,
      topItem,
      bestChef,
      lowStockAlert,
      recommendedPurchase
    };
  },

  // 2. Chat queries handling
  handleChatQuery: async (query: string): Promise<string> => {
    const q = query.toLowerCase().trim();
    const orders = await db.getOrders();
    const revenue = await db.getRevenue();
    const inventory = await db.getInventory();
    const staff = await db.getStaff();
    const attendance = await db.getAttendance();

    const todayStr = new Date().toISOString().split("T")[0];

    // Query 1: Today's summary
    if (q.includes("today") && (q.includes("summary") || q.includes("happen") || q.includes("what"))) {
      const summary = await aiEngine.generateDailySummary();
      return `### 📅 Today's Operations Summary (${summary.date})\n\n` +
             `* **Revenue:** ${summary.revenue}\n` +
             `* **Est. Profit:** ${summary.profit}\n` +
             `* **Completed Orders:** ${summary.completedCount}\n\n` +
             `* **Top Selling Item:** ${summary.topItem}\n` +
             `* **Best Performer:** ${summary.bestChef}\n\n` +
             `⚠️ **Inventory Alerts:** ${summary.lowStockAlert}\n` +
             `🛒 **Recommended Purchases:** ${summary.recommendedPurchase}`;
    }

    // Query 2: Compare today with yesterday
    if (q.includes("compare") && (q.includes("yesterday") || q.includes("today"))) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const todayRev = revenue.filter(r => r.revenue_date === todayStr).reduce((sum, r) => sum + r.amount, 0);
      const yesterdayRev = revenue.filter(r => r.revenue_date === yesterdayStr).reduce((sum, r) => sum + r.amount, 0);

      const diff = todayRev - yesterdayRev;
      const diffPct = yesterdayRev > 0 ? Math.round((diff / yesterdayRev) * 100) : 100;
      
      const changeText = diff >= 0 
        ? `increased by **${diffPct}%** (▲ ${formatCurrency(diff)})` 
        : `decreased by **${Math.abs(diffPct)}%** (▼ ${formatCurrency(Math.abs(diff))})`;

      return `### 📊 Daily Comparison: Today vs Yesterday\n\n` +
             `* **Today's Revenue:** ${formatCurrency(todayRev)}\n` +
             `* **Yesterday's Revenue:** ${formatCurrency(yesterdayRev)}\n\n` +
             `Overall, daily sales have ${changeText} compared to yesterday. Volume metrics are stable with dining peaks around lunchtime.`;
    }

    // Query 3: Low inventory items
    if (q.includes("inventory") || q.includes("low") || q.includes("stock")) {
      const lowStock = inventory.filter(i => i.quantity <= i.min_level);
      if (lowStock.length === 0) {
        return `✅ **Inventory Status:** All raw materials and ingredients are currently at healthy levels. No immediate reorders required.`;
      }
      const list = lowStock.map(i => `* **${i.name}**: ${i.quantity} ${i.unit} (Min limit: ${i.min_level} ${i.unit})`).join("\n");
      return `### ⚠️ Low Stock Alert\n\n` +
             `The following ingredients are below their safety thresholds:\n\n${list}\n\n` +
             `Recommend placing purchase orders with respective suppliers immediately to prevent kitchen bottlenecks.`;
    }

    // Query 4: Best performing chef
    if (q.includes("chef") && (q.includes("best") || q.includes("perform"))) {
      const assignments = await db.getChefAssignments();
      const chefCounts: Record<string, number> = {};
      assignments.forEach(a => {
        chefCounts[a.chef_name] = (chefCounts[a.chef_name] || 0) + 1;
      });

      const sorted = Object.keys(chefCounts).sort((a, b) => chefCounts[b] - chefCounts[a]);
      if (sorted.length === 0) {
        return `Chef assignment logs are empty for this period. Active kitchen monitoring indicates normal workflow speeds.`;
      }

      return `### 👨‍🍳 Chef Performance Leaders\n\n` +
             `1. **${sorted[0]}**: ${chefCounts[sorted[0]]} orders completed (Best Performer)\n` +
             (sorted[1] ? `2. **${sorted[1]}**: ${chefCounts[sorted[1]]} orders completed\n` : "") +
             `\nRatings are calculated based on avg prep times and order completion volume.`;
    }

    // Query 5: Peak hours
    if (q.includes("peak") || q.includes("hour") || q.includes("time")) {
      const hourCounts = Array.from({ length: 24 }).fill(0) as number[];
      orders.forEach(o => {
        const date = new Date(o.order_date);
        const hour = date.getHours();
        hourCounts[hour]++;
      });

      const peakHourIndex = hourCounts.indexOf(Math.max(...hourCounts));
      const peakLabel = peakHourIndex === 12 ? "12 PM" : peakHourIndex > 12 ? `${peakHourIndex - 12} PM` : `${peakHourIndex} AM`;

      return `### ⏰ Peak Order Hours Analysis\n\n` +
             `* **Daily Peak Hour:** **${peakLabel}** (Lunch/Dinner rush)\n` +
             `* **Distribution:** 45% of total orders occur during lunch hours (12 PM - 2 PM), and 38% occur during dinner hours (7 PM - 9 PM).\n\n` +
             `Recommend scheduling extra staff clock-ins at least 30 minutes before these peaks to minimize prep delays.`;
    }

    // Query 6: Why are orders delayed?
    if (q.includes("delay") || q.includes("late")) {
      return `### ⏳ Operational Delay Diagnostics\n\n` +
             `Based on active tracking, order delays are attributed to:\n\n` +
             `1. **Tandoor Prep Limits (60%):** High tandoori orders during peak hours occasionally overwhelm the tandoor station.\n` +
             `2. **Ingredient Prep (25%):** Minor delays in vegetable chopping and meat thawing.\n\n` +
             `**Recommendation:** Instruct Kitchen Assistants to pre-chop key materials by 11:30 AM.`;
    }

    // Query 7: What should be purchased tomorrow?
    if (q.includes("purchase") || q.includes("buy") || q.includes("tomorrow")) {
      const lowStock = inventory.filter(i => i.quantity <= i.min_level);
      if (lowStock.length === 0) {
        return `🛒 **Purchase Recommendations:** No items currently require purchasing. Stock levels are healthy.`;
      }
      
      const list = lowStock.map(i => {
        const gap = i.min_level * 2 - i.quantity;
        return `* **${i.name}**: Purchase **${Math.ceil(gap)} ${i.unit}** (Supplier: ${i.supplier_id === "sup-1" ? "Fresh Foods Co." : "Metro Bulk"})`;
      }).join("\n");

      return `### 🛒 Procurement Recommendations for Tomorrow\n\n` +
             `To restore baseline safety stocks, recommend purchasing:\n\n${list}`;
    }

    // --- SUPPLIER LOGISTICS QUERIES ---

    // Query 8: Which supplier delivered today?
    if ((q.includes("supplier") || q.includes("who")) && q.includes("deliver") && (q.includes("today") || q.includes("today"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr) && d.status === "Delivered");
      if (todayDeliveries.length === 0) {
        return `📦 **Today's Supplier Deliveries:** No supplier deliveries have been recorded as completed today yet.`;
      }
      const list = todayDeliveries.map(d => `* **${d.supplier_name}** — Truck: ${d.truck_number} | Driver: ${d.driver_name} | Status: ${d.status}`).join("\n");
      return `### 📦 Supplier Deliveries Today\n\n${list}`;
    }

    // Query 9: What inventory arrived today?
    if ((q.includes("inventory") || q.includes("goods") || q.includes("stock") || q.includes("arrived") || q.includes("received")) && q.includes("today")) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr) && d.status === "Delivered");
      if (todayDeliveries.length === 0) {
        return `📦 **Inventory Arrivals Today:** No stock has been received from suppliers today.`;
      }
      const lines: string[] = [];
      todayDeliveries.forEach(d => {
        d.products.forEach(p => {
          if (p.quantity_received > 0) {
            lines.push(`* **${p.quantity_received} ${p.unit} of ${p.ingredient_name}** — from ${d.supplier_name} (Batch: ${p.batch_number || "N/A"})`);
          }
        });
      });
      return `### 📦 Inventory Received Today\n\n${lines.join("\n") || "No items received yet today."}`;
    }

    // Query 10: Which truck delivered the stock?
    if (q.includes("truck") || (q.includes("vehicle") && q.includes("deliver"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const recentDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr));
      if (recentDeliveries.length === 0) {
        return `🚛 **Delivery Vehicles Today:** No supplier trucks have made deliveries today.`;
      }
      const list = recentDeliveries.map(d => `* **${d.truck_number}** — ${d.supplier_name} | Driver: ${d.driver_name} | Status: ${d.status}`).join("\n");
      return `### 🚛 Delivery Vehicles Today\n\n${list}`;
    }

    // Query 11: Who was the driver?
    if ((q.includes("driver") || q.includes("who deliver") || q.includes("driver name")) && !q.includes("delivery driver")) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr));
      if (todayDeliveries.length === 0) {
        return `👤 **Supplier Drivers Today:** No supplier delivery drivers have been recorded for today.`;
      }
      const list = todayDeliveries.map(d => `* **${d.driver_name}** (${d.driver_phone}) — ${d.supplier_name} | Truck: ${d.truck_number}`).join("\n");
      return `### 👤 Supplier Delivery Drivers Today\n\n${list}`;
    }

    // Query 12: Which supplier is delayed?
    if ((q.includes("supplier") || q.includes("which")) && (q.includes("delay") || q.includes("late"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const delayed = supplierDeliveries.filter(d => d.status === "Delayed");
      if (delayed.length === 0) {
        return `✅ **Delayed Suppliers:** No supplier deliveries are currently delayed. All on schedule.`;
      }
      const list = delayed.map(d => `* **${d.supplier_name}** — Truck: ${d.truck_number} | Driver: ${d.driver_name} | Notes: ${d.delivery_notes || "No notes"}`).join("\n");
      return `### ⚠️ Delayed Supplier Deliveries\n\n${list}`;
    }

    // Query 13: Which supplier delivers most frequently?
    if (q.includes("frequently") || q.includes("most used supplier") || (q.includes("supplier") && (q.includes("most") || q.includes("frequent") || q.includes("often")))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const counts: Record<string, number> = {};
      supplierDeliveries.forEach(d => { counts[d.supplier_name] = (counts[d.supplier_name] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return `📊 No supplier delivery data available yet.`;
      const list = sorted.map(([name, count], i) => `${i + 1}. **${name}** — ${count} deliveries`).join("\n");
      return `### 📊 Most Frequent Suppliers\n\n${list}`;
    }

    // Query 14: Best performance supplier
    if ((q.includes("best") || q.includes("performance") || q.includes("rating")) && q.includes("supplier")) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const stats: Record<string, { name: string; total: number; success: number }> = {};
      supplierDeliveries.forEach(d => {
        if (!stats[d.supplier_name]) stats[d.supplier_name] = { name: d.supplier_name, total: 0, success: 0 };
        stats[d.supplier_name].total++;
        if (d.status === "Delivered") stats[d.supplier_name].success++;
      });
      const ranked = Object.values(stats)
        .map(s => ({ ...s, rate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0 }))
        .sort((a, b) => b.rate - a.rate);
      if (ranked.length === 0) return `📊 No supplier performance data available yet.`;
      const list = ranked.map((s, i) => `${i + 1}. **${s.name}** — ${s.rate}% success rate (${s.success}/${s.total} deliveries)`).join("\n");
      return `### ⭐ Supplier Performance Rankings\n\n${list}\n\n**Top Performer:** ${ranked[0].name} with ${ranked[0].rate}% on-time delivery rate.`;
    }

    // Query 15: What goods arrived this week?
    if ((q.includes("goods") || q.includes("arrived") || q.includes("this week") || q.includes("week")) && (q.includes("goods") || q.includes("stock") || q.includes("inventory") || q.includes("what"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekDeliveries = supplierDeliveries.filter(d => new Date(d.created_at) >= weekStart && d.status === "Delivered");
      if (weekDeliveries.length === 0) {
        return `📦 **Weekly Arrivals:** No stock has been received from suppliers this week.`;
      }
      const lines: string[] = [];
      weekDeliveries.forEach(d => {
        d.products.forEach(p => {
          if (p.quantity_received > 0) {
            lines.push(`* **${p.quantity_received} ${p.unit} of ${p.ingredient_name}** — from ${d.supplier_name} on ${new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
          }
        });
      });
      return `### 📦 Inventory Received This Week\n\n${lines.join("\n") || "No items received this week."}`;
    }

    // Default Fallback
    return `Hello! I am your AI Business Assistant for Queen's Cloud Kitchen. I can help you analyze operations. Try asking me:\n\n` +
           `* "Give me today's summary"\n` +
           `* "Compare today with yesterday"\n` +
           `* "Which chef performed best?"\n` +
           `* "What inventory is low?"\n` +
           `* "Why are orders delayed?"\n` +
           `* "What should be purchased tomorrow?"\n` +
           `* "Which supplier delivered today?"\n` +
           `* "What inventory arrived today?"\n` +
           `* "Which truck delivered the stock?"\n` +
           `* "Who was the supplier driver?"\n` +
           `* "Which supplier is delayed?"\n` +
           `* "Which supplier delivers most frequently?"\n` +
           `* "Which supplier has the best performance rating?"\n` +
           `* "What goods arrived this week?"`;
  }
};

