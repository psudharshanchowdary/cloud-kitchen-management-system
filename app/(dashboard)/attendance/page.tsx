"use client";

import { useEffect, useState, useCallback } from "react";
import { getAttendanceReport } from "@/actions/attendance";
import { getStaffList } from "@/actions/staff";
import { getAnalyticsData } from "@/actions/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartCard } from "@/components/shared/chart-card";
import { PeriodSelector } from "@/components/shared/period-selector";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/utils";
import { Search, Calendar, Clock, RefreshCw, UserCheck, X } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  // Period filter state
  const [period, setPeriod] = useState("Last 7 Days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, staffList, analyticsRes] = await Promise.all([
        getAttendanceReport(period, customStart, customEnd),
        getStaffList(),
        getAnalyticsData(period, customStart, customEnd)
      ]);
      setRecords(list);
      setStaff(staffList);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRecords = records.filter(r => {
    const matchesDate = r.date === filterDate;
    const matchesSearch = r.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Calculate statistics for the selected date
  const presentCount = filteredRecords.filter(r => r.status === "Present" || r.status === "Late").length;
  const lateCount = filteredRecords.filter(r => r.status === "Late").length;
  const absentCount = staff.length - presentCount;

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Attendance System" 
        description="Verify daily check-in logs, track late arrivals, and check staff working hours."
        category="Team Management"
        actions={
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground rounded-lg text-xs transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload Roster
          </button>
        }
      />

      {/* Date Filters Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-sm">
        <PeriodSelector
          selectedPeriod={period}
          onPeriodChange={(newPeriod) => {
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
          }}
          customStart={customStart}
          onCustomStartChange={setCustomStart}
          customEnd={customEnd}
          onCustomEndChange={setCustomEnd}
        />
      </div>

      {/* Roster KPI Summary widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Crew size</span>
            <span className="text-xl font-bold text-foreground block mt-0.5">{staff.length} Members</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Present Today</span>
            <span className="text-xl font-bold text-emerald-500 block mt-0.5">{presentCount} Active</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Late Arrivals</span>
            <span className="text-xl font-bold text-orange-500 block mt-0.5">{lateCount} Delayed</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <X className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Absents/Off duty</span>
            <span className="text-xl font-bold text-rose-500 block mt-0.5">{absentCount < 0 ? 0 : absentCount} Off</span>
          </div>
        </div>
      </div>

      {/* Attendance Chart Section */}
      {analytics && (
        <ChartCard 
          title="Daily Roster Check-In Rate (Staff Attendance)" 
          description="Total crew members present or late across the selected period"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueTrend}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
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
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="attendance" stroke="#10b981" fillOpacity={1} fill="url(#colorAttendance)" strokeWidth={2} name="Staff Present (Count)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Date Filter & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by worker name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <TableSkeleton />
      ) : filteredRecords.length === 0 ? (
        <EmptyState 
          title="No Attendance Logs Found" 
          description={`No clock-in actions registered for ${formatDate(filterDate)}. Ensure staff check-in from their header portals.`}
          icon={Clock}
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold bg-card/50">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Check-In Time</th>
                  <th className="p-4">Check-Out Time</th>
                  <th className="p-4">Hours Mapped</th>
                  <th className="p-4 text-right">Roster Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-muted/50 text-foreground transition-colors">
                    <td className="p-4 font-bold text-foreground">{r.staff_name}</td>
                    <td className="p-4 text-muted-foreground capitalize">{r.role.toLowerCase()}</td>
                    <td className="p-4 text-muted-foreground">
                      <span className="font-semibold">{r.clock_in}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <span>{r.clock_out || "Still Active"}</span>
                    </td>
                    <td className="p-4 font-bold text-emerald-500">
                      {r.working_hours ? `${r.working_hours} hrs` : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
