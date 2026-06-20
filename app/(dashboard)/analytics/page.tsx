"use client";

import { useEffect, useState } from "react";
import { getAnalyticsData } from "@/actions/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { StatCard } from "@/components/shared/stat-card";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingBag, Clock } from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAnalyticsData();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Business Analytics" description="Loading chart datasets..." />
        <TableSkeleton />
      </div>
    );
  }

  const { metrics, revenueTrend, categoryData, topSellingItems, peakHours, attendanceStats } = data;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Business Analytics" 
        description="Comprehensive reports on profits, sales trends, peak kitchen rush hours, and staff rates."
        category="Finance & Operations Reports"
      />

      {/* KPI metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Gross Revenue" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={DollarSign}
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(metrics.totalExpenses)} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(metrics.profit)} 
          icon={DollarSign}
          className="border-emerald-500/10"
        />
        <StatCard 
          title="Orders Completed" 
          value={metrics.completedCount} 
          icon={ShoppingBag}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue vs Expenses area chart */}
        <ChartCard 
          title="Revenue vs Expenses Trend" 
          description="Comparison of daily cash ins versus raw stock procurement and overheads"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Gross Revenue" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Peak order hours bar chart */}
        <ChartCard 
          title="Hourly Operations Workload" 
          description="Order volume distribution based on customer checkouts"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours.slice(8, 22)}> {/* focus on business hours 8 AM - 10 PM */}
              <XAxis dataKey="hour" stroke="#52525b" fontSize={10} tickLine={false} />
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
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Orders Received" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Share & Top Selling Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
          
          {/* Top Selling Items (Bar Chart) */}
          <ChartCard 
            title="Top Selling Menu Items" 
            description="Top grossing foods ranked by volume"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellingItems} layout="vertical">
                <XAxis type="number" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={11} tickLine={false} width={100} />
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
                <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} name="Sales Volume" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Category Share (Pie Chart) */}
          <ChartCard 
            title="Menu Category distribution" 
            description="Contribution of food groups to gross billing"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
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
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

      </div>
    </div>
  );
}
