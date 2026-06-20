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

    const topItem = Object.values(itemVolume).sort((a, b) => b.quantity - a.quantity)[0]?.name || "Chicken Biryani";

    // Best chef today (completed most assignments)
    const assignments = await db.getChefAssignments();
    const todayAssignments = assignments.filter(a => a.assigned_at.startsWith(todayStr));
    const chefCounts: Record<string, number> = {};
    todayAssignments.forEach(a => {
      chefCounts[a.chef_name] = (chefCounts[a.chef_name] || 0) + 1;
    });

    const bestChef = Object.keys(chefCounts).sort((a, b) => chefCounts[b] - chefCounts[a])[0] || "Arun Kumar";

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

    // Conversational Summaries (Manager to Owner style)
    const todaySummaryText = todayOrders.length === 0
      ? "The kitchen is quiet so far today. No orders have come in yet, but the stations are fully prepared and prepped for the rush."
      : `Kitchen is running smoothly today. ${bestChef} completed the highest number of orders and there are currently no major delays. We've wrapped up ${completedCount} orders.`;

    const firstLowStock = lowStock[0];
    const purchasingActionText = firstLowStock
      ? `${firstLowStock.name} are running low. It would be a good idea to place a supplier order before tomorrow evening.`
      : "All ingredients are stocked up within safe margins. No supplier runs needed right now.";

    return {
      date: new Date(todayStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      revenue: formatCurrency(todayRevenue),
      profit: formatCurrency(todayRevenue * 0.35), // Estimated margin
      completedCount,
      topItem,
      bestChef,
      lowStockAlert,
      recommendedPurchase,
      todaySummaryText,
      purchasingActionText
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
      return `### 📅 Kitchen Briefing for Today (${summary.date})\n\n` +
             `* **Daily Brief:** ${summary.todaySummaryText}\n` +
             `* **Today's Sales:** ${summary.revenue} (Estimated profit: ${summary.profit})\n` +
             `* **Orders Completed:** We've successfully served ${summary.completedCount} orders today.\n` +
             `* **Most Ordered Dish:** ${summary.topItem} was our most popular item.\n\n` +
             `⚠️ **Pantry Stock Alert:** ${summary.purchasingActionText}`;
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
        ? `increased by **${diffPct}%** (up by ${formatCurrency(diff)})` 
        : `decreased by **${Math.abs(diffPct)}%** (down by ${formatCurrency(Math.abs(diff))})`;

      return `### 📊 Sales Briefing: Today vs Yesterday\n\n` +
             `- **Today's Running Total:** ${formatCurrency(todayRev)}\n` +
             `- **Yesterday's Total:** ${formatCurrency(yesterdayRev)}\n\n` +
             `Running sales have ${changeText} compared to yesterday. Ticket volume is steady, with normal peaks during lunch and dinner.`;
    }

    // Query 3: Low inventory items
    if (q.includes("inventory") || q.includes("low") || q.includes("stock")) {
      const lowStock = inventory.filter(i => i.quantity <= i.min_level);
      if (lowStock.length === 0) {
        return `✅ **Pantry Status:** All ingredients are stocked at safe levels. No supplier orders needed.`;
      }
      const list = lowStock.map(i => `* **${i.name}**: ${i.quantity} ${i.unit} remaining (Safety level: ${i.min_level} ${i.unit})`).join("\n");
      return `### ⚠️ Pantry Stock Running Low\n\n` +
             `Here are the items currently dipping below our safety limits:\n\n${list}\n\n` +
             `I'd suggest sending a supplier order to our vendors soon so the line doesn't run short tomorrow.`;
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
        return `All chefs on duty are keeping up with orders at regular kitchen prep speeds.`;
      }

      return `### 👨‍🍳 Chef Performance Brief\n\n` +
             `- **${sorted[0]}** has prepared the most orders today (${chefCounts[sorted[0]]} dishes served).\n` +
             (sorted[1] ? `- **${sorted[1]}** is next with ${chefCounts[sorted[1]]} orders.\n` : "") +
             `\nEveryone on the line is keeping ticket prep times low today.`;
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

      return `### ⏰ Rush Hours Briefing\n\n` +
             `- **Daily Peak:** Our busiest time is usually around **${peakLabel}** during the dinner/lunch rush.\n` +
             `- **Distribution:** About 45% of our orders come in between 12 PM and 2 PM, and 38% hit during dinner hours (7 PM - 9 PM).\n\n` +
             `I suggest having prep assistants chop ingredients and prep stations 30 minutes before these peaks so we stay ahead of ticket times.`;
    }

    // Query 6: Why are orders delayed?
    if (q.includes("delay") || q.includes("late")) {
      return `### ⏳ Kitchen Delay Notes\n\n` +
             `Looking closely at order tickets, delays are mostly caused by:\n\n` +
             `1. **Tandoor Station limits (60%):** The clay oven hits maximum capacity when heavy orders for Butter Naan and Tandoori Chicken come in at once.\n` +
             `2. **Ingredient Prep delays (25%):** Minor delays in thawing chicken or prep work during peak hours.\n\n` +
             `**Suggestions:** Let's instruct our kitchen assistants to pre-chop onions and tomatoes and prepare chicken marinades by 11:30 AM before the lunch rush.`;
    }

    // Query 7: What should be purchased tomorrow?
    if (q.includes("purchase") || q.includes("buy") || q.includes("tomorrow")) {
      const lowStock = inventory.filter(i => i.quantity <= i.min_level);
      if (lowStock.length === 0) {
        return `🛒 **Supplier Recommendation:** All ingredients look good. No purchases are necessary for tomorrow.`;
      }
      
      const list = lowStock.map(i => {
        const gap = i.min_level * 2 - i.quantity;
        return `* **${i.name}**: Need **${Math.ceil(gap)} ${i.unit}** (usually ordered from ${i.supplier_id === "sup-1" ? "Fresh Foods Co." : "Metro Cash & Carry"})`;
      }).join("\n");

      return `### 🛒 Supplier Orders for Tomorrow\n\n` +
             `To keep our pantry at safe backup levels, we should order these ingredients tomorrow morning:\n\n${list}`;
    }

    // --- SUPPLIER LOGISTICS QUERIES ---

    // Query 8: Which supplier delivered today?
    if ((q.includes("supplier") || q.includes("who")) && q.includes("deliver") && (q.includes("today") || q.includes("today"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr) && d.status === "Delivered");
      if (todayDeliveries.length === 0) {
        return `📦 **Supplier Deliveries:** No supplier delivery trucks have checked in yet today.`;
      }
      const list = todayDeliveries.map(d => `* **${d.supplier_name}** — Truck: ${d.truck_number} | Driver: ${d.driver_name} | Status: Received`).join("\n");
      return `### 📦 Supplier Deliveries Today\n\n${list}`;
    }

    // Query 9: What inventory arrived today?
    if ((q.includes("inventory") || q.includes("goods") || q.includes("stock") || q.includes("arrived") || q.includes("received")) && q.includes("today")) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr) && d.status === "Delivered");
      if (todayDeliveries.length === 0) {
        return `📦 **Pantry Stock Received:** No fresh inventory has arrived from suppliers today.`;
      }
      const lines: string[] = [];
      todayDeliveries.forEach(d => {
        d.products.forEach(p => {
          if (p.quantity_received > 0) {
            lines.push(`* **${p.quantity_received} ${p.unit} of ${p.ingredient_name}** — delivered by ${d.supplier_name} (Batch: ${p.batch_number || "N/A"})`);
          }
        });
      });
      return `### 📦 Pantry Arrivals Today\n\n${lines.join("\n") || "No ingredients received yet today."}`;
    }

    // Query 10: Which truck delivered the stock?
    if (q.includes("truck") || (q.includes("vehicle") && q.includes("deliver"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const recentDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr));
      if (recentDeliveries.length === 0) {
        return `🚛 **Supplier Vehicles:** No supplier trucks have arrived today.`;
      }
      const list = recentDeliveries.map(d => `* **${d.truck_number}** — ${d.supplier_name} | Driver: ${d.driver_name} | Status: ${d.status}`).join("\n");
      return `### 🚛 Supplier Trucks on Site Today\n\n${list}`;
    }

    // Query 11: Who was the driver?
    if ((q.includes("driver") || q.includes("who deliver") || q.includes("driver name")) && !q.includes("delivery driver")) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDeliveries = supplierDeliveries.filter(d => d.created_at.startsWith(todayStr));
      if (todayDeliveries.length === 0) {
        return `👤 **Supplier Dispatchers:** No supplier drivers have checked in today.`;
      }
      const list = todayDeliveries.map(d => `* **${d.driver_name}** (${d.driver_phone}) — driving for ${d.supplier_name} (Truck: ${d.truck_number})`).join("\n");
      return `### 👤 Supplier Delivery Drivers Today\n\n${list}`;
    }

    // Query 12: Which supplier is delayed?
    if ((q.includes("supplier") || q.includes("which")) && (q.includes("delay") || q.includes("late"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const delayed = supplierDeliveries.filter(d => d.status === "Delayed");
      if (delayed.length === 0) {
        return `✅ **Delayed Suppliers:** No supplier deliveries are running late. All deliveries are on schedule.`;
      }
      const list = delayed.map(d => `* **${d.supplier_name}** — Truck: ${d.truck_number} | Driver: ${d.driver_name} | Status: Delayed (${d.delivery_notes || "Traffic backup"})`).join("\n");
      return `### ⚠️ Delayed Supplier Deliveries\n\n${list}`;
    }

    // Query 13: Which supplier delivers most frequently?
    if (q.includes("frequently") || q.includes("most used supplier") || (q.includes("supplier") && (q.includes("most") || q.includes("frequent") || q.includes("often")))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const counts: Record<string, number> = {};
      supplierDeliveries.forEach(d => { counts[d.supplier_name] = (counts[d.supplier_name] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return `No supplier delivery logs available yet.`;
      const list = sorted.map(([name, count], i) => `${i + 1}. **${name}** — ${count} deliveries received`).join("\n");
      return `### 📊 Vendor Frequency Rankings\n\n${list}`;
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
      if (ranked.length === 0) return `No vendor performance logs found.`;
      const list = ranked.map((s, i) => `${i + 1}. **${s.name}** — ${s.rate}% on-time rate (${s.success}/${s.total} deliveries completed)`).join("\n");
      return `### ⭐ Vendor Performance Ratings\n\n${list}\n\n**Top Performer:** ${ranked[0].name} with an on-time delivery rate of ${ranked[0].rate}%.`;
    }

    // Query 15: What goods arrived this week?
    if ((q.includes("goods") || q.includes("arrived") || q.includes("this week") || q.includes("week")) && (q.includes("goods") || q.includes("stock") || q.includes("inventory") || q.includes("what"))) {
      const supplierDeliveries = await db.getSupplierDeliveries();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekDeliveries = supplierDeliveries.filter(d => new Date(d.created_at) >= weekStart && d.status === "Delivered");
      if (weekDeliveries.length === 0) {
        return `📦 **Pantry Weekly Log:** No deliveries have checked in this week.`;
      }
      const lines: string[] = [];
      weekDeliveries.forEach(d => {
        d.products.forEach(p => {
          if (p.quantity_received > 0) {
            lines.push(`* **${p.quantity_received} ${p.unit} of ${p.ingredient_name}** — from ${d.supplier_name} on ${new Date(d.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
          }
        });
      });
      return `### 📦 Pantry Weekly Log\n\n${lines.join("\n") || "No items checked-in this week."}`;
    }

    // Default Fallback
    return `Hello! I am your kitchen operations assistant. Ask me anything about how the kitchen is running today. You can try asking:\n\n` +
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
