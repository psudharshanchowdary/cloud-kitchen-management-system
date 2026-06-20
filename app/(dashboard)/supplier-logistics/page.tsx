"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getSupplierLogisticsDashboardData, acceptSupplierDeliveryAction, rejectSupplierDeliveryAction, reportDeliveryIssueAction } from "@/actions/supplier-logistics";
import { PageHeader } from "@/components/shared/page-header";
import { Modal } from "@/components/shared/modal";
import { StatCard } from "@/components/shared/stat-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Truck, Package, AlertTriangle, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronUp, X, Check, Loader2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

function formatLocalTime(isoString: string) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Delivered: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
    Delayed: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Dispatched: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Rejected: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
    Pending: "bg-muted text-muted-foreground border-border",
  };
  const cls = styles[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls} whitespace-nowrap`}>{status}</span>
  );
}

export default function SupplierLogisticsPage() {
  const user = useAuthStore(s => s.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Reject modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  // Accept modal
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptProducts, setAcceptProducts] = useState<any[]>([]);
  // Report modal
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async () => {
    try {
      const res = await getSupplierLogisticsDashboardData();
      setData(res);
    } catch (err) {
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const openAccept = (delivery: any) => {
    setAcceptingId(delivery.id);
    setAcceptProducts(delivery.products.map((p: any) => ({
      ...p,
      quantity_received: p.quantity_received || p.quantity_ordered,
      status: p.status || "Good"
    })));
  };

  const handleAccept = async () => {
    if (!acceptingId) return;
    setSubmitting(true);
    try {
      await acceptSupplierDeliveryAction(acceptingId, acceptProducts);
      toast.success("Delivery accepted and inventory updated!");
      setAcceptingId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setSubmitting(true);
    try {
      await rejectSupplierDeliveryAction(rejectingId, rejectReason);
      toast.success("Delivery rejected and logged");
      setRejectingId(null);
      setRejectReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportingId || !reportNote.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    setSubmitting(true);
    try {
      await reportDeliveryIssueAction(reportingId, reportNote);
      toast.success("Issue reported successfully");
      setReportingId(null);
      setReportNote("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to report issue");
    } finally {
      setSubmitting(false);
    }
  };

  const isInventoryManager = user?.role === "Inventory Manager";
  const isOwner = user?.role === "Owner";

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Supplier Deliveries" description="Loading deliveries data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const { totalToday, totalThisWeek, delayedCount, successRate, mostUsedSupplier, supplierPerformance, allDeliveries } = data || {};

  const filtered = (allDeliveries || []).filter((d: any) => statusFilter === "all" || d.status === statusFilter);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Supplier Deliveries"
        description="Track incoming stock deliveries, supplier performance, truck dispatch records, and inventory replenishment."
        category={isInventoryManager ? "Inventory Receiving" : isOwner ? "Executive Logistics View" : "Operations Logistics"}
        actions={
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs transition-all">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard title="Deliveries Today" value={totalToday || 0} icon={Truck} description="Supplier runs today" />
        <StatCard title="Deliveries This Week" value={totalThisWeek || 0} icon={Package} description="Total this rolling week" />
        <StatCard title="Delayed Deliveries" value={delayedCount || 0} icon={AlertTriangle} description="Behind schedule" trend={delayedCount > 0 ? { value: delayedCount, isPositive: false } : undefined} />
        <StatCard title="Delivery Success Rate" value={`${successRate || 100}%`} icon={CheckCircle2} description="On-time completion rate" />
        <StatCard title="Most Used Supplier" value={mostUsedSupplier || "N/A"} icon={Truck} description="Highest frequency supplier" />
      </div>

      {/* Supplier Performance Table */}
      {isOwner && supplierPerformance?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 glow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">Supplier Performance Analytics</h3>
            <p className="text-xs text-muted-foreground mt-1">Ranked by on-time delivery success rate</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold">
                  <th className="pb-3 pr-4">Supplier</th>
                  <th className="pb-3 px-4 text-center">Total Deliveries</th>
                  <th className="pb-3 px-4 text-center">Successful</th>
                  <th className="pb-3 px-4 text-center">Success Rate</th>
                  <th className="pb-3 pl-4 text-right">Performance</th>
                </tr>
              </thead>
              <tbody>
                {supplierPerformance.map((s: any, i: number) => (
                  <tr key={s.name} className="border-b border-border hover:bg-muted/50 text-foreground transition-colors">
                    <td className="py-3 pr-4 font-bold text-foreground">{i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}{s.name}</td>
                    <td className="py-3 px-4 text-center">{s.totalDeliveries}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-500">{s.successCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">{s.successRate}%</td>
                    <td className="py-3 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.successRate}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${s.successRate >= 90 ? "text-emerald-500" : s.successRate >= 70 ? "text-amber-500" : "text-rose-500"}`}>
                          {s.successRate >= 90 ? "Excellent" : s.successRate >= 70 ? "Good" : "Needs Review"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "Delivered", "Dispatched", "Delayed", "Pending", "Rejected"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${statusFilter === s ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            {s === "all" ? "All Deliveries" : s}
          </button>
        ))}
      </div>

      {/* Delivery Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium text-sm">No deliveries found for this filter</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Adjust the status filter above to see other records</p>
          </div>
        ) : (
          filtered.map((delivery: any) => {
            const isExpanded = expandedId === delivery.id;
            const canAction = isInventoryManager && (delivery.status === "Dispatched" || delivery.status === "Pending" || delivery.status === "Delayed");

            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl overflow-hidden glow-sm"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap font-bold mb-1">
                        <span className="text-base font-black text-foreground">{delivery.supplier_name}</span>
                        <StatusChip status={delivery.status} />
                        {delivery.invoice_number && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {delivery.invoice_number}
                          </span>
                        )}
                      </div>

                      {/* Core logistics row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase block">Truck Number</span>
                          <span className="font-mono font-bold text-foreground">{delivery.truck_number}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase block">Driver</span>
                          <span className="font-bold text-foreground">{delivery.driver_name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase block">Driver Phone</span>
                          <span className="text-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5 text-muted-foreground" />{delivery.driver_phone}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase block">Source</span>
                          <span className="text-foreground flex items-center gap-1 truncate"><MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />{delivery.source_warehouse}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase block">Dispatch Time</span>
                          <span className="text-foreground">{formatLocalTime(delivery.dispatch_time)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase block">Arrival Time</span>
                          <span className={delivery.arrival_time ? "text-emerald-500 font-bold" : "text-muted-foreground"}>
                            {delivery.arrival_time ? formatLocalTime(delivery.arrival_time) : delivery.estimated_arrival_time ? `ETA ${formatLocalTime(delivery.estimated_arrival_time)}` : "Pending"}
                          </span>
                        </div>
                        {delivery.invoice_amount && (
                          <div>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase block">Invoice Amount</span>
                            <span className="font-bold text-emerald-500">₹{delivery.invoice_amount?.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        {delivery.purchase_order_id && (
                          <div>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase block">Purchase Order</span>
                            <span className="font-mono text-foreground text-[10px]">{delivery.purchase_order_id}</span>
                          </div>
                        )}
                      </div>

                      {/* Products summary */}
                      <div className="pt-2">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase block mb-1.5">Products</span>
                        <div className="flex flex-wrap gap-1.5">
                          {delivery.products.map((p: any) => (
                            <span
                              key={p.ingredient_id}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.status === "Good" ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-500 dark:text-emerald-400" : p.status === "Damaged" ? "bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400" : p.status === "Missing" ? "bg-rose-500/5 border-rose-500/15 text-rose-500 dark:text-rose-400" : "bg-muted border-border text-muted-foreground"}`}
                            >
                              {p.quantity_received > 0 ? `${p.quantity_received}` : `${p.quantity_ordered}`}{p.unit} {p.ingredient_name}
                              {p.status !== "Good" && p.status !== "Pending" && ` (${p.status})`}
                            </span>
                          ))}
                        </div>
                      </div>

                      {delivery.delivery_notes && (
                        <p className="text-[10px] text-muted-foreground italic mt-1 border-l-2 border-border pl-2">{delivery.delivery_notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      {canAction && (
                        <>
                          <button
                            onClick={() => openAccept(delivery)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all"
                          >
                            <Check className="h-3.5 w-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => setRejectingId(delivery.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => setReportingId(delivery.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold transition-all"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" /> Report
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border rounded-xl text-xs font-bold transition-all"
                      >
                        {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</> : <><ChevronDown className="h-3.5 w-3.5" /> Details</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Product Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-5 space-y-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Delivered Products — Full Detail</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border text-muted-foreground font-bold text-[10px]">
                                <th className="pb-2 pr-4">Product</th>
                                <th className="pb-2 px-3 text-center">Qty Ordered</th>
                                <th className="pb-2 px-3 text-center">Qty Received</th>
                                <th className="pb-2 px-3">Batch Number</th>
                                <th className="pb-2 px-3">Expiry Date</th>
                                <th className="pb-2 pl-3 text-right">Condition</th>
                              </tr>
                            </thead>
                            <tbody>
                              {delivery.products.map((p: any) => (
                                <tr key={p.ingredient_id} className="border-b border-border hover:bg-muted/50 text-foreground">
                                  <td className="py-2 pr-4 font-bold text-foreground">{p.ingredient_name}</td>
                                  <td className="py-2 px-3 text-center">{p.quantity_ordered} {p.unit}</td>
                                  <td className="py-2 px-3 text-center font-bold text-emerald-500">{p.quantity_received} {p.unit}</td>
                                  <td className="py-2 px-3 font-mono text-[10px] text-muted-foreground">{p.batch_number || "—"}</td>
                                  <td className="py-2 px-3 text-muted-foreground">{p.expiry_date || "—"}</td>
                                  <td className="py-2 pl-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${p.status === "Good" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : p.status === "Damaged" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : p.status === "Missing" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-muted text-muted-foreground border-border"}`}>{p.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Accept Modal */}
      <Modal
        isOpen={!!acceptingId}
        onClose={() => setAcceptingId(null)}
        title={
          <div>
            <h3 className="text-base font-bold text-foreground">Accept Delivery</h3>
            <p className="text-xs text-muted-foreground">Confirm received quantities and condition for each product</p>
          </div>
        }
        maxWidth="lg"
        footer={
          <>
            <button onClick={() => setAcceptingId(null)} disabled={submitting} className="flex-1 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs font-bold transition-all">
              Cancel
            </button>
            <button onClick={handleAccept} disabled={submitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
              {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</> : <><Check className="h-3.5 w-3.5" /> Accept & Update Stock</>}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {acceptProducts.map((p: any, idx: number) => (
            <div key={p.ingredient_id} className="bg-background border border-border rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-foreground text-sm">{p.ingredient_name}</span>
                  <span className="text-xs text-muted-foreground block">Ordered: {p.quantity_ordered} {p.unit}</span>
                </div>
                <select
                  value={p.status}
                  onChange={e => { const updated = [...acceptProducts]; updated[idx] = { ...updated[idx], status: e.target.value }; setAcceptProducts(updated); }}
                  className="text-xs bg-card border border-border text-foreground rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="Good">Good</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Qty Received ({p.unit})</label>
                  <input
                    type="number"
                    value={p.quantity_received}
                    onChange={e => { const updated = [...acceptProducts]; updated[idx] = { ...updated[idx], quantity_received: Number(e.target.value) }; setAcceptProducts(updated); }}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={p.batch_number || ""}
                    onChange={e => { const updated = [...acceptProducts]; updated[idx] = { ...updated[idx], batch_number: e.target.value }; setAcceptProducts(updated); }}
                    placeholder="BTH-XXXX"
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={p.expiry_date || ""}
                    onChange={e => { const updated = [...acceptProducts]; updated[idx] = { ...updated[idx], expiry_date: e.target.value }; setAcceptProducts(updated); }}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        title={
          <div>
            <h3 className="text-base font-bold text-foreground">Reject Delivery</h3>
            <p className="text-xs text-muted-foreground">Provide a reason for rejecting this supplier delivery</p>
          </div>
        }
        maxWidth="md"
        footer={
          <>
            <button onClick={() => setRejectingId(null)} disabled={submitting} className="flex-1 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs font-bold transition-all">Cancel</button>
            <button onClick={handleReject} disabled={submitting} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
              {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rejecting...</> : <><X className="h-3.5 w-3.5" /> Reject Delivery</>}
            </button>
          </>
        }
      >
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="e.g. Items spoiled on arrival, wrong products delivered, quantity mismatch exceeds threshold..."
          rows={4}
          className="w-full bg-background border border-border text-foreground text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500/50 resize-none placeholder:text-muted-foreground/60"
        />
      </Modal>

      {/* Report Issue Modal */}
      <Modal
        isOpen={!!reportingId}
        onClose={() => setReportingId(null)}
        title={
          <div>
            <h3 className="text-base font-bold text-foreground">Report Delivery Issue</h3>
            <p className="text-xs text-muted-foreground">Log missing items, damaged goods, or other concerns</p>
          </div>
        }
        maxWidth="md"
        footer={
          <>
            <button onClick={() => setReportingId(null)} disabled={submitting} className="flex-1 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs font-bold transition-all">Cancel</button>
            <button onClick={handleReport} disabled={submitting} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
              {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</> : <><AlertTriangle className="h-3.5 w-3.5" /> Submit Report</>}
            </button>
          </>
        }
      >
        <textarea
          value={reportNote}
          onChange={e => setReportNote(e.target.value)}
          placeholder="e.g. 5kg of chicken was damaged/ice melted, 10kg onions were missing from the manifest, packaging torn on 3 boxes..."
          rows={4}
          className="w-full bg-background border border-border text-foreground text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 resize-none placeholder:text-muted-foreground/60"
        />
      </Modal>
    </div>
  );
}
