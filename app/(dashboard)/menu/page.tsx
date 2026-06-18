"use client";

import { useEffect, useState } from "react";
import { getMenuList, saveMenuItem, toggleMenuItemAvailability, removeMenuItem, getMenuItemWithIngredients } from "@/actions/menu";
import { getInventoryList } from "@/actions/inventory";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import { MENU_CATEGORIES } from "@/lib/constants";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Add/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(MENU_CATEGORIES[0] as string);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [prepTime, setPrepTime] = useState("15");
  const [recipe, setRecipe] = useState<any[]>([]); // { ingredient_id, quantity }
  const [kitchenStation, setKitchenStation] = useState("Main Kitchen");
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Delete Confirm Dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [mList, iList] = await Promise.all([getMenuList(), getInventoryList()]);
        setItems(mList);
        setInventory(iList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleEditClick = async (item: any) => {
    setLoading(true);
    try {
      const details = await getMenuItemWithIngredients(item.id);
      setEditingId(item.id);
      setName(item.name);
      setCategory(item.category);
      setPrice(item.price.toString());
      setDescription(item.description || "");
      setIsVeg(item.is_vegetarian);
      setPrepTime(item.preparation_time.toString());
      setRecipe(details.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity
      })));
      setKitchenStation("Main Kitchen");
      setAutoDeduct(true);
      setModalOpen(true);
    } catch (err) {
      toast.error("Failed to load recipe details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpen = () => {
    setEditingId(undefined);
    setName("");
    setCategory(MENU_CATEGORIES[0]);
    setPrice("");
    setDescription("");
    setIsVeg(true);
    setPrepTime("15");
    setRecipe([]);
    setKitchenStation("Main Kitchen");
    setAutoDeduct(true);
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipe.length === 0) {
      toast.error("Please add at least one ingredient recipe link");
      return;
    }

    setSaveLoading(true);
    try {
      const itemData = {
        name,
        category,
        price: Number(price),
        description,
        is_vegetarian: isVeg,
        is_available: true,
        preparation_time: Number(prepTime)
      };

      const res = await saveMenuItem(itemData, recipe, editingId);
      
      if (editingId) {
        setItems(items.map(m => m.id === editingId ? res : m));
        toast.success("Menu item updated successfully!");
      } else {
        setItems([res, ...items]);
        toast.success("Menu item created successfully!");
      }

      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save menu item");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      const updated = await toggleMenuItemAvailability(id, isAvailable);
      setItems(items.map(m => m.id === id ? updated : m));
      toast.success(isAvailable ? "Item set to Available" : "Item set to Unavailable");
    } catch (err) {
      toast.error("Failed to update availability");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await removeMenuItem(deleteId);
      setItems(items.filter(m => m.id !== deleteId));
      toast.success("Menu item deleted");
      setDeleteId(null);
    } catch (err) {
      toast.error("Failed to delete menu item");
    }
  };

  const addRecipeRow = () => {
    if (inventory.length === 0) return;
    setRecipe([...recipe, { ingredient_id: inventory[0].id, quantity: 0.1 }]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const updateRecipeRow = (index: number, key: string, value: any) => {
    setRecipe(recipe.map((row, i) => i === index ? { ...row, [key]: value } : row));
  };

  // Calculate total recipe cost dynamically based on item ratios and raw inventory costs
  const calculateRecipeCost = () => {
    return recipe.reduce((sum, row) => {
      const inv = inventory.find(i => i.id === row.ingredient_id);
      return sum + (inv ? inv.price_per_unit * row.quantity : 0);
    }, 0);
  };

  const filteredItems = items.filter(m => {
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recipeCost = calculateRecipeCost();

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Menu Manager" 
        description="Configure menu categories, toggle active availability, and analyze recipe cost structures."
        category="Products & Catalog"
        actions={
          <button 
            onClick={handleCreateOpen}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Menu Item
          </button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search catalog by food item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          {["All", ...MENU_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog items */}
      {loading ? (
        <TableSkeleton />
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          title="No Menu Items Found" 
          description="Create some food items or modify your search filters to display records."
          icon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border rounded-2xl p-5 glow-sm card-hover flex flex-col justify-between ${
                item.is_available ? "border-border" : "border-border/40 opacity-70"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.is_vegetarian ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.is_vegetarian ? "Veg" : "Non-Veg"} />
                    <span className="text-[10px] text-muted-foreground font-bold">{item.preparation_time} min</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">{item.description || "No description provided."}</p>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-base font-extrabold text-emerald-500">{formatCurrency(item.price)}</span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailability(item.id, !item.is_available)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      item.is_available 
                        ? "bg-muted border-border text-muted-foreground hover:text-foreground" 
                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    }`}
                    title={item.is_available ? "Disable Item" : "Enable Item"}
                  >
                    {item.is_available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-1.5 bg-muted hover:bg-muted border border-border text-foreground hover:text-foreground rounded-lg transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-lg transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Menu Item?" 
        description="This will permanently delete the menu item and all linked recipe ingredient listings."
        confirmText="Delete permanently"
        variant="danger"
      />

      {/* Add / Edit Modal Drawer */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-card border border-border shadow-2xl rounded-2xl z-50 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <form onSubmit={handleSaveItem} className="flex flex-col max-h-[90vh]">
                {/* Header (Sticky/Fixed) */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
                  <h3 className="text-base font-bold text-foreground">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h3>
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-border/50 pb-1">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Item Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                          placeholder="e.g. Butter Paneer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        >
                          {MENU_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <input
                          type="checkbox"
                          checked={isVeg}
                          onChange={(e) => setIsVeg(e.target.checked)}
                          className="rounded border-border text-emerald-500 focus:ring-emerald-500 bg-background"
                        />
                        Is Vegetarian Product
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs resize-none"
                        placeholder="Enter short appetizing descriptions..."
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-border/50 pb-1">Pricing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Selling Price (₹)</label>
                        <input
                          type="number"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                          placeholder="e.g. 250"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Cost Price (₹)</label>
                        <input
                          type="text"
                          readOnly
                          value={recipeCost.toFixed(2)}
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-muted-foreground text-xs font-medium cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Profit Margin</label>
                        <input
                          type="text"
                          readOnly
                          value={price && Number(price) > 0 ? `${Math.round(((Number(price) - recipeCost) / Number(price)) * 100)}%` : "N/A"}
                          className={`w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs font-bold cursor-not-allowed ${
                            price && Number(price) - recipeCost > 0 ? "text-emerald-500" : "text-rose-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preparation */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-border/50 pb-1">Preparation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Prep Time (mins)</label>
                        <input
                          type="number"
                          required
                          value={prepTime}
                          onChange={(e) => setPrepTime(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                          placeholder="e.g. 20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Kitchen Station</label>
                        <select
                          value={kitchenStation}
                          onChange={(e) => setKitchenStation(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        >
                          <option value="Main Kitchen">Main Kitchen</option>
                          <option value="Salad Station">Salad Station</option>
                          <option value="Dessert Station">Dessert Station</option>
                          <option value="Beverage Station">Beverage Station</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Recipe Ingredients */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border/50 pb-1">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Recipe Ingredients</h4>
                      <button
                        type="button"
                        onClick={addRecipeRow}
                        className="text-xs text-emerald-500 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Add Ingredient
                      </button>
                    </div>

                    <div className="space-y-2">
                      {recipe.length === 0 ? (
                        <p className="text-center text-[10px] text-muted-foreground py-6">No ingredients mapped yet.</p>
                      ) : (
                        recipe.map((row, index) => {
                          const inv = inventory.find(i => i.id === row.ingredient_id);
                          return (
                            <div key={index} className="flex gap-2 items-center p-2 bg-background border border-border rounded-xl">
                              <select
                                value={row.ingredient_id}
                                onChange={(e) => updateRecipeRow(index, "ingredient_id", e.target.value)}
                                className="flex-1 bg-card border border-border rounded p-1.5 text-xs text-foreground focus:outline-none"
                              >
                                {inventory.map(i => (
                                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                ))}
                              </select>
                              
                              <input
                                type="number"
                                step="0.001"
                                value={row.quantity}
                                onChange={(e) => updateRecipeRow(index, "quantity", Number(e.target.value))}
                                className="w-20 bg-card border border-border rounded p-1.5 text-xs text-foreground text-center focus:outline-none"
                              />
                              
                              <span className="text-[10px] text-muted-foreground uppercase w-12 text-center">{inv?.unit}</span>

                              <button
                                type="button"
                                onClick={() => removeRecipeRow(index)}
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

                  {/* Inventory Mapping */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-border/50 pb-1">Inventory Mapping</h4>
                    <div className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl">
                      <div className="space-y-0.5 pr-4">
                        <label className="text-xs font-semibold text-foreground">Auto Deduct Inventory</label>
                        <p className="text-[10px] text-muted-foreground">Automatically deduct ingredients from inventory when this item is ordered.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={autoDeduct} 
                          onChange={(e) => setAutoDeduct(e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer (Sticky/Fixed) */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
                  >
                    {saveLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      editingId ? "Save Menu Item" : "Create Menu Item"
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
