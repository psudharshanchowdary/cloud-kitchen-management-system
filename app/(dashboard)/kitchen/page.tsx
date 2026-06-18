"use client";

import { useEffect, useState } from "react";
import { getKitchenQueue, getChefAssignmentsList, assignChefToOrder } from "@/actions/kitchen";
import { getStaffList } from "@/actions/staff";
import { updateOrderItemStatus, updateOrderStatus } from "@/actions/orders";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatTime } from "@/lib/utils";
import { ChefHat, Clock, AlertTriangle, Check, Play, UserPlus, RefreshCw, Box } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export default function KitchenPage() {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Assign Chef Modal state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [queue, staffList, assignList] = await Promise.all([
        getKitchenQueue(),
        getStaffList(),
        getChefAssignmentsList()
      ]);
      setOrders(queue);
      setChefs(staffList.filter(s => s.role === "Chef" && s.status === "Active"));
      setAssignments(assignList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // 15 seconds polling interval for live kitchen updates
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignChef = async (orderId: string, chefId: string) => {
    try {
      const res = await assignChefToOrder(orderId, chefId);
      setAssignments([res, ...assignments.filter(a => a.order_id !== orderId)]);
      setAssigningOrderId(null);
      toast.success(`Assigned to ${res.chef_name}`);
      loadData(); // reload queue
    } catch (err: any) {
      toast.error(err.message || "Failed to assign chef");
    }
  };

  const handleItemStatusChange = async (itemId: string, newStatus: "Pending" | "Cooking" | "Ready") => {
    try {
      await updateOrderItemStatus(itemId, newStatus);
      toast.success(`Item status updated to ${newStatus}`);
      loadData(); // reload queue to reflect parent order state
    } catch (err: any) {
      toast.error(err.message || "Item status update failed");
    }
  };

  const handleOrderReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "Ready");
      toast.success("Order marked Ready for packing!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Order status update failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kitchen Operations Queue" description="Loading tickets..." />
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 mr-2" /> Loading kitchen KDS display...
        </div>
      </div>
    );
  }

  // Group orders by columns
  // Pending (not yet cooking), Cooking (Preparing), Ready (ready for packing)
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Accepted");
  const preparingOrders = orders.filter(o => o.status === "Preparing");
  const readyOrders = orders.filter(o => o.status === "Ready");

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Kitchen Operations Queue"
        description="Real-time prep tickets, station workload, and chef assignments."
        category="Operations KDS"
        actions={
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground rounded-lg text-xs transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Board
          </button>
        }
      />

      {/* KDS Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Pending & Accepted Tickets */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-card border border-border rounded-xl">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">New Tickets (Pending)</span>
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{pendingOrders.length}</span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-12">No pending tickets</p>
            ) : (
              pendingOrders.map((o) => {
                const assigned = assignments.find(a => a.order_id === o.id);
                return (
                  <div 
                    key={o.id}
                    className={`bg-card border rounded-xl p-4 space-y-3 shadow-md relative overflow-hidden ${
                      o.priority === "High" ? "border-rose-500/30 glow-sm" : "border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground block">{o.order_number}</span>
                        <span className="text-xs font-bold text-foreground block mt-0.5">{o.customer_name}</span>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    <div className="space-y-1 py-2 border-t border-b border-border">
                      {(o.items || []).map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-xs text-foreground">
                          <span>{item.quantity} × {item.menu_item_name}</span>
                          {item.special_instructions && (
                            <span className="text-[10px] text-amber-500 italic">"{item.special_instructions}"</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTime(o.order_date)}</span>
                      </div>

                      {/* Head Chef actions: Assign Chef */}
                      {(user?.role === "Owner" || user?.role === "Operations Manager" || user?.role === "Head Chef") && (
                        <div className="relative">
                          {assigningOrderId === o.id ? (
                            <select
                              onChange={(e) => handleAssignChef(o.id, e.target.value)}
                              defaultValue=""
                              className="bg-background border border-border rounded p-1 text-[10px] text-foreground focus:outline-none"
                            >
                              <option value="" disabled>Choose Chef</option>
                              {chefs.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setAssigningOrderId(o.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground rounded text-[10px] font-semibold"
                            >
                              <UserPlus className="h-3 w-3" /> {assigned ? assigned.chef_name : "Assign Chef"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Chef role actions: Quick start prep */}
                      {user?.role === "Chef" && (
                        <button
                          onClick={() => handleStatusUpdate(o.id, "Preparing")}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[10px]"
                        >
                          <Play className="h-3 w-3" /> Start cooking
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Preparing / Cooking Tickets */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-card border border-border rounded-xl">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">In Prep (Cooking)</span>
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{preparingOrders.length}</span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-12">No active preparing tickets</p>
            ) : (
              preparingOrders.map((o) => {
                const assigned = assignments.find(a => a.order_id === o.id);
                return (
                  <div 
                    key={o.id}
                    className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground block">{o.order_number}</span>
                        <span className="text-xs font-bold text-foreground block mt-0.5">{o.customer_name}</span>
                        {assigned && (
                          <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">Chef: {assigned.chef_name}</span>
                        )}
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    {/* Item status lists: Chefs can update status per item */}
                    <div className="space-y-2 py-2 border-t border-b border-border">
                      {(o.items || []).map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-1.5 bg-background/60 rounded border border-border text-xs">
                          <div>
                            <span className="font-bold text-foreground block">{item.quantity} × {item.menu_item_name}</span>
                            {item.special_instructions && (
                              <span className="text-[9px] text-amber-500 block">"{item.special_instructions}"</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground capitalize">{item.status}</span>
                            {item.status !== "Ready" && (
                              <button
                                onClick={() => handleItemStatusChange(item.id, item.status === "Pending" ? "Cooking" : "Ready")}
                                className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded border border-emerald-500/20"
                                title={item.status === "Pending" ? "Start cooking" : "Mark item ready"}
                              >
                                {item.status === "Pending" ? <Play className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Prep started</span>
                      </div>

                      <button
                        onClick={() => handleOrderReady(o.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded text-[10px] transition-all active:scale-95"
                      >
                        <Check className="h-3 w-3" /> Mark Order Ready
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Ready for packing */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-card border border-border rounded-xl">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Completed (Ready)</span>
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">{readyOrders.length}</span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-12">No ready tickets</p>
            ) : (
              readyOrders.map((o) => (
                <div 
                  key={o.id}
                  className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground block">{o.order_number}</span>
                      <span className="text-xs font-bold text-foreground block mt-0.5">{o.customer_name}</span>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="space-y-1 py-2 border-t border-b border-border text-xs text-foreground">
                    {(o.items || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span>{item.quantity} × {item.menu_item_name}</span>
                        <span className="text-[10px] text-emerald-500 font-bold">Ready</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span>Ready for packing station</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function handleStatusUpdate(orderId: string, nextStatus: any) {
  return updateOrderStatus(orderId, nextStatus);
}
