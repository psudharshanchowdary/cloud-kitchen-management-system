"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/actions/dashboard";
import { getAnalyticsData } from "@/actions/analytics";
import { getDailySummaryReport } from "@/actions/ai-assistant";
import { getSupplierDeliveriesList } from "@/actions/supplier-logistics";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { 
  TrendingUp, DollarSign, ShoppingBag, Clock, ShieldAlert, 
  ChefHat, Sparkles, AlertTriangle, UserCheck, Package, FileText, Box, Truck,
  CheckSquare, Check, HelpCircle
} from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import Link from "next/link";

import { getRecipeCalculatorData } from "@/actions/menu";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [calculatorData, setCalculatorData] = useState<any>({ items: [], mappings: [], inventory: [] });
  const [supplierDeliveries, setSupplierDeliveries] = useState<any[]>([]);
  const [selectedItemForCalc, setSelectedItemForCalc] = useState<string>("");
  const [simulatedPrice, setSimulatedPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, analyticsRes, aiRes, calcRes, supplierDeliveriesRes] = await Promise.all([
          getDashboardData(),
          getAnalyticsData(),
          getDailySummaryReport(),
          getRecipeCalculatorData().catch(() => ({ items: [], mappings: [], inventory: [] })),
          getSupplierDeliveriesList().catch(() => [])
        ]);
        setData(dashRes);
        setAnalytics(analyticsRes);
        setAiReport(aiRes);
        setCalculatorData(calcRes);
        setSupplierDeliveries(supplierDeliveriesRes);
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
        <PageHeader title="Today's Kitchen Overview" description="Getting live kitchen logs..." />
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

  // Calculate greeting based on local time
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good Morning" : greetingHour < 17 ? "Good Afternoon" : "Good Evening";

  // Calculate active deliveries count
  const deliveriesInProgress = (data.driverSummaries || []).reduce((sum: number, d: any) => sum + (d.activeCount || 0), 0);

  // 1. OPERATIONS MANAGER DASHBOARD
  if (user.role === "Operations Manager") {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Today's Kitchen overview" 
          description="Operational metrics, delivery operations, inventory reserves, and active team members."
          category="Manager Desk"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Today's Revenue" 
            value={formatCurrency(stats.todayRevenue || 0)} 
            icon={DollarSign}
            description="Total cash & UPI sales today"
          />
          <StatCard 
            title="This Month vs Last Month" 
            value={formatCurrency(stats.monthlyRevenue || 0)} 
            icon={TrendingUp}
            description="Month-to-date total sales"
          />
          <StatCard 
            title="Active Orders" 
            value={stats.activeOrdersCount || 0} 
            icon={ShoppingBag}
            description="Orders in cooking or packing queue"
          />
          <StatCard 
            title="Staff Working" 
            value={stats.staffOnDutyCount || 0} 
            icon={UserCheck}
            description="Clocked-in team members right now"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Trends */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <h3 className="text-base font-bold text-foreground mb-2">Today's Revenue Trends</h3>
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
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))", 
                          borderColor: "hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)"
                        }}
                        labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: "bold" }}
                        itemStyle={{ color: "hsl(var(--popover-foreground))" }}
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
              <h3 className="text-base font-bold text-foreground mb-4">Live Kitchen Queue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold">
                      <th className="pb-3 pr-2">Order Number</th>
                      <th className="pb-3 px-2">Customer</th>
                      <th className="pb-3 px-2">Food Total</th>
                      <th className="pb-3 pl-2">Progress Status</th>
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Stock Running Low</span>
              <div className="space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">All pantry stocks healthy</div>
                ) : (
                  lowStockAlerts.slice(0, 3).map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                      <span className="text-xs font-bold text-foreground">{item.name}</span>
                      <span className="text-xs text-rose-500 font-bold">{item.quantity} {item.unit} remaining</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Staff on shift */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Team Members Working</span>
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
                <Truck className="h-5 w-5 text-emerald-500" /> Courier Status & Active Trips
              </h3>
              <p className="text-xs text-muted-foreground">Track delivery driver availability, active courier runs, and delays</p>
            </div>
            <Link href="/delivery" className="text-xs text-emerald-500 font-semibold hover:underline">
              Delivery Operations
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold bg-card/50">
                  <th className="p-3">Courier Name</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3 text-center">Active Deliveries</th>
                  <th className="p-3 text-center">Completed Today</th>
                  <th className="p-3 text-center">Delayed Trips</th>
                  <th className="p-3 text-right">Duty Status</th>
                </tr>
              </thead>
              <tbody>
                {data.driverSummaries?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">No drivers on shift</td>
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
    // Identify waiting orders and preparing orders
    const ordersWaitingCount = recentOrders.filter((o: any) => o.status === "Pending" || o.status === "Accepted").length;
    const ordersPreparingCount = recentOrders.filter((o: any) => o.status === "Preparing").length;
    
    // Clocked-in chefs and kitchen assistants
    const activeKitchenCrew = staffOnDuty.filter((s: any) => ["Head Chef", "Chef", "Kitchen Assistant"].includes(s.role));

    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Kitchen Command Center" 
          description="Roster monitoring, queue tracking, and station workload control."
          category="Head Chef Control Room"
        />

        {/* Focus on: waiting, preparing, delayed, available crew, shortages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard 
            title="Orders Waiting" 
            value={ordersWaitingCount} 
            icon={ShoppingBag}
            description="Tickets waiting to cook"
          />
          <StatCard 
            title="Preparing Now" 
            value={ordersPreparingCount} 
            icon={ChefHat}
            description="Active dishes on burners"
          />
          <StatCard 
            title="Delayed Dishes" 
            value={stats.delayedCount || 0} 
            icon={Clock}
            className={stats.delayedCount > 0 ? "border-rose-500/30 glow-sm" : ""}
            description="Exceeded 40 mins prep time"
          />
          <StatCard 
            title="Kitchen Crew Active" 
            value={activeKitchenCrew.length} 
            icon={UserCheck}
            description="Chefs & assistants on shift"
          />
          <StatCard 
            title="Pantry Shortages" 
            value={lowStockAlerts.length} 
            icon={AlertTriangle}
            className={lowStockAlerts.length > 0 ? "border-amber-500/30" : ""}
            description="Ingredients running low"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Live active queue */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <h3 className="text-base font-bold text-foreground mb-4">Kitchen Queue Live Status</h3>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">No active orders</p>
                ) : (
                  recentOrders.map((o: any) => (
                    <div key={o.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-foreground">{o.order_number}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-card border border-border text-muted-foreground rounded-full capitalize">
                            {o.priority} Priority
                          </span>
                        </div>
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

            {/* Recipe mappings (no financial data) */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-foreground">Menu Items & Recipes</h3>
                <Link href="/menu" className="text-xs font-bold text-emerald-500 hover:underline">
                  Recipe Builder →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const drafts = calculatorData.items.filter((m: any) => m.status === "Draft").length;
                  const pending = calculatorData.items.filter((m: any) => m.status === "Pending Approval").length;
                  const approved = calculatorData.items.filter((m: any) => m.status === "Approved").length;
                  const active = calculatorData.items.filter((m: any) => !m.status || m.status === "Active").length;
                  return (
                    <>
                      <div className="p-3 bg-background border border-border rounded-xl text-center">
                        <span className="block text-[10px] font-bold text-muted-foreground uppercase">Drafts</span>
                        <span className="text-xl font-extrabold text-foreground">{drafts}</span>
                      </div>
                      <div className="p-3 bg-background border border-border rounded-xl text-center">
                        <span className="block text-[10px] font-bold text-amber-500 uppercase">Pending</span>
                        <span className="text-xl font-extrabold text-amber-500">{pending}</span>
                      </div>
                      <div className="p-3 bg-background border border-border rounded-xl text-center">
                        <span className="block text-[10px] font-bold text-blue-500 uppercase">Approved</span>
                        <span className="text-xl font-extrabold text-blue-500">{approved}</span>
                      </div>
                      <div className="p-3 bg-background border border-border rounded-xl text-center">
                        <span className="block text-[10px] font-bold text-emerald-500 uppercase">Active</span>
                        <span className="text-xl font-extrabold text-emerald-500">{active}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold">
                      <th className="pb-3 pr-2">Food Item</th>
                      <th className="pb-3 px-2">Category</th>
                      <th className="pb-3 px-2 text-center">Ingredients Linked</th>
                      <th className="pb-3 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatorData.items.slice(0, 5).map((item: any) => {
                      const linksCount = calculatorData.mappings.filter((m: any) => m.menu_item_id === item.id).length;
                      return (
                        <tr key={item.id} className="border-b border-border hover:bg-muted/30 text-foreground">
                          <td className="py-3 pr-2 font-bold">{item.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">{item.category}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                              linksCount === 0 
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                                : "bg-muted text-foreground border border-border"
                            }`}>
                              {linksCount} ingredients
                            </span>
                          </td>
                          <td className="py-3 pl-2">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              item.status === "Draft" 
                                ? "bg-muted text-muted-foreground border-border" 
                                : item.status === "Pending Approval"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : item.status === "Approved"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            }`}>
                              {item.status || "Active"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Active chefs roster list */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Available Chefs on Shift</span>
              <div className="space-y-3">
                {activeKitchenCrew.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No chefs currently clocked in</p>
                ) : (
                  activeKitchenCrew.map((crew: any) => (
                    <div key={crew.id} className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl text-xs text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] uppercase">
                          {crew.name.charAt(0)}
                        </div>
                        <span className="font-bold">{crew.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded font-bold capitalize">
                        {crew.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ingredient Shortages list */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Ingredient Shortages</span>
              <div className="space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <div className="h-24 flex flex-col items-center justify-center text-muted-foreground">
                    <Check className="h-8 w-8 text-emerald-500 mb-2 opacity-50" />
                    <span className="text-xs">No shortage alerts. All stocks healthy.</span>
                  </div>
                ) : (
                  lowStockAlerts.map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl text-xs">
                      <span className="font-bold text-foreground">{item.name}</span>
                      <span className="text-rose-500 font-bold">{item.quantity} {item.unit} left</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active station loads */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Station Workloads</span>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl">
                  <span className="text-muted-foreground">Tandoor Station</span>
                  <span className="text-emerald-500 font-bold">Online</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl">
                  <span className="text-muted-foreground">Gravy & Curry Station</span>
                  <span className="text-emerald-500 font-bold">Online</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded-xl">
                  <span className="text-muted-foreground">Rice & Biryani Dum</span>
                  <span className="text-emerald-500 font-bold">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. CHEF DASHBOARD
  if (user.role === "Chef") {
    // Filters order queue specifically for the chef station
    const activeChefOrders = recentOrders.filter(
      (o: any) => ["Pending", "Accepted", "Preparing", "Ready"].includes(o.status)
    );
    const nextOrder = activeChefOrders.find((o: any) => o.status === "Pending" || o.status === "Accepted");
    const preparingNow = activeChefOrders.filter((o: any) => o.status === "Preparing");
    const readyToServe = activeChefOrders.filter((o: any) => o.status === "Ready");

    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="My Cooking Station" 
          description="Prepare assigned dishes, update order statuses, and monitor your station roster."
          category="Chef Station"
        />

        {/* Operational Task Board Grid (No analytics cards or metrics) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Next Order / Waiting Queue */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Up Next in Queue</span>
              <span className="text-xs px-2 py-0.5 bg-muted border border-border text-muted-foreground rounded-full font-bold">
                {activeChefOrders.filter((o: any) => o.status === "Pending" || o.status === "Accepted").length} tickets
              </span>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
              {nextOrder ? (
                <div key={nextOrder.id} className="p-4 bg-background border border-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-foreground">{nextOrder.order_number}</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-extrabold capitalize">
                      {nextOrder.priority} Priority
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    {(nextOrder.items || []).map((i: any) => (
                      <div key={i.menu_item_name} className="flex justify-between text-foreground">
                        <span className="font-semibold">{i.menu_item_name}</span>
                        <span className="text-muted-foreground">Qty: {i.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border/50 flex justify-end">
                    <Link href="/kitchen" className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] rounded-lg shadow-md transition-all active:scale-95">
                      Accept & Start Cooking
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mb-2 opacity-30 text-emerald-500" />
                  <span className="text-xs font-medium">No pending tickets in queue</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Preparing Now */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Preparing Now</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">
                {preparingNow.length} active
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
              {preparingNow.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <ChefHat className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-xs font-medium">Station is idle. Grab a ticket from queue.</span>
                </div>
              ) : (
                preparingNow.map((o: any) => (
                  <div key={o.id} className="p-4 bg-background border border-border rounded-xl space-y-3 border-l-2 border-l-amber-500">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-foreground">{o.order_number}</span>
                      <span className="text-[10px] text-amber-500 font-bold animate-pulse">Cooking...</span>
                    </div>
                    <div className="text-xs space-y-1">
                      {(o.items || []).map((i: any) => (
                        <div key={i.menu_item_name} className="flex justify-between text-foreground">
                          <span className="font-semibold">{i.menu_item_name}</span>
                          <span className="text-muted-foreground">Qty: {i.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border/50 flex justify-end">
                      <Link href="/kitchen" className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] rounded-lg shadow-md transition-all active:scale-95">
                        Mark Ready to Serve
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Ready To Serve */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Ready to Pack</span>
              <span className="text-xs px-2 py-0.5 bg-muted border border-border text-muted-foreground rounded-full font-bold">
                {readyToServe.length} completed
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
              {readyToServe.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <Box className="h-8 w-8 mb-2 opacity-30 text-emerald-500" />
                  <span className="text-xs font-medium">No dishes waiting to be packed</span>
                </div>
              ) : (
                readyToServe.map((o: any) => (
                  <div key={o.id} className="p-4 bg-background border border-border rounded-xl space-y-2 opacity-70">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-foreground">{o.order_number}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-bold">Ready</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {(o.items || []).map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(", ")}
                    </p>
                  </div>
                ))
              )}
            </div>
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
          title="Kitchen Assistant Workspace" 
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
            title="Shortages Reported" 
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
    // Filter orders ready to pack (Ready status) and waiting for courier pickup (Packed status)
    const readyToPackOrders = recentOrders.filter((o: any) => o.status === "Ready");
    const packedWaitingOrders = recentOrders.filter((o: any) => o.status === "Packed");

    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Order Packing & Courier Dispatch" 
          description="Verify order items, seal bags, print packing slips, and dispatch to courier drivers."
          category="Packing Desk"
        />

        {/* Packing & Dispatch board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Ready to Pack */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Ready to Pack</span>
              <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full font-bold">
                {readyToPackOrders.length} orders
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
              {readyToPackOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <ChefHat className="h-8 w-8 mb-2 opacity-30 text-emerald-500" />
                  <span className="text-xs">Waiting for chefs to mark items ready</span>
                </div>
              ) : (
                readyToPackOrders.map((o: any) => (
                  <div key={o.id} className="p-4 bg-background border border-border rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-foreground">{o.order_number}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{formatTime(o.order_date)}</span>
                    </div>
                    <p className="text-xs text-foreground font-bold">
                      {(o.items || []).map((i: any) => `${i.quantity}x ${i.menu_item_name}`).join(", ")}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <Link href="/packing" className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] rounded-lg shadow-md transition-all active:scale-95">
                        Start Packing
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Packed & Waiting for Driver Pickup */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Waiting for Pickup</span>
              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full font-bold">
                {packedWaitingOrders.length} orders
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
              {packedWaitingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <Box className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-xs">No sealed orders waiting for drivers</span>
                </div>
              ) : (
                packedWaitingOrders.map((o: any) => (
                  <div key={o.id} className="p-4 bg-background border border-border rounded-xl space-y-2 opacity-80 border-l-2 border-l-emerald-500">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-foreground">{o.order_number}</span>
                      <span className="text-[10px] text-emerald-500 font-bold">Sealed & Packed</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Customer: {o.customer_name}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <Link href="/packing" className="px-3.5 py-1.5 bg-muted hover:bg-accent border border-border text-foreground font-semibold text-[10px] rounded-lg shadow-md transition-all">
                        Courier Handover
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Dispatch & Courier Availability */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col min-h-[400px]">
            <div className="border-b border-border pb-3 mb-4">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Driver Arrivals</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
              {(data.driverSummaries || []).map((driver: any) => (
                <div key={driver.id} className="p-3 bg-background border border-border rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{driver.name}</span>
                    <span className="text-[9px] text-muted-foreground block font-mono">{driver.vehicle_number} ({driver.vehicle_type})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    driver.status === 'Available' 
                      ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' 
                      : driver.status === 'On Delivery' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {driver.status}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Packing Checklist */}
            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
              <span className="font-bold text-foreground block uppercase text-[10px] text-muted-foreground">Packing Checklist</span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Verify double portions of Naan/Naan baskets</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Include Biryani raita & salan cups</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. INVENTORY MANAGER DASHBOARD
  if (user.role === "Inventory Manager") {
    // Active POs
    const activePO = calculatorData.items?.length > 0 ? "1 Pending PO" : "No pending POs";

    return (
      <div className="space-y-6 pb-8">
        <PageHeader 
          title="Pantry & Supplier Operations" 
          description="Incoming deliveries, supplier trucks, safety stock logs, and active purchase orders."
          category="Warehouse Desk"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Total Stock Items" 
            value={`${calculatorData.inventory?.length || 7} Ingredients`} 
            icon={Package}
            description="Items inside dry/cold pantry"
          />
          <StatCard 
            title="Low Stock Warning" 
            value={lowStockAlerts.length} 
            icon={AlertTriangle}
            className={lowStockAlerts.length > 0 ? "border-rose-500/30 glow-sm" : ""}
            description="Ingredients below safety limits"
          />
          <StatCard 
            title="Registered Suppliers" 
            value="2 Suppliers" 
            icon={Truck}
            description="Active raw ingredient vendors"
          />
          <StatCard 
            title="Purchase Orders Active" 
            value={activePO} 
            icon={FileText}
            description="POs currently outstanding"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incoming Supplier Trucks & Drivers */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground">Incoming Supplier Deliveries</h3>
              <Link href="/supplier-logistics" className="text-xs font-semibold text-emerald-500 hover:underline">
                Supplier Deliveries Log
              </Link>
            </div>
            
            <div className="space-y-3">
              {supplierDeliveries.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No incoming supplier trucks scheduled today</p>
              ) : (
                supplierDeliveries.slice(0, 3).map((d: any) => (
                  <div key={d.id} className="p-4 bg-background border border-border rounded-xl flex justify-between items-center text-xs text-foreground">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{d.supplier_name}</span>
                        <span className="px-2 py-0.5 bg-card border border-border text-muted-foreground rounded font-mono text-[9px]">
                          {d.truck_number}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Driver: {d.driver_name} ({d.driver_phone}) | Source: {d.source_warehouse || "Koyambedu Warehouse"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'Delivered' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : d.status === 'Delayed'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {d.status}
                      </span>
                      {d.arrival_time && <span className="block text-[9px] text-muted-foreground mt-1">Arrived {formatTime(d.arrival_time)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Goods Received Log */}
            <div className="border-t border-border pt-4">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block mb-3">Goods Checked-In This Week</span>
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs text-muted-foreground pr-1">
                {supplierDeliveries.filter(d => d.status === "Delivered").slice(0, 3).flatMap((d: any, dIdx: number) => 
                  (d.products || []).map((p: any, pIdx: number) => (
                    <div key={`${d.id || dIdx}-${p.ingredient_id || p.ingredient_name || pIdx}`} className="flex justify-between items-center p-2 bg-background border border-border rounded-lg">
                      <span className="font-semibold text-foreground">{p.ingredient_name}</span>
                      <span>{p.quantity_received} {p.unit} checked in (Batch: {p.batch_number || "N/A"})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Low stock alerts */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Stock Running Low</span>
              <div className="space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">All ingredient stock levels healthy</p>
                ) : (
                  lowStockAlerts.map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center p-3 bg-background border border-border rounded-xl text-xs">
                      <span className="font-bold text-foreground">{item.name}</span>
                      <span className="text-rose-500 font-bold">{item.quantity} {item.unit} remaining</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick PO actions */}
            <div className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Pantry Replenishment</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Send purchase orders to bulk food distributors to refill safety ingredients stock levels.
                </p>
              </div>
              <Link href="/suppliers" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-center text-xs rounded-xl shadow-lg transition-all active:scale-95 block">
                Write Purchase Order
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

  // DEFAULT / OWNER (TODAY'S KITCHEN OVERVIEW)
  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title={`${greeting}, Queen Rajkumari`} 
        description="Here is what is happening in the kitchen right now."
        category="Today's Kitchen Overview"
        actions={
          <Link 
            href="/ai-assistant" 
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
          >
            <Sparkles className="h-4 w-4" /> Open Daily Kitchen Briefing
          </Link>
        }
      />

      {/* Today's Snapshot Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard 
          title="Orders Completed" 
          value={stats.completedOrders || 0} 
          icon={CheckSquare}
          description="Successfully served today"
        />
        <StatCard 
          title="Orders In Progress" 
          value={stats.activeOrdersCount || 0} 
          icon={ChefHat}
          description="Tickets currently cooking"
        />
        <StatCard 
          title="Revenue Today" 
          value={formatCurrency(stats.todayRevenue || 0)} 
          icon={DollarSign}
          description="Total cash & UPI sales today"
        />
        <StatCard 
          title="Deliveries In Progress" 
          value={deliveriesInProgress} 
          icon={Truck}
          description="Orders out on the road"
        />
        <StatCard 
          title="Staff Working" 
          value={stats.staffOnDutyCount || 0} 
          icon={UserCheck}
          description="Clocked-in team members"
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockAlerts.length} 
          icon={AlertTriangle}
          className={lowStockAlerts.length > 0 ? "border-amber-500/30" : ""}
          description="Ingredients running low"
        />
      </div>

      {/* Dedicated Q&A Box answering "What does this user need to do right now?" */}
      <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
        <h3 className="text-base font-bold text-foreground mb-4">Today's Kitchen Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-xs">
          <div className="p-4 bg-background border border-border rounded-xl space-y-2">
            <span className="font-bold text-emerald-500 block uppercase tracking-wider text-[10px]">What is happening?</span>
            <p className="text-muted-foreground leading-relaxed">
              We completed **{stats.completedOrders} orders** today. Currently, **{stats.activeOrdersCount} orders** are being prepared on the line. We have **{stats.staffOnDutyCount} team members** working.
            </p>
          </div>
          <div className="p-4 bg-background border border-border rounded-xl space-y-2">
            <span className="font-bold text-amber-500 block uppercase tracking-wider text-[10px]">What needs attention?</span>
            <p className="text-muted-foreground leading-relaxed">
              {stats.delayedCount > 0 || lowStockAlerts.length > 0 ? (
                <>
                  We have {stats.delayedCount > 0 && <span>**{stats.delayedCount} delayed dishes** in queue. </span>}
                  {lowStockAlerts.length > 0 && <span>**{lowStockAlerts.length} ingredients** are below safety level thresholds.</span>}
                </>
              ) : (
                "The kitchen is running completely on time with full pantry levels today."
              )}
            </p>
          </div>
          <div className="p-4 bg-background border border-border rounded-xl space-y-2">
            <span className="font-bold text-amber-500 block uppercase tracking-wider text-[10px]">Is anything delayed?</span>
            <p className="text-muted-foreground leading-relaxed">
              {stats.delayedCount > 0 ? (
                <span>⚠️ Yes, **{stats.delayedCount} orders** have exceeded the 40-minute prep limit. Check Curry/Tandoor stations.</span>
              ) : (
                "✅ No delays today. All stations are cooking and serving tickets on schedule."
              )}
            </p>
          </div>
          <div className="p-4 bg-background border border-border rounded-xl space-y-2">
            <span className="font-bold text-amber-500 block uppercase tracking-wider text-[10px]">Is inventory low?</span>
            <p className="text-muted-foreground leading-relaxed">
              {lowStockAlerts.length > 0 ? (
                <span>⚠️ Yes, low stock detected: **{lowStockAlerts.map((i: any) => i.name).slice(0, 3).join(", ")}**. Replenish inventory.</span>
              ) : (
                "✅ Pantry looks great. All ingredient reserves are within healthy thresholds."
              )}
            </p>
          </div>
          <div className="p-4 bg-background border border-border rounded-xl space-y-2">
            <span className="font-bold text-emerald-500 block uppercase tracking-wider text-[10px]">Are deliveries on time?</span>
            <p className="text-muted-foreground leading-relaxed">
              {(() => {
                const delayedTrips = (data.driverSummaries || []).reduce((sum: number, d: any) => sum + (d.delayedCount || 0), 0);
                return delayedTrips > 0 ? (
                  <span>⚠️ No, we have **{delayedTrips} delayed trips** en route. Deliveries operations require review.</span>
                ) : (
                  "✅ Yes, all active delivery couriers are tracking on time with zero late notifications."
                );
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Main briefing and alert logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Daily Kitchen Briefing */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 glow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Kitchen Briefing</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold">Live AI</span>
            </div>
            
            <div className="space-y-4">
              <div className="p-3.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground font-bold block mb-1">TODAY'S SUMMARY</span>
                <p className="text-xs text-foreground leading-relaxed">
                  {aiReport?.todaySummaryText || (
                    <>
                      We completed <strong className="text-emerald-500">{stats.completedOrders} orders</strong> today. 
                      Top performing item was <strong className="text-foreground">{aiReport?.topItem || "Chicken Biryani"}</strong>. 
                      Kitchen performance is operating smoothly.
                    </>
                  )}
                </p>
              </div>

              <div className="p-3.5 bg-background border border-border rounded-xl">
                <span className="text-[10px] text-muted-foreground font-bold block mb-1">PURCHASING ACTION</span>
                <p className="text-xs text-foreground leading-relaxed">
                  {aiReport?.purchasingActionText || (
                    <>
                      {aiReport?.recommendedPurchase ? (
                        <span>Procurement recommended: <strong className="text-amber-500">{aiReport.recommendedPurchase}</strong>.</span>
                      ) : (
                        <span>All item stocks are within safe margins. No purchasing action needed.</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          <Link href="/ai-assistant" className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-6">
            View full briefing page <ArrowRightIcon className="h-3 w-3" />
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
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)"
                    }}
                    labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: "bold" }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
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
              Team Members
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
            View Delivery Operations
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
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
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
