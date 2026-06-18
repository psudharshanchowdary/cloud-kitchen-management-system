"use client";

import { useEffect, useState } from "react";
import { getSuppliersList, createSupplier, getPurchaseOrdersList, createPO, receivePO } from "@/actions/suppliers";
import { getInventoryList } from "@/actions/inventory";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Truck, ClipboardList, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"suppliers" | "pos">("suppliers");

  // Add Supplier Modal
  const [addSupOpen, setAddSupOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Add PO Modal
  const [addPOOpen, setAddPOOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poItems, setPoItems] = useState<any[]>([]); // { ingredient_id, quantity, price_per_unit }

  const loadData = async () => {
    try {
      const [sList, poList, iList] = await Promise.all([
        getSuppliersList(),
        getPurchaseOrdersList(),
        getInventoryList()
      ]);
      setSuppliers(sList);
      setPurchaseOrders(poList);
      setInventory(iList);
      if (sList.length > 0) setPoSupplierId(sList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(supPhone)) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }
    setSubmitLoading(true);
    try {
      const data = {
        name: supName,
        contact_person: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress,
        payment_terms: "Net 15",
        lead_time: 2
      };
      const res = await createSupplier(data);
      setSuppliers([...suppliers, res]);
      toast.success("Supplier profile created");
      setAddSupOpen(false);

      // Reset
      setSupName("");
      setSupContact("");
      setSupPhone("");
      setSupEmail("");
      setSupAddress("");
    } catch (err) {
      toast.error("Failed to add supplier");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      toast.error("Please add at least one material to reorder");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await createPO(poSupplierId, poItems);
      setPurchaseOrders([res, ...purchaseOrders]);
      toast.success("Purchase order submitted successfully");
      setAddPOOpen(false);
      setPoItems([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create PO");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReceivePO = async (id: string) => {
    try {
      const updated = await receivePO(id);
      setPurchaseOrders(purchaseOrders.map(p => p.id === id ? updated : p));
      toast.success("Purchase Order received! Stock inventories updated.");
      loadData(); // reload inventory levels
    } catch (err: any) {
      toast.error(err.message || "PO receipt check-in failed");
    }
  };

  const addPORow = () => {
    if (inventory.length === 0) return;
    setPoItems([...poItems, { ingredient_id: inventory[0].id, quantity: 10, price_per_unit: inventory[0].price_per_unit }]);
  };

  const removePORow = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const updatePORow = (index: number, key: string, value: any) => {
    setPoItems(poItems.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const poTotal = poItems.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0);

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Suppliers & POs" 
        description="Oversee raw supplier profiles, submit purchase orders, and receive raw goods."
        category="Procurement"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "suppliers" ? "pos" : "suppliers")}
              className="px-3 py-1.5 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-semibold"
            >
              Switch to {activeTab === "suppliers" ? "Purchase Orders" : "Suppliers"}
            </button>
            {activeTab === "suppliers" ? (
              <button 
                onClick={() => setAddSupOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Add Supplier
              </button>
            ) : (
              <button 
                onClick={() => setAddPOOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Create Purchase Order
              </button>
            )}
          </div>
        }
      />

      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-muted border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "suppliers" ? "bg-emerald-500 text-black" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Suppliers Directory
        </button>
        <button
          onClick={() => setActiveTab("pos")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "pos" ? "bg-emerald-500 text-black" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Purchase Orders Queue
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : activeTab === "suppliers" ? (
        suppliers.length === 0 ? (
          <EmptyState 
            title="No Suppliers Found" 
            description="Add raw suppliers to your procurement logs to begin placing material restocks."
            icon={Truck}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(s => (
              <div key={s.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 glow-sm card-hover flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-foreground block">{s.name}</h4>
                  </div>
                  
                  <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold">Contact:</span>
                      <span className="text-foreground">{s.contact_person || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold">Phone:</span>
                      <span className="text-foreground">{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-semibold">Email:</span>
                        <span className="text-foreground">{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground font-semibold mt-0.5">Addr:</span>
                        <span className="text-foreground line-clamp-2 leading-relaxed">{s.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border mt-3 text-[10px] text-muted-foreground flex justify-between">
                  <span>Terms: {s.payment_terms || "COD"}</span>
                  <span>Lead Time: {s.lead_time || 1} days</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        purchaseOrders.length === 0 ? (
          <EmptyState 
            title="No Purchase Orders Mapped" 
            description="Log POs and verify supplier raw materials invoices."
            icon={ClipboardList}
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold bg-muted/50">
                    <th className="p-4">PO Code</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Order Date</th>
                    <th className="p-4">Delivery Date</th>
                    <th className="p-4">Valuation</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b border-border hover:bg-muted/50 text-foreground transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground">{po.id}</td>
                      <td className="p-4 font-bold">{po.supplier_name}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(po.order_date)}</td>
                      <td className="p-4 text-muted-foreground">{po.delivery_date ? formatDate(po.delivery_date) : "—"}</td>
                      <td className="p-4 font-bold text-emerald-500">{formatCurrency(po.total_amount)}</td>
                      <td className="p-4">
                        <StatusBadge status={po.status} />
                      </td>
                      <td className="p-4 text-right">
                        {po.status === "Ordered" && (
                          <button
                            onClick={() => handleReceivePO(po.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-[10px] ml-auto transition-all active:scale-95"
                          >
                            <Check className="h-3.5 w-3.5" /> Check-in goods
                          </button>
                        )}
                        {po.status === "Received" && (
                          <span className="text-[10px] text-muted-foreground italic">Inventory Updated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {addSupOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddSupOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-card border border-border shadow-2xl rounded-2xl z-50 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <form onSubmit={handleCreateSupplier} className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                  <h3 className="text-base font-bold text-foreground">Create Supplier Profile</h3>
                  <button 
                    type="button"
                    onClick={() => setAddSupOpen(false)}
                    className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Supplier Company Name</label>
                    <input
                      type="text"
                      required
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      placeholder="e.g. Fresh Foods & Dairy Co."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Contact Person</label>
                      <input
                        type="text"
                        required
                        value={supContact}
                        onChange={(e) => setSupContact(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. Rajesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Phone</label>
                      <input
                        type="text"
                        required
                        value={supPhone}
                        onChange={(e) => setSupPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. 9840123456"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={supEmail}
                      onChange={(e) => setSupEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      placeholder="e.g. orders@supplier.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Company Address</label>
                    <textarea
                      value={supAddress}
                      onChange={(e) => setSupAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs resize-none"
                      placeholder="Enter complete office/warehouse address..."
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={() => setAddSupOpen(false)}
                    className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
                  >
                    {submitLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save Supplier Profile"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add PO Modal */}
      <AnimatePresence>
        {addPOOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddPOOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-card border border-border shadow-2xl rounded-2xl z-50 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <form onSubmit={handleCreatePO} className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                  <h3 className="text-base font-bold text-foreground">Create Purchase Order</h3>
                  <button 
                    type="button"
                    onClick={() => setAddPOOpen(false)}
                    className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Choose Supplier</label>
                    <select
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Items selection */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Materials Reorder List</span>
                      <button
                        type="button"
                        onClick={addPORow}
                        className="text-xs text-emerald-500 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add item SKU
                      </button>
                    </div>

                    <div className="space-y-3">
                      {poItems.length === 0 ? (
                        <p className="text-center text-[10px] text-muted-foreground py-6">No items selected.</p>
                      ) : (
                        poItems.map((item, index) => {
                          const inv = inventory.find(i => i.id === item.ingredient_id);
                          return (
                            <div key={index} className="flex gap-2 items-center p-2 bg-background border border-border rounded-xl">
                              <select
                                value={item.ingredient_id}
                                onChange={(e) => {
                                  const newInv = inventory.find(i => i.id === e.target.value);
                                  updatePORow(index, "ingredient_id", e.target.value);
                                  updatePORow(index, "price_per_unit", newInv ? newInv.price_per_unit : 0);
                                }}
                                className="flex-1 bg-card border border-border rounded p-1.5 text-xs text-foreground focus:outline-none"
                              >
                                {inventory.map(i => (
                                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                ))}
                              </select>
                              
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updatePORow(index, "quantity", Number(e.target.value))}
                                className="w-16 bg-card border border-border rounded p-1.5 text-xs text-foreground text-center focus:outline-none"
                              />
                              
                              <span className="text-[9px] text-muted-foreground uppercase w-10 text-center">{inv?.unit}</span>

                              <button
                                type="button"
                                onClick={() => removePORow(index)}
                                className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded border border-rose-500/20 transition-colors"
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
                    <span>Grand Total Value:</span>
                    <span className="text-lg text-emerald-500">{formatCurrency(poTotal)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={() => setAddPOOpen(false)}
                    className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
                  >
                    {submitLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Purchase Order"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
