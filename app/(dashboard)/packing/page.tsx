"use client";

import { useEffect, useState } from "react";
import { getPackingQueue } from "@/actions/packing";
import { updateOrderStatus } from "@/actions/orders";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Box, CheckSquare, Square, Truck, RefreshCw, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { getDeliveryDriversList, dispatchOrderAction } from "@/actions/delivery";
import { Modal } from "@/components/shared/modal";

export default function PackingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track checked items per order: Record<orderId, Record<itemId, boolean>>
  const [checklist, setChecklist] = useState<Record<string, Record<string, boolean>>>({});

  const [drivers, setDrivers] = useState<any[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [dispatching, setDispatching] = useState(false);

  const loadData = async () => {
    try {
      const queue = await getPackingQueue();
      setOrders(queue);
      
      // Initialize checklist for any new orders
      const newChecklist = { ...checklist };
      queue.forEach(o => {
        if (!newChecklist[o.id]) {
          newChecklist[o.id] = {};
          (o.items || []).forEach((item: any) => {
            newChecklist[o.id][item.id] = false;
          });
        }
      });
      setChecklist(newChecklist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleCheck = (orderId: string, itemId: string) => {
    setChecklist({
      ...checklist,
      [orderId]: {
        ...checklist[orderId],
        [itemId]: !checklist[orderId]?.[itemId]
      }
    });
  };

  const handlePackOrder = async (orderId: string) => {
    // Verify all items are checked
    const orderChecks = checklist[orderId] || {};
    const order = orders.find(o => o.id === orderId);
    const allChecked = (order?.items || []).every((item: any) => orderChecks[item.id]);

    if (!allChecked) {
      toast.error("Please verify all items in the checklist before packing");
      return;
    }

    try {
      const updated = await updateOrderStatus(orderId, "Packed");
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      toast.success(`Order ${updated.order_number} packed successfully!`);
      loadData();
    } catch (err) {
      toast.error("Failed to pack order");
    }
  };

  const handleDispatchClick = async (orderId: string) => {
    try {
      const list = await getDeliveryDriversList();
      const available = list.filter(d => d.status === "Available");
      setDrivers(available);
      setAssigningOrderId(orderId);
      if (available.length > 0) {
        setSelectedDriverId(available[0].id);
      } else {
        setSelectedDriverId("");
      }
    } catch (err) {
      toast.error("Failed to load available drivers");
    }
  };

  const handleConfirmDispatch = async () => {
    if (!assigningOrderId) return;
    if (!selectedDriverId) {
      toast.error("Please select a driver to dispatch the order");
      return;
    }

    setDispatching(true);
    try {
      await dispatchOrderAction(assigningOrderId, selectedDriverId);
      toast.success("Order dispatched successfully!");
      setAssigningOrderId(null);
      setSelectedDriverId("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch order");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Packing Station" 
        description="Verify order items, pack bags, print slips, and dispatch to courier drivers."
        category="Operations KDS"
        actions={
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground rounded-lg text-xs transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
          </button>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState 
          title="No Orders for Packing" 
          description="Orders will appear here once marked as Ready in the kitchen queue."
          icon={Box}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((o) => {
            const orderChecks = checklist[o.id] || {};
            const isPacked = o.status === "Packed";
            const itemsCount = (o.items || []).length;
            const checkedCount = Object.values(orderChecks).filter(Boolean).length;
            const progressPct = itemsCount > 0 ? Math.round((checkedCount / itemsCount) * 100) : 0;

            return (
              <div 
                key={o.id}
                className={`bg-card border rounded-2xl p-5 space-y-4 glow-sm flex flex-col justify-between ${
                  isPacked ? "border-emerald-500/20" : "border-border"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground block">{o.order_number}</span>
                      <h4 className="text-sm font-bold text-foreground block mt-0.5">{o.customer_name}</h4>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  {/* Verification progress bar */}
                  {!isPacked && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>VERIFICATION</span>
                        <span className={progressPct === 100 ? "text-emerald-500" : ""}>{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Items checklist block */}
                  <div className="space-y-2 py-2 border-t border-b border-border">
                    {(o.items || []).map((item: any) => {
                      const checked = !!orderChecks[item.id];
                      return (
                        <div 
                          key={item.id}
                          onClick={() => !isPacked && toggleCheck(o.id, item.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isPacked 
                              ? "bg-background/20 border-transparent text-muted-foreground" 
                              : checked
                              ? "bg-emerald-500/[0.02] border-emerald-500/10 text-foreground font-semibold"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {!isPacked && (
                            <button type="button" className="text-emerald-500 mt-0.5 shrink-0">
                              {checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                            </button>
                          )}
                          <div className="flex-1">
                            <span>{item.quantity} × {item.menu_item_name}</span>
                            {item.special_instructions && (
                              <span className="text-[9px] text-amber-500 italic block mt-0.5">Note: "{item.special_instructions}"</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Dispatch Actions */}
                <div className="pt-2">
                  {!isPacked ? (
                    <button
                      onClick={() => handlePackOrder(o.id)}
                      className={`w-full py-2 flex items-center justify-center gap-1.5 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 ${
                        progressPct === 100
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10"
                          : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      }`}
                    >
                      <Box className="h-4 w-4" /> Pack Order
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDispatchClick(o.id)}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Truck className="h-4 w-4" /> Dispatch to Driver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Driver Selection Modal */}
      <Modal
        isOpen={assigningOrderId !== null}
        onClose={() => setAssigningOrderId(null)}
        title={
          <div>
            <h3 className="text-lg font-bold text-foreground">Select Delivery Driver</h3>
            <p className="text-muted-foreground text-xs font-normal mt-1">
              Choose an available driver to deliver this order.
            </p>
          </div>
        }
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setAssigningOrderId(null)}
              disabled={dispatching}
              className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDispatch}
              disabled={dispatching || !selectedDriverId}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {dispatching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Truck className="h-3.5 w-3.5" /> Dispatch Order
                </>
              )}
            </button>
          </>
        }
      >
        {drivers.length === 0 ? (
          <div className="text-center py-6 bg-background rounded-xl border border-border">
            <X className="h-8 w-8 text-rose-500 mx-auto mb-2 opacity-60" />
            <p className="text-xs text-muted-foreground font-medium">No drivers are currently available.</p>
            <p className="text-[10px] text-muted-foreground mt-1">Please wait for a driver to return or change status.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground block">AVAILABLE DRIVERS</label>
            <div className="space-y-2">
              {drivers.map((drv) => (
                <div
                  key={drv.id}
                  onClick={() => setSelectedDriverId(drv.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedDriverId === drv.id
                      ? "bg-emerald-500/[0.03] border-emerald-500/30 text-foreground font-semibold"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold text-foreground block text-sm">{drv.full_name}</span>
                    <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>ID: {drv.employee_id}</span>
                      <span>•</span>
                      <span>{drv.vehicle_type} ({drv.vehicle_number})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      Available
                    </span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedDriverId === drv.id ? "border-emerald-500 bg-emerald-500 text-black" : "border-border"
                    }`}>
                      {selectedDriverId === drv.id && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
