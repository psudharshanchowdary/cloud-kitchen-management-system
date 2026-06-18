"use client";

import { useEffect, useState } from "react";
import { getInventoryList, createInventoryItem, recordStockAdjustment, getStockTransactions } from "@/actions/inventory";
import { getSuppliersList } from "@/actions/suppliers";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import { Plus, Search, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight, ClipboardList, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Item Modal
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(INVENTORY_CATEGORIES[0] as string);
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");
  const [minLevel, setMinLevel] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [location, setLocation] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Adjust Stock Modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustNotes, setAdjustNotes] = useState("");

  // Log View Modal
  const [logOpen, setLogOpen] = useState(false);

  const loadData = async () => {
    try {
      const [invList, supList, trList] = await Promise.all([
        getInventoryList(),
        getSuppliersList(),
        getStockTransactions()
      ]);
      setInventory(invList);
      setSuppliers(supList);
      setTransactions(trList);
      if (supList.length > 0) setSupplierId(supList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const itemData = {
        name,
        category,
        quantity: Number(qty),
        unit,
        min_level: Number(minLevel),
        price_per_unit: Number(pricePerUnit),
        supplier_id: supplierId,
        storage_location: location
      };

      const res = await createInventoryItem(itemData);
      setInventory([res, ...inventory]);
      toast.success(`${res.name} added to inventory catalog`);
      setAddOpen(false);
      
      // Reset
      setName("");
      setCategory(INVENTORY_CATEGORIES[0]);
      setQty("");
      setUnit("kg");
      setMinLevel("");
      setPricePerUnit("");
      setLocation("");
    } catch (err) {
      toast.error("Failed to add inventory item");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    setSubmitLoading(true);
    try {
      const updated = await recordStockAdjustment(
        adjustItem.id,
        Number(adjustQty),
        adjustType,
        adjustNotes
      );
      setInventory(inventory.map(i => i.id === adjustItem.id ? updated : i));
      toast.success(`Stock adjusted for ${updated.name}`);
      
      // Reload logs
      const logs = await getStockTransactions();
      setTransactions(logs);
      
      setAdjustOpen(false);
      setAdjustItem(null);
      setAdjustQty("");
      setAdjustNotes("");
    } catch (err) {
      toast.error("Stock adjustment failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredInv = inventory.filter(i => {
    const matchesCategory = filterCategory === "All" || i.category === filterCategory;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = inventory.filter(i => i.quantity <= i.min_level).length;
  const totalStockValue = inventory.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0);

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Inventory Manager" 
        description="Verify raw ingredient logs, adjust catalog stock counts, and setup reorder warnings."
        category="Procurement & Stock"
        actions={
          <div className="flex gap-2">
            <button 
              onClick={() => setLogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted hover:bg-accent border border-border text-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-all"
            >
              <ClipboardList className="h-4 w-4" /> Transactions Log
            </button>
            <button 
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add Raw Ingredient
            </button>
          </div>
        }
      />

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Stock Valuation</span>
            <span className="text-xl font-bold text-foreground block mt-0.5">{formatCurrency(totalStockValue)}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Ingredients catalog</span>
            <span className="text-xl font-bold text-foreground block mt-0.5">{inventory.length} SKUs</span>
          </div>
        </div>

        <div className={`bg-card border rounded-2xl p-5 flex items-center gap-4 ${
          lowStockCount > 0 ? "border-amber-500/30 glow-sm" : "border-border"
        }`}>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Low Stock Alerts</span>
            <span className={`text-xl font-bold block mt-0.5 ${lowStockCount > 0 ? 'text-amber-500' : 'text-foreground'}`}>
              {lowStockCount} Items
            </span>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search raw catalog by ingredient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          {["All", ...INVENTORY_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterCategory === cat
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <TableSkeleton />
      ) : filteredInv.length === 0 ? (
        <EmptyState 
          title="No Ingredients Found" 
          description="Create some raw ingredients or raw materials to populate your stock lists."
          icon={Plus}
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold bg-card/50">
                  <th className="p-4">Ingredient Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock Levels</th>
                  <th className="p-4">Unit Rate</th>
                  <th className="p-4">Valuation</th>
                  <th className="p-4">Storage location</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInv.map((item) => {
                  const isLow = item.quantity <= item.min_level;
                  return (
                    <tr 
                      key={item.id} 
                      className={`border-b border-border hover:bg-muted/50 text-foreground transition-colors ${
                        isLow ? "bg-amber-500/[0.01]" : ""
                      }`}
                    >
                      <td className="p-4">
                        <span className="font-bold text-foreground block">{item.name}</span>
                        {isLow && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-1.5 py-0.2 mt-0.5 inline-block font-semibold">
                            ⚠️ Low Stock reorder threshold reached
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{item.category}</td>
                      <td className="p-4">
                        <span className={`font-bold block ${isLow ? 'text-amber-500' : 'text-foreground'}`}>
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">Min limit: {item.min_level} {item.unit}</span>
                      </td>
                      <td className="p-4 font-semibold">{formatCurrency(item.price_per_unit)} / {item.unit}</td>
                      <td className="p-4 font-bold text-emerald-500">
                        {formatCurrency(item.quantity * item.price_per_unit)}
                      </td>
                      <td className="p-4 text-muted-foreground">{item.storage_location || "N/A"}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-muted hover:bg-accent border border-border text-foreground rounded text-[10px] font-semibold transition-colors"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-card border border-border shadow-2xl rounded-2xl z-50 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <form onSubmit={handleCreateItem} className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                  <h3 className="text-base font-bold text-foreground">Add Raw Material</h3>
                  <button 
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Ingredient Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      placeholder="e.g. Basmati Rice"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      >
                        {INVENTORY_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Supplier</label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Qty</label>
                      <input
                        type="number"
                        required
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Unit</label>
                      <input
                        type="text"
                        required
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. kg, L"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Min Level</label>
                      <input
                        type="number"
                        required
                        value={minLevel}
                        onChange={(e) => setMinLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Price per unit (₹)</label>
                      <input
                        type="number"
                        required
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. 90"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Storage Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="e.g. Pantry A"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
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
                      "Save Ingredient"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Adjust Stock Modal */}
      <AnimatePresence>
        {adjustOpen && adjustItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAdjustOpen(false);
                setAdjustItem(null);
              }}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-sm bg-card border border-border shadow-2xl rounded-2xl z-50 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <form onSubmit={handleAdjustStock} className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">{adjustItem.category}</span>
                    <h3 className="text-base font-bold text-foreground">Adjust: {adjustItem.name}</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setAdjustOpen(false);
                      setAdjustItem(null);
                    }}
                    className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="p-3 bg-background border border-border rounded-xl flex justify-between text-xs text-muted-foreground">
                    <span>Current Stock:</span>
                    <span className="font-bold text-foreground">{adjustItem.quantity} {adjustItem.unit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType("IN")}
                      className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                        adjustType === "IN"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" /> Stock In (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType("OUT")}
                      className={`py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                        adjustType === "OUT"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      <ArrowDownRight className="h-3.5 w-3.5" /> Stock Out (-)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Adjustment Quantity</label>
                      <input
                        type="number"
                        required
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        placeholder="Quantity"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase mt-4 text-center">{adjustItem.unit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Reason/Notes</label>
                    <input
                      type="text"
                      required
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      placeholder="e.g. Audit correction, spoilage"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustOpen(false);
                      setAdjustItem(null);
                    }}
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
                      "Apply Stock Adjustment"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Transactions Log Modal Drawer */}
      <AnimatePresence>
        {logOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                <h3 className="text-base font-bold text-foreground">Stock Transactions Log</h3>
                <button 
                  onClick={() => setLogOpen(false)}
                  className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-12">No transactions recorded</p>
                ) : (
                  transactions.map((tr) => (
                    <div key={tr.id} className="p-3 bg-background border border-border rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-foreground">{tr.ingredient_name}</span>
                        <span className={`font-bold flex items-center gap-0.5 ${
                          tr.type === "IN" ? "text-emerald-500" : tr.type === "OUT" ? "text-rose-500" : "text-blue-500"
                        }`}>
                          {tr.type === "IN" ? "+" : tr.type === "OUT" ? "-" : ""}
                          {tr.quantity}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-normal text-[11px]">{tr.notes}</p>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Ref: {tr.reference_id || "Manual"}</span>
                        <span>{formatDate(tr.created_at)} {formatTime(tr.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
