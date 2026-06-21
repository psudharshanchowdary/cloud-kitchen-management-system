"use client";

import { useEffect, useState, useCallback } from "react";
import { getDeliveryDashboardData } from "@/actions/delivery";
import { getAnalyticsData } from "@/actions/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PeriodSelector } from "@/components/shared/period-selector";
import { Truck, Clock, Sparkles, UserCheck, AlertTriangle, RefreshCw, Phone } from "lucide-react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend 
} from "recharts";

export default function DeliveryPage() {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Period Filter State
  const [period, setPeriod] = useState("Last 7 Days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        getDeliveryDashboardData(period, customStart, customEnd),
        getAnalyticsData(period, customStart, customEnd)
      ]);
      setData(dashRes);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load delivery metrics");
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== "Custom") {
      setCustomStart("");
      setCustomEnd("");
    } else {
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

  if (loading || !data || !analytics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Delivery Operations" description="Loading courier analytics..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const {
    totalDeliveries,
    delayedDeliveries,
    averageDeliveryTime,
    fastestDriver,
    driverAvailability,
    rankings
  } = data;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Delivery Operations" 
        description="Monitor driver performance rankings, delivery durations, live driver availability, and logistics."
        category="Logistics & Dispatch"
        actions={
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Metrics
          </button>
        }
      />

      {/* Date Filters Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-sm">
        <PeriodSelector
          selectedPeriod={period}
          onPeriodChange={handlePeriodChange}
          customStart={customStart}
          onCustomStartChange={setCustomStart}
          customEnd={customEnd}
          onCustomEndChange={setCustomEnd}
        />
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Deliveries" 
          value={totalDeliveries} 
          icon={Truck}
          description="Total completed runs"
        />
        <StatCard 
          title="Average Time" 
          value={averageDeliveryTime} 
          icon={Clock}
          description="Avg duration per delivery"
        />
        <StatCard 
          title="Fastest Driver" 
          value={fastestDriver} 
          icon={Sparkles}
          description="Driver with lowest avg time"
        />
        <StatCard 
          title="Driver Availability" 
          value={driverAvailability} 
          icon={UserCheck}
          description="Available vs Total drivers"
        />
        <StatCard 
          title="Delayed Deliveries" 
          value={delayedDeliveries} 
          icon={AlertTriangle}
          description="Completed > 30 mins"
          trend={delayedDeliveries > 0 ? { value: delayedDeliveries, isPositive: false } : undefined}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Durations Trend */}
        <ChartCard 
          title="Courier Delivery Duration Trend" 
          description="Average delivery duration in minutes for completed courier runs"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.revenueTrend}>
              <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="deliveryTime" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} name="Avg Trip Duration (Mins)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Trips volume trend */}
        <ChartCard 
          title="Completed Delivery Trips" 
          description="Volume of completed order delivery trips over time"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.revenueTrend}>
              <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Deliveries" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Driver Performance Ranking Table */}
      <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
        <div className="mb-6">
          <h3 className="text-base font-bold text-foreground">Driver Performance Ranking</h3>
          <p className="text-xs text-muted-foreground font-medium mt-1">Drivers sorted by completed runs (highest) and average duration (lowest)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold bg-muted/30">
                <th className="p-3 w-16">Rank</th>
                <th className="p-3">Driver Details</th>
                <th className="p-3">Vehicle Details</th>
                <th className="p-3 text-center">Completed Deliveries</th>
                <th className="p-3 text-center">Delayed Deliveries</th>
                <th className="p-3 text-center">Avg Duration</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">No driver profiles registered</td>
                </tr>
              ) : (
                rankings.map((r: any, index: number) => {
                  const rankNumber = index + 1;
                  let badgeColor = "bg-muted text-muted-foreground border border-border";
                  if (rankNumber === 1) badgeColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                  else if (rankNumber === 2) badgeColor = "bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20";
                  else if (rankNumber === 3) badgeColor = "bg-amber-700/10 text-amber-600 border border-amber-700/20";

                  return (
                    <tr key={r.id} className="border-b border-border hover:bg-muted/50 text-foreground transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black inline-block ${badgeColor}`}>
                          #{rankNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-bold text-foreground block text-sm">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">Employee ID: {r.employee_id}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-semibold">
                            <Phone className="h-2.5 w-2.5 text-muted-foreground" /> {r.phone}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-bold text-foreground block font-mono">{r.vehicle}</span>
                          <span className="text-[10px] text-muted-foreground block">{r.vehicle_type}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-foreground">
                        {r.completedCount}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${r.delayedCount > 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                          {r.delayedCount}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-500 font-mono">
                        {r.completedCount > 0 ? `${r.avgDuration} Minutes` : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Available' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : r.status === 'On Delivery' 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {r.status || "Available"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
