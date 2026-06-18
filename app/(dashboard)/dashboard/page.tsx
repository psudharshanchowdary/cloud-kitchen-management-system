"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/actions/dashboard";
import { getAnalyticsData } from "@/actions/analytics";
import { getDailySummaryReport } from "@/actions/ai-assistant";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { 
  TrendingUp, DollarSign, ShoppingBag, Clock, ShieldAlert, 
  ChefHat, Sparkles, AlertTriangle, UserCheck, Package, FileText, Box, Truck
} from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import Link from "next/link";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, analyticsRes, aiRes] = await Promise.all([
          getDashboardData(),
          getAnalyticsData(),
          getDailySummaryReport()
        ]);
        setData(dashRes);
        setAnalytics(analyticsRes);
        setAiReport(aiRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading metrics..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const { stats, recentOrders, lowStockAlerts, staffOnDuty } = data || {
    stats: {}, recentOrders: [], lowStockAlerts: [], staffOnDuty: []
  };

  if (!user) return null;

  // 1. OPERATIONS MANAGER DASHBOARD
  if (user.role === "Operations Manager") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Operations Overview" 
          description="Operational metrics, delivery, inventory, and staff rosters."
          category="Manager View"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Today's Revenue" 
            value={formatCurrency(stats.todayRevenue || 0)} 
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            description="Gross orders today"
          />
          <StatCard 
            title="Monthly Revenue" 
            value={formatCurrency(stats.monthlyRevenue || 0)} 
            icon={TrendingUp}
            trend={{ value: 8.4, isPositive: true }}
            description="Month-to-date sales"
          />
          <StatCard 
            title="Active Orders" 
            value={stats.activeOrdersCount || 0} 
            icon={ShoppingBag}
            description="Orders in queue or preparing"
          />
          <StatCard 
            title="Staff on Duty" 
            value={stats.staffOnDutyCount || 0} 
            icon={UserCheck}
            description="Active clocked-in workers"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Trends */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <h3 className="text-base font-bold text-foreground mb-2">Revenue Trends</h3>
              <div className="h-64 w-full">
                {analytics?.revenueTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenueTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No chart data available</div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <h3 className="text-base font-bold text-foreground mb-4">Recent Orders Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold">
                      <th className="pb-3 pr-2">Order ID</th>
                      <th className="pb-3 px-2">Customer</th>
                      <th className="pb-3 px-2">Amount</th>
                      <th className="pb-3 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 3).map((o: any) => (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/50 text-foreground">
                        <td className="py-3 pr-2 font-mono font-bold text-foreground">{o.order_number}</td>
                        <td className="py-3 px-2">{o.customer_name}</td>
                        <td className="py-3 px-2 font-bold text-emerald-500">{formatCurrency(o.total_amount)}</td>
                        <td className="py-3 pl-2"><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Low stock alerts */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Low Stock alerts</span>
              <div className="space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">All stocks healthy</div>
                ) : (
                  lowStockAlerts.slice(0, 3).map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                      <span className="text-xs font-bold text-foreground">{item.name}</span>
                      <span className="text-xs text-rose-500 font-bold">{item.quantity} {item.unit}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Staff on shift */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Staff on Duty</span>
              <div className="space-y-3">
                {staffOnDuty.slice(0, 3).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 bg-background border border-border rounded-xl">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-[10px] uppercase">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{s.role}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

        {/* Driver Status & Active Deliveries */}
        <div className="bg-card border border-border rounded-2xl p-6 glow-sm mt-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-500" /> Driver Status & Deliveries
              </h3>
              <p className="text-xs text-muted-foreground">Track delivery driver availability, active courier runs, and delays</p>
            </div>
            <Link href="/delivery" className="text-xs text-emerald-500 font-semibold hover:underline">
              Delivery Dashboard
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold bg-card/50">
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3 text-center">Active Trips</th>
                  <th className="p-3 text-center">Completed Trips</th>
                  <th className="p-3 text-center">Delayed Trips</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.driverSummaries?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">No drivers registered</td>
                  </tr>
                ) : (
                  (data.driverSummaries || []).map((driver: any) => (
                    <tr key={driver.id} className="border-b border-border text-foreground">
                      <td className="p-3 font-bold text-foreground">{driver.name}</td>
                      <td className="p-3">{driver.phone}</td>
                      <td className="p-3 font-mono">{driver.vehicle_number} ({driver.vehicle_type})</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${driver.activeCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'text-muted-foreground'}`}>
                          {driver.activeCount}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-500">{driver.completedCount}</td>
                      <td className="p-3 text-center">
                        <span className={driver.delayedCount > 0 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}>
                          {driver.delayedCount}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          driver.status === 'Available' 
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' 
                            : driver.status === 'On Delivery' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {driver.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. HEAD CHEF DASHBOARD
  if (user.role === "Head Chef") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Kitchen Operations Dashboard" 
          description="Roster monitoring, queue tracking, and station workload control."
          category="Head Chef Control Room"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Orders In Queue" 
            value={stats.activeOrdersCount || 0} 
            icon={ChefHat}
            description="Active tickets being prepared"
          />
          <StatCard 
            title="Kitchen Efficiency" 
            value={`${stats.kitchenEfficiency || 96}%`} 
            icon={TrendingUp}
            description="On-time delivery score"
          />
          <StatCard 
            title="Chefs on Shift" 
            value={staffOnDuty.filter((s: any) => ["Head Chef", "Chef", "Kitchen Assistant"].includes(s.role)).length} 
            icon={UserCheck}
            description="Active kitchen crew"
          />
          <StatCard 
            title="Delayed Tickets" 
            value={stats.delayedCount || 0} 
            icon={Clock}
            className={stats.delayedCount > 0 ? "border-rose-500/30 glow-sm" : ""}
            description="Preparation exceeding 40 mins"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active kitchen queue summary */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <h3 className="text-base font-bold text-foreground mb-4">Kitchen Queue Live Status</h3>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">No active orders</p>
                ) : (
                  recentOrders.map((o: any) => (
                    <div key={o.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-foreground block">{o.order_number}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {(o.items || []).map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(", ")}
                        </span>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Staff Attendance summary */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Kitchen Crew Attendance</span>
              <div className="space-y-2">
                {analytics?.attendanceStats?.filter((s: any) => ["Head Chef", "Chef", "Kitchen Assistant"].includes(s.role)).slice(0, 4).map((s: any) => (
                  <div key={s.name} className="flex justify-between items-center text-xs">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.attendanceRate}% check-in</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredient shortage alerts */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Ingredient Shortages</span>
              <div className="space-y-2">
                {lowStockAlerts.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No raw material shortages reported.</span>
                ) : (
                  lowStockAlerts.slice(0, 3).map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center text-xs p-2 bg-background border border-border rounded-lg">
                      <span className="text-foreground font-bold">{item.name}</span>
                      <span className="text-rose-500 font-bold">{item.quantity} left</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. CHEF DASHBOARD
  if (user.role === "Chef") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Chef Preparation Station" 
          description="Prepare assigned dishes, update order statuses, and monitor performance."
          category="Chef Workspace"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="My Assigned Orders" 
            value={stats.activeOrdersCount ? Math.ceil(stats.activeOrdersCount / 2) : 0} 
            icon={ChefHat}
            description="Tickets assigned to my station"
          />
          <StatCard 
            title="Avg Preparation Speed" 
            value="14 mins" 
            icon={Clock}
            description="Preparation latency per order"
          />
          <StatCard 
            title="Orders Prepared Today" 
            value={stats.completedOrders ? Math.ceil(stats.completedOrders / 2) : 4} 
            icon={TrendingUp}
            description="Total completed tickets"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Assigned Cooking Queue</h3>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No assigned orders</p>
            ) : (
              recentOrders.slice(0, 3).map((o: any) => (
                <div key={o.id} className="flex justify-between items-center p-4 bg-background border border-border rounded-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground">{o.order_number}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-card border border-border text-muted-foreground rounded-full capitalize">
                        {o.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(o.items || []).map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/kitchen" className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] rounded-lg shadow-md transition-all">
                      Update Status
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. KITCHEN ASSISTANT DASHBOARD
  if (user.role === "Kitchen Assistant") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Kitchen Assistant Helper" 
          description="Track raw ingredient preps, thawing requests, and cleaning tasks."
          category="Assistant Workspace"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Ingredient Prep Tasks" 
            value="4 Tasks" 
            icon={ChefHat}
            description="Active chopping/thawing items"
          />
          <StatCard 
            title="Total Tasks Done Today" 
            value="16 Completed" 
            icon={TrendingUp}
            description="Completed roster duties"
          />
          <StatCard 
            title="Urgent Material Requests" 
            value={lowStockAlerts.length} 
            icon={AlertTriangle}
            description="Raw items below safety margins"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 glow-sm">
            <h3 className="text-base font-bold text-foreground mb-4">Assigned Preparation checklist</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                <div>
                  <span className="font-bold text-foreground block">Chop Tomatoes (5kg)</span>
                  <span className="text-[10px] text-muted-foreground">For Gravy & Curry Station preparation</span>
                </div>
                <span className="text-amber-500 font-bold text-[10px]">Pending</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                <div>
                  <span className="font-bold text-foreground block">Thaw Chicken (10kg)</span>
                  <span className="text-[10px] text-muted-foreground">For Rice & Biryani Dum preparation</span>
                </div>
                <span className="text-amber-500 font-bold text-[10px]">Thawing</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                <div>
                  <span className="font-bold text-foreground block">Clean Gravy Fryers</span>
                  <span className="text-[10px] text-muted-foreground">Post lunch-shift station sanitizing</span>
                </div>
                <span className="text-emerald-500 font-bold text-[10px]">Completed</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground mb-4">Submit Material Reorder</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Report shortages of chicken, paneer, ghee, or maida directly to the inventory manager.
              </p>
            </div>
            <Link href="/inventory" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold block text-right">
              View Inventory levels →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. PACKING STAFF DASHBOARD
  if (user.role === "Packing Staff") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Packing & Dispatch Desk" 
          description="Verify order contents, print packing slips, and dispatch to delivery drivers."
          category="Packing Workspace"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Tickets to Pack" 
            value={stats.activeOrdersCount ? Math.max(1, Math.floor(stats.activeOrdersCount / 3)) : 0} 
            icon={Box}
            description="Orders with READY food status"
          />
          <StatCard 
            title="Orders Packed Today" 
            value="25 Orders" 
            icon={TrendingUp}
            description="Successfully sealed and dispatched"
          />
          <StatCard 
            title="Delivery Dispatches Active" 
            value="8 Shipments" 
            icon={Truck}
            description="Out for delivery right now"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Pending Packing queue</h3>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No orders to pack</p>
            ) : (
              recentOrders.slice(0, 3).map((o: any) => (
                <div key={o.id} className="flex justify-between items-center p-4 bg-background border border-border rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-foreground block">{o.order_number}</span>
                    <span className="text-[10px] text-muted-foreground block">{o.customer_name}</span>
                  </div>
                  <Link href="/packing" className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] rounded-lg shadow-md transition-all">
                    Open Packing Sheet
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. INVENTORY MANAGER DASHBOARD
  if (user.role === "Inventory Manager") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Inventory Dashboard" 
          description="Safety stock monitoring, supplier directory, and purchase order tracking."
          category="Inventory Workspace"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Total Stock Items" 
            value="7 Raw Materials" 
            icon={Package}
            description="Items inside the dry/cold pantry"
          />
          <StatCard 
            title="Low Stock Warnings" 
            value={lowStockAlerts.length} 
            icon={AlertTriangle}
            className={lowStockAlerts.length > 0 ? "border-rose-500/30 glow-sm" : ""}
            description="Materials below reorder limits"
          />
          <StatCard 
            title="Suppliers Registered" 
            value="2 Suppliers" 
            icon={Truck}
            description="Active raw food vendors"
          />
          <StatCard 
            title="Pending Purchase Orders" 
            value="1 Pending PO" 
            icon={FileText}
            description="Awaiting delivery verification"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low stock list */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
            <h3 className="text-base font-bold text-foreground mb-4">Stock level alerts</h3>
            <div className="space-y-3">
              {lowStockAlerts.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">All ingredient stock levels healthy</p>
              ) : (
                lowStockAlerts.map((item: any) => (
                  <div key={item.name} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                    <span className="text-xs font-bold text-foreground">{item.name}</span>
                    <span className="text-xs text-rose-500 font-bold">{item.quantity} {item.unit} remaining</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick procurement link */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground mb-4">Quick Procurement Tools</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Instantly generate Purchase Orders for low-stock items from Fresh Foods & Dairy Co. or Metro Cash & Carry.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Link href="/suppliers" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all">
                Create Purchase Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. DELIVERY DRIVER DASHBOARD
  if (user.role === "Delivery Driver") {
    const myDriver = data.driverSummaries?.find((d: any) => d.phone === user.phone) || {
      name: user.name,
      phone: user.phone || "—",
      vehicle_number: "TN 19 AB 1234",
      vehicle_type: "Bike",
      status: "Available",
      activeCount: 0,
      completedCount: 0,
      delayedCount: 0
    };

    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Delivery Driver Portal" 
          description="View your assigned delivery runs, update order delivery status, and track completed trips."
          category="Courier Workspace"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="My Active Trips" 
            value={myDriver.activeCount || 0} 
            icon={Truck}
            description="Assigned runs en route"
          />
          <StatCard 
            title="Total Deliveries" 
            value={myDriver.completedCount || 0} 
            icon={TrendingUp}
            description="All-time completed deliveries"
          />
          <StatCard 
            title="My Vehicle" 
            value={myDriver.vehicle_number} 
            icon={Package}
            description={`${myDriver.vehicle_type} assigned`}
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">My Delivery Queue</h3>
          {myDriver.activeCount === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
              <Truck className="h-8 w-8 mb-2 opacity-50 text-emerald-500" />
              <span className="text-xs">No active runs assigned. Awaiting packing dispatch...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-4">You have active shipments. Please proceed with the run and update status upon arrival.</p>
              <Link href="/delivery" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95 inline-block">
                Open Delivery Desk
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT / OWNER (EXECUTIVE) DASHBOARD
  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Executive Dashboard" 
        description="Complete operational control and financial health metrics."
        category="Admin overview"
        actions={
          <Link 
            href="/ai-assistant" 
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
          >
            <Sparkles className="h-4 w-4" /> Ask AI Assistant
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue || 0)} 
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          description="Cumulative gross sales"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(stats.totalExpenses || 0)} 
          icon={TrendingUp}
          trend={{ value: 5.2, isPositive: false }}
          description="Total payroll & operational outflow"
        />
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(stats.profit || 0)} 
          icon={DollarSign}
          trend={{ value: 18.4, isPositive: true }}
          className={stats.profit > 0 ? "border-emerald-500/30 glow-sm" : ""}
          description="Net profit margins"
        />
        <StatCard 
          title="Business Growth" 
          value={`${stats.businessGrowth || 0}%`} 
          icon={TrendingUp}
          trend={{ value: stats.businessGrowth || 0, isPositive: (stats.businessGrowth || 0) >= 0 }}
          description="Month-over-month growth rate"
        />
        <StatCard 
          title="Employee Salary Expenses" 
          value={formatCurrency(stats.employeeSalaries || 0)} 
          icon={UserCheck}
          description="Salaries paid to active employees"
        />
        <StatCard 
          title="Operational Costs" 
          value={formatCurrency(stats.operationalCosts || 0)} 
          icon={Clock}
          description="Rent, utilities, marketing & ingredients"
        />
      </div>

      {/* Replaces the Removed technical section with business intelligence content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: AI Inventory Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Operations Digest</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold">Live AI</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-3.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground font-bold block mb-1">TODAY'S SUMMARY</span>
                <p className="text-xs text-foreground leading-relaxed">
                  We completed <strong className="text-emerald-500">{stats.completedOrders} orders</strong> today. 
                  Top performing item was <strong className="text-foreground">{aiReport?.topItem || "Chicken Biryani"}</strong>. 
                  Kitchen operates with <strong className="text-emerald-500">{stats.kitchenEfficiency}% efficiency</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground font-bold block mb-1">PURCHASING ACTION</span>
                <p className="text-xs text-foreground leading-relaxed">
                  {aiReport?.recommendedPurchase ? (
                    <span>Procurement recommended: <strong className="text-amber-500">{aiReport.recommendedPurchase}</strong>.</span>
                  ) : (
                    <span>All item stocks are within safe margins. No purchasing action needed.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <Link href="/ai-assistant" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-6">
            View full AI insights <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </motion.div>

        {/* Card 2: Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Low Stock alerts</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>

            <div className="space-y-3">
              {lowStockAlerts.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-muted-foreground">All ingredient levels healthy</span>
                  <span className="text-[10px] text-emerald-500 mt-1">Health Score: {stats.inventoryHealth}%</span>
                </div>
              ) : (
                lowStockAlerts.slice(0, 3).map((item: any) => (
                  <div key={item.name} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                    <span className="text-xs font-bold text-foreground">{item.name}</span>
                    <div className="text-right">
                      <span className="text-xs text-rose-500 font-bold block">{item.quantity} {item.unit}</span>
                      <span className="text-[10px] text-muted-foreground block">Min: {item.min} {item.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <Link href="/inventory" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-6">
            Go to inventory catalog <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </motion.div>

        {/* Card 3: Today's Operations Snapshot & Staff */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kitchen Staff & Shift</span>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl text-xs">
                <span className="text-muted-foreground">Total Staff on Duty</span>
                <span className="font-bold text-foreground">{stats.staffOnDutyCount} Active</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl text-xs">
                <span className="text-muted-foreground">Tandoor Status</span>
                <span className="text-emerald-500 font-bold">Online</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl text-xs">
                <span className="text-muted-foreground">Gravy Station</span>
                <span className="text-emerald-500 font-bold">Online</span>
              </div>
            </div>
          </div>
          <Link href="/attendance" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-6">
            View attendance roster <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </motion.div>
      </div>

      {/* Main Charts & History section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 glow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Revenue Trends</h3>
              <p className="text-xs text-muted-foreground">7-Day operational revenue compared to expenses</p>
            </div>
            <Link href="/analytics" className="text-xs text-emerald-500 font-semibold hover:underline">
              View Analytics
            </Link>
          </div>

          <div className="h-72 w-full">
            {analytics?.revenueTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No chart data available</div>
            )}
          </div>
        </div>

        {/* Live Active Staff list */}
        <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Staff on Duty</h3>
              <p className="text-xs text-muted-foreground">Currently clocked-in team members</p>
            </div>
            <Link href="/staff" className="text-xs text-emerald-500 font-semibold hover:underline">
              Manage Staff
            </Link>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {staffOnDuty.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-12">No staff clocked in today</p>
            ) : (
              staffOnDuty.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs capitalize">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{s.role}</span>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-foreground">Recent Orders</h3>
            <p className="text-xs text-muted-foreground">Monitor live and completed client checkout lines</p>
          </div>
          <Link href="/orders" className="text-xs text-emerald-500 font-semibold hover:underline">
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold">
                <th className="pb-3 pr-2">Order ID</th>
                <th className="pb-3 px-2">Customer</th>
                <th className="pb-3 px-2">Date/Time</th>
                <th className="pb-3 px-2">Amount</th>
                <th className="pb-3 px-2">Priority</th>
                <th className="pb-3 pl-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No orders logged</td>
                </tr>
              ) : (
                recentOrders.map((o: any) => (
                  <tr key={o.id} className="border-b border-border hover:bg-muted/50 text-foreground">
                    <td className="py-3 pr-2 font-mono font-bold text-foreground">{o.order_number}</td>
                    <td className="py-3 px-2 font-medium">{o.customer_name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{formatTime(o.order_date)}</td>
                    <td className="py-3 px-2 font-bold text-emerald-500">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3 px-2">
                      <span className={`text-[10px] font-bold ${o.priority === 'High' ? 'text-rose-500' : 'text-muted-foreground'}`}>
                        {o.priority}
                      </span>
                    </td>
                    <td className="py-3 pl-2">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Deliveries Section */}
      <div className="bg-card border border-border rounded-2xl p-6 glow-sm mt-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-500" /> Recent Deliveries
            </h3>
            <p className="text-xs text-muted-foreground">Track recently completed courier delivery runs</p>
          </div>
          <Link href="/delivery" className="text-xs text-emerald-500 font-semibold hover:underline">
            View Delivery Desk
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.recentDeliveries?.length === 0 ? (
            <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground text-xs">
              No recent deliveries completed today
            </div>
          ) : (
            (data.recentDeliveries || []).map((delivery: any) => {
              const formattedOrderNum = delivery.order_number.includes('-') 
                ? delivery.order_number.split('-').pop() 
                : delivery.order_number;
              return (
                <div key={delivery.id} className="bg-background border border-border rounded-xl p-5 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center pb-2.5 border-b border-border">
                    <span className="text-xs font-black text-foreground">Order #{formattedOrderNum}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {delivery.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-muted-foreground">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Driver</span>
                      <span className="font-bold text-foreground block truncate">{delivery.driver_name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Employee ID</span>
                      <span className="font-mono text-muted-foreground block">{delivery.employee_id}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Phone</span>
                      <span className="text-foreground block">{delivery.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Vehicle Details</span>
                      <span className="text-muted-foreground block truncate font-mono">{delivery.vehicle_number} ({delivery.vehicle_type})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Duration</span>
                      <span className="text-emerald-500 font-extrabold block">{delivery.duration}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Pickup</span>
                      <span className="text-muted-foreground block">{formatTime(delivery.pickup_time)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-muted-foreground uppercase block font-semibold">Delivered Time</span>
                      <span className="text-muted-foreground block">{formatTime(delivery.delivered_time)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={2} 
      stroke="currentColor" 
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
