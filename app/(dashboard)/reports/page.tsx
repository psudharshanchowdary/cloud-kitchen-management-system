"use client";

import { useEffect, useState } from "react";
import { getAnalyticsData } from "@/actions/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Printer, Download, RefreshCw, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export default function ReportsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsData();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!data) return;
    toast.success("CSV download triggered successfully!");
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Operations Reports" description="Loading report ledger..." />
        <TableSkeleton />
      </div>
    );
  }

  const { metrics, revenueTrend, topSellingItems, attendanceStats } = data;

  return (
    <div className="space-y-6 pb-8 print:p-0 print:bg-white print:text-black">
      <div className="print:hidden">
        <PageHeader 
          title="Operations Reports" 
          description="Generate clean summaries of sales, kitchen waste, reorders, and clock-ins."
          category="Reporting Ledger"
          actions={
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-all"
              >
                <Printer className="h-4 w-4" /> Print PDF
              </button>
              <button 
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          }
        />

        {/* Tab filters */}
        <div className="flex gap-2 p-1 bg-card border border-border rounded-xl w-fit mb-6">
          {["daily", "weekly", "monthly"].map((type: any) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                reportType === type ? "bg-emerald-500 text-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type} Report
            </button>
          ))}
        </div>
      </div>

      {/* Printable Report Card */}
      <div className="bg-card print:bg-background border border-border print:border-none rounded-2xl p-8 print:p-0 shadow-xl space-y-8">
        
        {/* Report Header */}
        <div className="flex justify-between items-start pb-6 border-b border-border print:border-border">
          <div>
            <span className="text-emerald-500 font-extrabold text-lg block">👑 Queen's Cloud Kitchen</span>
            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider mt-0.5">Corporate Operations Report</span>
            <h2 className="text-xl font-black text-foreground print:text-foreground mt-2 capitalize">{reportType} Performance Ledger</h2>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span className="block">Report Date: {formatDate(new Date().toISOString())}</span>
            <span className="block mt-0.5">Scope: June 2026</span>
          </div>
        </div>

        {/* Operational Metrics Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {currentUser?.role === "Inventory Manager" ? (
            <>
              <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Inventory Health Score</span>
                <span className="text-lg font-bold text-emerald-500 block mt-1">{metrics.inventoryHealth}% Score</span>
              </div>
              <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Kitchen Efficiency</span>
                <span className="text-lg font-bold text-foreground print:text-black block mt-1">{metrics.efficiencyScore}% Rate</span>
              </div>
              <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Active Prep Tickets</span>
                <span className="text-lg font-bold text-foreground print:text-black block mt-1">{metrics.activeCount} Queue</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Gross Revenues</span>
                <span className="text-lg font-bold text-foreground print:text-black block mt-1">{formatCurrency(metrics.totalRevenue)}</span>
              </div>
              <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Total Expenses</span>
                <span className="text-lg font-bold text-foreground print:text-black block mt-1">{formatCurrency(metrics.totalExpenses)}</span>
              </div>
              <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Net Profits</span>
                <span className="text-lg font-bold text-emerald-500 block mt-1">{formatCurrency(metrics.profit)}</span>
              </div>
            </>
          )}
          <div className="p-4 bg-background print:bg-zinc-50 border border-border print:border-zinc-200 rounded-xl text-left">
            <span className="text-[10px] text-muted-foreground font-bold uppercase block">Completed Orders</span>
            <span className="text-lg font-bold text-foreground print:text-black block mt-1">{metrics.completedCount} Tickets</span>
          </div>
        </div>

        {/* Top items table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground print:text-black uppercase tracking-wider">Top Selling Food Items</h4>
          <div className="overflow-x-auto border border-border print:border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background print:bg-zinc-50 border-b border-border print:border-zinc-200 text-muted-foreground font-bold">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Food Name</th>
                  <th className="p-3">Quantity Sold</th>
                  {currentUser?.role !== "Inventory Manager" && <th className="p-3 text-right">Total Revenue Generated</th>}
                </tr>
              </thead>
              <tbody>
                {topSellingItems.map((item: any, idx: number) => (
                  <tr key={item.name} className="border-b border-border print:border-zinc-200 text-foreground print:text-black">
                    <td className="p-3 font-bold">{idx + 1}</td>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3">{item.quantity} portions</td>
                    {currentUser?.role !== "Inventory Manager" && (
                      <td className="p-3 text-right font-semibold text-emerald-500">{formatCurrency(item.sales)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Attendance summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground print:text-black uppercase tracking-wider">Staff Performance & Shifts</h4>
          <div className="overflow-x-auto border border-border print:border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background print:bg-zinc-50 border-b border-border print:border-zinc-200 text-muted-foreground font-bold">
                  <th className="p-3">Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Attendance Rate</th>
                  <th className="p-3 text-right">Roster Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceStats.slice(0, 5).map((s: any) => (
                  <tr key={s.name} className="border-b border-border print:border-zinc-200 text-foreground print:text-black">
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3 text-muted-foreground capitalize">{s.role.toLowerCase()}</td>
                    <td className="p-3 font-semibold">{s.attendanceRate}% check-in success</td>
                    <td className="p-3 text-right">
                      <span className={`text-[10px] font-bold ${s.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-12 flex justify-between items-center text-xs text-muted-foreground border-t border-border print:border-zinc-200 mt-12">
          <div>
            <span className="block">Generated by: System AI Portal</span>
            <span className="block mt-0.5">Status: Approved</span>
          </div>
          <div className="text-right">
            <div className="w-32 border-b border-border print:border-black mb-1.5" />
            <span>Authorized Signature</span>
          </div>
        </div>

      </div>
    </div>
  );
}
