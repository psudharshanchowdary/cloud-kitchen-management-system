"use client";

import { useEffect, useState, useCallback } from "react";
import { getInventoryList, createInventoryItem, recordStockAdjustment, getStockTransactions } from "@/actions/inventory";
import { getSuppliersList } from "@/actions/suppliers";
import { getAnalyticsData } from "@/actions/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ChartCard } from "@/components/shared/chart-card";
import { PeriodSelector } from "@/components/shared/period-selector";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import { Plus, Search, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight, ClipboardList, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";

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

  // Period filter state
  const [period, setPeriod] = useState("Last 7 Days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invList, supList, trList, analyticsRes] = await Promise.all([
        getInventoryList(),
        getSuppliersList(),
        getStockTransactions(period, customStart, customEnd),
        getAnalyticsData(period, customStart, customEnd)
      ]);
      setInventory(invList);
      setSuppliers(supList);
      setTransactions(trList);
      setAnalytics(analyticsRes);
      if (supList.length > 0) setSupplierId(supList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      {/* Chart Section */}
      {analytics && (
        <ChartCard 
          title="Ingredient Consumption Trend (Inventory Usage)" 
          description="Ingredient OUT volumes deducted from stock based on recipe execution mapping"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueTrend}>
              <defs>
                <linearGradient id="colorInvUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
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
              <Area type="monotone" dataKey="inventoryUsage" stroke="#ec4899" fillOpacity={1} fill="url(#colorInvUsage)" strokeWidth={2} name="Ingredients Used (Units)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

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
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Raw Material"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-item-form"
              disabled={submitLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save raw material"
              )}
            </button>
          </>
        }
      >
        <form id="add-item-form" onSubmit={handleCreateItem} className="space-y-4">
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
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustOpen && !!adjustItem}
        onClose={() => {
          setAdjustOpen(false);
          setAdjustItem(null);
        }}
        title={adjustItem ? (
          <div>
            <span className="text-[9px] text-muted-foreground font-bold uppercase">{adjustItem.category}</span>
            <h3 className="text-base font-bold text-foreground">Adjust: {adjustItem.name}</h3>
          </div>
        ) : undefined}
        maxWidth="sm"
        footer={
          <>
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
              form="adjust-stock-form"
              disabled={submitLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply Stock Adjustment"
              )}
            </button>
          </>
        }
      >
        {adjustItem && (
          <form id="adjust-stock-form" onSubmit={handleAdjustStock} className="space-y-4">
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
          </form>
        )}
      </Modal>

      {/* Transactions Log Modal */}
      <Modal
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
        title="Stock Transactions Log"
        maxWidth="md"
      >
        <div className="space-y-3">
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
      </Modal>
    </div>
  );
}
