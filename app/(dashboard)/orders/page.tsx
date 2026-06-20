"use client";

import { useEffect, useState } from "react";
import { getOrdersList, createNewOrder, updateOrderStatus, updateOrderPriority } from "@/actions/orders";
import { getMenuList } from "@/actions/menu";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { ORDER_STATUS, ORDER_PRIORITY, PAYMENT_METHOD, ORDER_STATUS_FLOW } from "@/lib/constants";
import { Plus, Search, ShoppingBag, X, Check, ArrowRight, User, Phone, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/auth-store";

export default function OrdersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Order Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddr, setCustAddr] = useState("");
  const [orderPriority, setOrderPriority] = useState<any>("Normal");
  const [payMethod, setPayMethod] = useState<any>("UPI");
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // { menu_item_id, quantity, special_instructions }
  const [submitLoading, setSubmitLoading] = useState(false);

  // Selected Order Detail Sidebar
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [oList, mList] = await Promise.all([getOrdersList(), getMenuList()]);
        setOrders(oList);
        setMenuItems(mList.filter(m => m.is_available && (m.status === "Active" || !m.status)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }
    
    // Validate phone
    if (!/^[6-9]\d{9}$/.test(custPhone)) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }

    setSubmitLoading(true);
    try {
      const itemsList = selectedItems.map(si => {
        const menu = menuItems.find(m => m.id === si.menu_item_id);
        return {
          menu_item_id: si.menu_item_id,
          menu_item_name: menu.name,
          quantity: si.quantity,
          price: menu.price,
          special_instructions: si.special_instructions
        };
      });

      const totalAmount = itemsList.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const orderData = {
        customer_name: custName,
        customer_phone: custPhone,
        total_amount: totalAmount,
        status: ORDER_STATUS.PENDING as any,
        priority: orderPriority,
        order_date: new Date().toISOString(),
        delivery_address: custAddr,
        payment_status: payMethod === "Cash" ? "Pending" as any : "Paid" as any,
        payment_method: payMethod
      };

      const res = await createNewOrder(orderData, itemsList);
      setOrders([res, ...orders]);
      toast.success(`Order ${res.order_number} created successfully!`);
      
      // Reset
      setCreateOpen(false);
      setCustName("");
      setCustPhone("");
      setCustAddr("");
      setOrderPriority("Normal");
      setPayMethod("UPI");
      setSelectedItems([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, nextStatus: any) => {
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      toast.success(`Order status updated to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Status update failed");
    }
  };

  const handlePriorityUpdate = async (orderId: string, priority: any) => {
    try {
      const updated = await updateOrderPriority(orderId, priority);
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      toast.success(`Priority updated to ${priority}`);
    } catch (err: any) {
      toast.error(err.message || "Priority update failed");
    }
  };

  const addItemRow = () => {
    if (menuItems.length === 0) return;
    setSelectedItems([...selectedItems, { menu_item_id: menuItems[0].id, quantity: 1, special_instructions: "" }]);
  };

  const removeItemRow = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, key: string, value: any) => {
    setSelectedItems(selectedItems.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  // Filter & Search logic
  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === "All" || o.status === filterStatus;
    const matchesSearch = 
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const orderTotal = selectedItems.reduce((sum, item) => {
    const menu = menuItems.find(m => m.id === item.menu_item_id);
    return sum + (menu ? menu.price * item.quantity : 0);
  }, 0);

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Order Management" 
        description="Process pending lines, dispatch drivers, and manage statuses."
        category="Operations"
        actions={
          <button 
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Create New Order
          </button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          {["All", "Pending", "Accepted", "Preparing", "Ready", "Packed", "Out For Delivery", "Delivered", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterStatus === status
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <TableSkeleton />
      ) : filteredOrders.length === 0 ? (
        <EmptyState 
          title="No Orders Found" 
          description="Try modifying filters or search query, or click Create New Order to record a new checkout."
          icon={ShoppingBag}
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold bg-card/50">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Priority</th>
                  {currentUser?.role !== "Head Chef" && <th className="p-4">Amount</th>}
                  {currentUser?.role !== "Head Chef" && <th className="p-4">Payment</th>}
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    className="border-b border-border hover:bg-muted/50 text-foreground cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-foreground">{o.order_number}</td>
                    <td className="p-4">
                      <span className="font-bold text-foreground block">{o.customer_name}</span>
                      <span className="text-[10px] text-muted-foreground block">{o.customer_phone}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold ${o.priority === 'High' ? 'text-rose-500' : o.priority === 'Low' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                        {o.priority}
                      </span>
                    </td>
                    {currentUser?.role !== "Head Chef" && (
                      <td className="p-4 font-bold text-emerald-500">{formatCurrency(o.total_amount)}</td>
                    )}
                    {currentUser?.role !== "Head Chef" && (
                      <td className="p-4">
                        <span className={`text-[10px] font-semibold ${o.payment_status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {o.payment_status} ({o.payment_method})
                        </span>
                      </td>
                    )}
                    <td className="p-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {o.status === "Pending" && (
                          <button
                            onClick={() => handleStatusUpdate(o.id, "Accepted")}
                            className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded border border-emerald-500/20"
                            title="Accept Order"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {["Pending", "Accepted", "Preparing", "Ready", "Packed", "Out For Delivery"].includes(o.status) && (
                          <button
                            onClick={() => handleStatusUpdate(o.id, "Cancelled")}
                            className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded border border-rose-500/20"
                            title="Cancel Order"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2 py-1 bg-muted hover:bg-accent border border-border text-foreground rounded text-[10px]"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? (
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">{selectedOrder.order_number}</span>
            <h3 className="text-base font-bold text-foreground">Order Details</h3>
          </div>
        ) : undefined}
        maxWidth="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status Controls */}
            <div className="p-4 bg-background border border-border rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Current Status:</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              
              {/* Status buttons flow */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {selectedOrder.status !== "Delivered" && selectedOrder.status !== "Cancelled" && (
                  (() => {
                    const idx = ORDER_STATUS_FLOW.indexOf(selectedOrder.status);
                    const next = ORDER_STATUS_FLOW[idx + 1];
                    if (next) {
                      return (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder.id, next)}
                          className="col-span-2 flex items-center justify-center gap-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all active:scale-95"
                        >
                          Move to {next} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Info</h4>
              <div className="space-y-2 text-xs text-foreground">
                <div className="flex items-center gap-2.5 p-2.5 bg-background border border-border rounded-xl">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-foreground">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 bg-background border border-border rounded-xl">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-background border border-border rounded-xl">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{selectedOrder.delivery_address}</span>
                </div>
              </div>
            </div>

            {/* Priority Controls */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Priority</h4>
              <div className="flex items-center gap-2">
                {["Low", "Normal", "High"].map((prio) => (
                  <button
                    key={prio}
                    onClick={() => handlePriorityUpdate(selectedOrder.id, prio)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedOrder.priority === prio
                        ? prio === "High"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : prio === "Low"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-muted text-foreground border-border"
                        : "bg-transparent text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordered Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ordered Items</h4>
              <div className="space-y-2 bg-background border border-border rounded-xl p-3">
                {(selectedOrder.items || []).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start py-2 border-b border-border last:border-0 last:pb-0">
                    <div>
                      <span className="text-xs font-bold text-foreground">{item.menu_item_name}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Qty: {item.quantity} {currentUser?.role !== "Head Chef" && `× ${formatCurrency(item.price)}`}
                      </span>
                      {item.special_instructions && (
                        <span className="text-[10px] text-amber-500 italic block mt-0.5">Note: "{item.special_instructions}"</span>
                      )}
                    </div>
                    {currentUser?.role !== "Head Chef" && (
                      <span className="text-xs font-bold text-emerald-500">{formatCurrency(item.price * item.quantity)}</span>
                    )}
                  </div>
                ))}
                {currentUser?.role !== "Head Chef" && (
                  <div className="flex justify-between items-center pt-3 border-t border-border mt-2 text-xs font-bold text-foreground">
                    <span>Total Amount:</span>
                    <span className="text-base text-emerald-500">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Order"
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-order-form"
              disabled={submitLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm & Create Order"
              )}
            </button>
          </>
        }
      >
        <form id="create-order-form" onSubmit={handleCreateOrder} className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                placeholder="e.g. 9840123456"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Delivery Address</label>
            <textarea
              required
              value={custAddr}
              onChange={(e) => setCustAddr(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs resize-none"
              placeholder="Enter complete delivery address details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Priority</label>
              <select
                value={orderPriority}
                onChange={(e) => setOrderPriority(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              >
                <option value="UPI">UPI (Prepaid)</option>
                <option value="Card">Card (Prepaid)</option>
                <option value="Cash">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {/* Items selection */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Items Checklist</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-emerald-500 hover:underline flex items-center gap-0.5"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {selectedItems.length === 0 ? (
                <p className="text-center text-[10px] text-muted-foreground py-6">No items added yet. Click Add Item to start.</p>
              ) : (
                selectedItems.map((item, index) => {
                  const menu = menuItems.find(m => m.id === item.menu_item_id);
                  return (
                    <div key={index} className="flex gap-2 items-start p-2 bg-background border border-border rounded-xl">
                      <select
                        value={item.menu_item_id}
                        onChange={(e) => updateItemRow(index, "menu_item_id", e.target.value)}
                        className="flex-1 bg-card border border-border rounded p-1.5 text-xs text-foreground focus:outline-none"
                      >
                        {menuItems.map(mi => (
                          <option key={mi.id} value={mi.id}>{mi.name} ({formatCurrency(mi.price)})</option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItemRow(index, "quantity", Number(e.target.value))}
                        className="w-12 bg-card border border-border rounded p-1.5 text-xs text-foreground text-center focus:outline-none"
                      />

                      <input
                        type="text"
                        value={item.special_instructions}
                        onChange={(e) => updateItemRow(index, "special_instructions", e.target.value)}
                        className="flex-1 bg-card border border-border rounded p-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                        placeholder="Notes (e.g. no onions)"
                      />

                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded border border-rose-500/20 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border mt-4 text-xs font-bold text-foreground">
            <span>Grand Total:</span>
            <span className="text-lg text-emerald-500">{formatCurrency(orderTotal)}</span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
