"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnalyticsData } from "@/actions/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { StatCard } from "@/components/shared/stat-card";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { PeriodSelector } from "@/components/shared/period-selector";
import { formatCurrency } from "@/lib/utils";
import { 
  DollarSign, TrendingUp, ShoppingBag, Clock, 
  Truck, Users, ClipboardList, Wallet, BarChart2 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"];
const TABS = [
  { id: "financials", name: "Financials", icon: DollarSign },
  { id: "operations", name: "Operations", icon: BarChart2 },
  { id: "logistics", name: "Logistics & Delivery", icon: Truck },
  { id: "staffing", name: "Staff & Roster", icon: Users }
];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("financials");

  // Filters State
  const [period, setPeriod] = useState("Last 7 Days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsData(period, customStart, customEnd);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle preset selector changes
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== "Custom") {
      setCustomStart("");
      setCustomEnd("");
    } else {
      // Initialize custom ranges to 30 days ago to today
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setCustomStart(thirtyDaysAgo.toISOString().split("T")[0]);
      setCustomEnd(today.toISOString().split("T")[0]);
    }
  };

  const tooltipStyle = {
    contentStyle: { 
      backgroundColor: "hsl(var(--popover))", 
      borderColor: "hsl(var(--border))",
      borderRadius: "var(--radius)",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)"
    },
    labelStyle: { color: "hsl(var(--popover-foreground))", fontWeight: "bold" },
    itemStyle: { color: "hsl(var(--popover-foreground))" }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Business Analytics" 
        description="Comprehensive reports on profits, sales trends, peak kitchen rush hours, and staff rates."
        category="Finance & Operations Reports"
      />

      {/* Date Filters Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Filter Period:</span>
          <PeriodSelector
            selectedPeriod={period}
            onPeriodChange={handlePeriodChange}
            customStart={customStart}
            onCustomStartChange={setCustomStart}
            customEnd={customEnd}
            onCustomEndChange={setCustomEnd}
            className="flex-1 md:flex-initial"
          />
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-6">
          <TableSkeleton />
        </div>
      ) : (
        <>
          {/* KPI metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="Total Gross Revenue" 
              value={formatCurrency(data.metrics.totalRevenue)} 
              icon={DollarSign}
            />
            <StatCard 
              title="Total Expenses" 
              value={formatCurrency(data.metrics.totalExpenses)} 
              icon={TrendingUp}
            />
            <StatCard 
              title="Net Profit" 
              value={formatCurrency(data.metrics.profit)} 
              icon={DollarSign}
              className={data.metrics.profit >= 0 ? "border-emerald-500/10 text-emerald-500" : "border-rose-500/10 text-rose-500"}
            />
            <StatCard 
              title="Orders Completed" 
              value={data.metrics.completedCount} 
              icon={ShoppingBag}
            />
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-border flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-emerald-500 text-emerald-500 font-extrabold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Render Tab Contents */}
          <div className="space-y-6">
            
            {/* 1. FINANCIALS TAB */}
            {activeTab === "financials" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Expenses vs Net Profit Area Chart */}
                <ChartCard 
                  title="Revenue vs Expenses & Profit Trend" 
                  description="Detailed breakdown of income, raw stock spending, operational overheads, and net margins"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrend}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} formatter={(val) => formatCurrency(Number(val))} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Gross Revenue" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} name="Expenses" />
                      <Area type="monotone" dataKey="profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProf)" strokeWidth={2} name="Net Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Payroll Disbursement Trend */}
                <ChartCard 
                  title="Payroll & Staff Compensation" 
                  description="Monthly/daily payroll runs representing wages and salaries paid out to active crew"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueTrend}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} formatter={(val) => formatCurrency(Number(val))} />
                      <Bar dataKey="payroll" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Payroll Costs" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Expenses by Category Share */}
                <ChartCard 
                  title="Operational Expense Allocation" 
                  description="Breakdown of running costs across key catalog categories"
                  className="lg:col-span-2"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} formatter={(val) => formatCurrency(Number(val))} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* 2. OPERATIONS TAB */}
            {activeTab === "operations" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Volume Trend */}
                <ChartCard 
                  title="Order Volume Trends" 
                  description="Total volume of customer checkout orders completed over time"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueTrend}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Orders Checkout" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Hourly Operations Workload */}
                <ChartCard 
                  title="Peak Hour Operations Workload" 
                  description="Checkout frequency sorted hourly (active checkout rush hours)"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.peakHours.slice(8, 22)}> {/* Peak operational hours focus */}
                      <XAxis dataKey="hour" stroke="#52525b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tickets Placed" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Top Selling Menu Items */}
                <ChartCard 
                  title="Top Selling Menu Items" 
                  description="Top grossing foods ranked by checkout portion volumes"
                  className="lg:col-span-2"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topSellingItems} layout="vertical">
                      <XAxis type="number" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={11} tickLine={false} width={120} />
                      <Tooltip {...tooltipStyle} formatter={(val) => formatCurrency(Number(val))} />
                      <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} name="Sales Volume (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* 3. LOGISTICS & DELIVERY TAB */}
            {activeTab === "logistics" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delivery Analytics: average courier time & completed runs */}
                <ChartCard 
                  title="Courier Delivery Duration Analytics" 
                  description="Average delivery duration in minutes for completed courier runs"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.revenueTrend}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                      <Line type="monotone" dataKey="deliveryTime" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} name="Avg Trip Duration (Mins)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Supplier Logistics performance */}
                <ChartCard 
                  title="Supplier Deliveries Success Rate" 
                  description="Daily supplier deliveries completed successfully"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.revenueTrend}>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="supplierDeliveries" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Deliveries" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Raw Ingredient Consumption */}
                <ChartCard 
                  title="Inventory Usage (Consumption Volume)" 
                  description="Ingredient OUT volumes deducted from stock based on recipe execution mapping"
                  className="lg:col-span-2"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.revenueTrend}>
                      <defs>
                        <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                      <Area type="monotone" dataKey="inventoryUsage" stroke="#ec4899" fillOpacity={1} fill="url(#colorInv)" strokeWidth={2} name="Ingredients Used (Units)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* 4. STAFF & ROSTER TAB */}
            {activeTab === "staffing" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staff Attendance rate over time */}
                <ChartCard 
                  title="Daily Roster Check-In Rate" 
                  description="Number of team members clocked in on shift daily"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrend}>
                      <defs>
                        <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                      <Tooltip {...tooltipStyle} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                      <Area type="monotone" dataKey="attendance" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" strokeWidth={2} name="Clocked-In Staff" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Staff Attendance rates by member */}
                <ChartCard 
                  title="Staff Attendance rate by Member" 
                  description="Aggregated attendance rate (%) for each crew member"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.attendanceStats} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} stroke="#52525b" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={11} tickLine={false} width={120} />
                      <Tooltip {...tooltipStyle} formatter={(val) => `${val}%`} />
                      <Bar dataKey="attendanceRate" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Attendance Success" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}
