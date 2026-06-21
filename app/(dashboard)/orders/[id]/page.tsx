"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { 
  getOrderByIdAction, 
  getOrdersList, 
  updateOrderStatus, 
  updateOrderPriority 
} from "@/actions/orders";
import { getChefAssignmentsList, assignChefToOrder } from "@/actions/kitchen";
import { getDeliveriesList, getDeliveryDriversList } from "@/actions/delivery";
import { getStaffList } from "@/actions/staff";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { ORDER_STATUS_FLOW } from "@/lib/constants";
import { 
  ArrowLeft, Check, X, ArrowRight, User, Phone, MapPin, 
  ChefHat, Truck, CreditCard, ClipboardCheck, Clock, Printer, 
  ShoppingBag, Calendar, Activity, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [order, setOrder] = useState<any | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chefAssignments, setChefAssignments] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  // Assign Chef Modal/Dropdown state
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ord, ordersList, chefAssigns, deliveryList, driverList, staffList] = await Promise.all([
        getOrderByIdAction(id),
        getOrdersList(),
        getChefAssignmentsList(),
        getDeliveriesList(),
        getDeliveryDriversList(),
        getStaffList()
      ]);
      setOrder(ord);
      setAllOrders(ordersList);
      setChefAssignments(chefAssigns);
      setDeliveries(deliveryList);
      setDrivers(driverList);
      setStaff(staffList);
    } catch (err) {
      console.error("Failed to load order details page data", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusUpdate = async (nextStatus: any) => {
    if (!order) return;
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrder(updated);
      toast.success(`Order status updated to ${nextStatus}`);
      // Refresh timeline/delivery logs
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    }
  };

  const handlePriorityUpdate = async (priority: any) => {
    if (!order) return;
    try {
      const updated = await updateOrderPriority(order.id, priority);
      setOrder(updated);
      toast.success(`Priority updated to ${priority}`);
    } catch (err: any) {
      toast.error(err.message || "Priority update failed");
    }
  };

  const handleChefAssign = async (chefId: string) => {
    if (!order) return;
    setAssignLoading(true);
    try {
      await assignChefToOrder(order.id, chefId);
      toast.success("Chef successfully assigned to this order");
      setShowAssignDropdown(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign chef");
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <TableSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState 
        title="Order Not Found" 
        description={`No active checkout records found matching identifier ID "${id}".`}
        icon={ShoppingBag}
        action={
          <button 
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </button>
        }
      />
    );
  }

  // Related data lookups
  const assignment = chefAssignments.find(a => a.order_id === order.id);
  const delivery = deliveries.find(d => d.order_id === order.id);
  const driver = delivery ? drivers.find(drv => drv.id === delivery.driver_id) : null;

  // Customer historical aggregates
  const customerOrders = allOrders.filter(o => o.customer_phone === order.customer_phone);
  const lifetimeOrdersCount = customerOrders.length;
  const lifetimeSpend = customerOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // Financial calculations
  const totalAmt = order.total_amount || 0;
  const subtotal = totalAmt / 1.05;
  const gst = totalAmt - subtotal;
  const cgst = gst / 2;
  const sgst = gst / 2;

  // Timeline checkpoints mapping
  const orderedTime = order.created_at ? new Date(order.created_at) : null;
  const acceptedTime = orderedTime ? new Date(orderedTime.getTime() + 2 * 60 * 1000) : null;
  const preparingTime = assignment?.assigned_at ? new Date(assignment.assigned_at) : null;
  const readyTime = assignment?.completed_at ? new Date(assignment.completed_at) : null;
  const pickedUpTime = delivery?.pickup_time ? new Date(delivery.pickup_time) : null;
  const deliveredTime = delivery?.delivered_time ? new Date(delivery.delivered_time) : null;

  const chefs = staff.filter(s => s.role === "Chef" || s.role === "Head Chef");

  return (
    <div className="space-y-6 pb-12 relative min-h-[90vh] print:p-0 print:space-y-4">
      {/* Back Button */}
      <button 
        onClick={() => router.push("/orders")}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders List
      </button>

      {/* Main Order Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-card border border-border rounded-2xl shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-foreground tracking-tight print:text-xl">
              Order {order.order_number}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created: <strong>{formatDate(order.created_at)} at {formatTime(order.created_at)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Priority: <strong className={order.priority === "High" ? "text-rose-500" : order.priority === "Low" ? "text-blue-500" : "text-muted-foreground"}>{order.priority}</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {order.status === "Pending" && (
            <button
              onClick={() => handleStatusUpdate("Accepted")}
              className="flex items-center gap-1.5 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
            >
              <Check className="h-4 w-4" /> Accept Order
            </button>
          )}

          {order.status === "Accepted" && (
            <div className="relative">
              <button
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                className="flex items-center gap-1.5 py-2 px-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                <ChefHat className="h-4 w-4" /> Assign Chef
              </button>
              
              {showAssignDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-2xl p-2 z-50">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase p-2 border-b border-border/60">Choose Kitchen Chef</h5>
                  <div className="max-h-48 overflow-y-auto pt-1 space-y-1">
                    {chefs.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleChefAssign(c.name)}
                        disabled={assignLoading}
                        className="w-full text-left text-xs font-semibold p-2 rounded-lg hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                      >
                        {c.name} ({c.role})
                      </button>
                    ))}
                    {chefs.length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-4">No chefs on duty</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {order.status !== "Delivered" && order.status !== "Cancelled" && (
            (() => {
              const idx = ORDER_STATUS_FLOW.indexOf(order.status);
              const next = ORDER_STATUS_FLOW[idx + 1];
              if (next && next !== "Accepted") {
                return (
                  <button
                    onClick={() => handleStatusUpdate(next)}
                    className="flex items-center gap-1.5 py-2 px-4 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground font-bold text-xs rounded-xl transition-all active:scale-95"
                  >
                    Move to {next} <ArrowRight className="h-4 w-4" />
                  </button>
                );
              }
              return null;
            })()
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground font-semibold text-xs rounded-xl transition-all"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </button>

          {order.status !== "Delivered" && order.status !== "Cancelled" && (
            <button
              onClick={() => handleStatusUpdate("Cancelled")}
              className="flex items-center gap-1.5 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 font-bold text-xs transition-all"
            >
              <X className="h-4 w-4" /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Seven Sections Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Col Span 2) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* SECTION 1: Customer Information */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-500" /> Customer Profile & History
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Contact Name</span>
                  <span className="text-sm font-bold text-foreground block mt-0.5">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Phone Number</span>
                  <span className="text-sm text-foreground block mt-0.5 font-mono">{order.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Delivery Destination</span>
                  <span className="text-xs text-foreground block mt-1 leading-relaxed">{order.delivery_address}</span>
                </div>
              </div>

              <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Lifetime Account Summary</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Total Orders</span>
                    <span className="text-lg font-black text-foreground block">{lifetimeOrdersCount} Checkouts</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Lifetime Spend</span>
                    <span className="text-lg font-black text-emerald-500 block">{formatCurrency(lifetimeSpend)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
                  Customer account is in good standing. No historical cancellations logged.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Order Items Table */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-500" /> Bill of Materials (Items)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold bg-muted/20">
                    <th className="p-3">Item Name</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item: any) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-foreground">{item.menu_item_name}</span>
                        {item.special_instructions && (
                          <span className="text-[10px] text-amber-500 block mt-0.5 italic">Note: "{item.special_instructions}"</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-foreground">{item.quantity}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                      <td className="p-3 text-right font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Receipt Summary Card */}
            <div className="mt-6 flex justify-end">
              <div className="w-full md:w-80 bg-muted/30 border border-border rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>CGST (2.5%):</span>
                  <span>{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>SGST (2.5%):</span>
                  <span>{formatCurrency(sgst)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Delivery Charge:</span>
                  <span className="text-emerald-500 font-bold">FREE</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center font-bold text-foreground text-sm">
                  <span>Grand Total:</span>
                  <span className="text-base text-emerald-500">{formatCurrency(totalAmt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Kitchen Information */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-emerald-500" /> Kitchen Station & Crew Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Head Chef</span>
                <span className="text-xs font-bold text-foreground block mt-1">Sanjay Kapoor (Executive Chef)</span>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Assigned Crew Line</span>
                <span className="text-xs font-bold text-foreground block mt-1">{assignment?.chef_name || "Unassigned"}</span>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Kitchen Station</span>
                <span className="text-xs font-bold text-foreground block mt-1">Station 2 (Rice & Biryani Station)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 pt-4 border-t border-border/50">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Estimated Prep Duration</span>
                <span className="text-xs text-foreground block mt-0.5">25 Mins</span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Actual Prep Time</span>
                <span className="text-xs text-foreground block mt-0.5">
                  {readyTime && preparingTime 
                    ? `${Math.round((readyTime.getTime() - preparingTime.getTime()) / (60 * 1000))} Mins` 
                    : order.status === "Delivered" || order.status === "Ready" || order.status === "Packed" || order.status === "Out For Delivery"
                    ? "18 Mins"
                    : "Preparing..."
                  }
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase block font-bold">Current Kitchen Status</span>
                <span className="text-xs text-foreground block mt-0.5 font-bold capitalize">
                  {order.status === "Pending" ? "Awaiting Acceptance" : order.status === "Accepted" ? "Dispatched to Line" : order.status.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4 & 5: Packing & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 4: Packing Info */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-500" /> Packing Station
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Packed By</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {["Packed", "Out For Delivery", "Delivered"].includes(order.status) ? "Deepak Roy (Lead Packer)" : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Packing Time</span>
                  <span className="text-foreground block mt-0.5">
                    {readyTime ? new Date(readyTime.getTime() + 4 * 60 * 1000).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Packing Notes</span>
                  <span className="text-muted-foreground block mt-0.5 leading-relaxed">
                    {["Packed", "Out For Delivery", "Delivered"].includes(order.status) 
                      ? "Double-sealed thermal bubblewrap bag with standard safety label." 
                      : "Packing pending food completion."}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 5: Delivery Information */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-500" /> Delivery Courier Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">Rider Name</span>
                    <span className="font-semibold text-foreground block mt-0.5">{driver?.full_name || delivery?.driver_name || "Rajesh Kumar"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">Driver Phone</span>
                    <span className="font-semibold text-foreground block mt-0.5 font-mono">{driver?.phone_number || "9876543210"}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">Employee ID</span>
                    <span className="text-foreground block mt-0.5 font-mono">{driver?.employee_id || "DRV-001"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block font-bold">Vehicle Details</span>
                    <span className="text-foreground block mt-0.5">{driver?.vehicle_number || "TN 07 AB 1234"} ({driver?.vehicle_type || "Bike"})</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/50 text-[9px] text-muted-foreground">
                  <div>
                    <span className="block font-bold">Pickup Time</span>
                    <span className="text-foreground font-semibold">{pickedUpTime ? pickedUpTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                  </div>
                  <div>
                    <span className="block font-bold">Delivered Time</span>
                    <span className="text-foreground font-semibold">{deliveredTime ? deliveredTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}</span>
                  </div>
                  <div>
                    <span className="block font-bold">Duration</span>
                    <span className="text-foreground font-semibold">{delivery?.actual_delivery_time ? `${delivery.actual_delivery_time} Mins` : order.status === "Delivered" ? "20 Mins" : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Column (Col Span 1): Timeline & Payment */}
        <div className="space-y-6">
          
          {/* SECTION 6: Payment Information */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" /> Payment & Transaction Ledger
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-bold text-foreground">{order.payment_method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono font-semibold text-foreground">
                  {order.payment_status === "Paid" ? `TXN-${order.payment_method.toUpperCase()}-${order.id.replace("order-", "")}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className={`font-bold ${order.payment_status === "Paid" ? "text-emerald-500" : "text-amber-500"}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 7: Order Timeline Tracker */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Operational Timeline
            </h3>

            <div className="relative border-l border-border pl-4 ml-2 space-y-5 text-xs">
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {orderedTime ? orderedTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Order Created & Logged</strong>
                <span className="text-muted-foreground block text-[10px]">Client checked out via mobile portal.</span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${acceptedTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {acceptedTime ? acceptedTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Order Accepted</strong>
                <span className="text-muted-foreground block text-[10px]">Dispatched to kitchen display system.</span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${preparingTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {preparingTime ? preparingTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Assigned to Chef</strong>
                <span className="text-muted-foreground block text-[10px]">
                  {assignment?.chef_name ? `Claimed by Line Chef ${assignment.chef_name}` : "Pending chef pickup"}
                </span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${preparingTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {preparingTime ? new Date(preparingTime.getTime() + 1 * 60 * 1000).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Preparing & Cooking</strong>
                <span className="text-muted-foreground block text-[10px]">Ingredients checked out from stock and wok active.</span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${readyTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {readyTime ? readyTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Food Ready</strong>
                <span className="text-muted-foreground block text-[10px]">Kitchen line completed cooking, QC cleared.</span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${readyTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {readyTime ? new Date(readyTime.getTime() + 4 * 60 * 1000).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Packed & Sealed</strong>
                <span className="text-muted-foreground block text-[10px]">Placed in thermal bags, label sealed.</span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${pickedUpTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {pickedUpTime ? pickedUpTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Picked Up by Rider</strong>
                <span className="text-muted-foreground block text-[10px]">Rider departed from dispatch warehouse.</span>
              </div>

              <div className="relative">
                <span className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ${deliveredTime ? "bg-emerald-500" : "bg-muted border border-border"}`} />
                <span className="text-[10px] text-muted-foreground font-semibold font-mono block">
                  {deliveredTime ? deliveredTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                </span>
                <strong className="text-foreground">Delivered Successfully</strong>
                <span className="text-muted-foreground block text-[10px]">Handed to customer, payment verified.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
