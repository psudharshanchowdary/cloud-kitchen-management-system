"use client";

import { useEffect, useState } from "react";
import { getExpensesList, recordExpense } from "@/actions/expenses";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ChartCard } from "@/components/shared/chart-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { Plus, Search, Wallet, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#71717a"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Add Expense Modal
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] as string);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await getExpensesList();
        setExpenses(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const data = {
        category,
        amount: Number(amount),
        description,
        expense_date: expenseDate
      };

      const res = await recordExpense(data);
      setExpenses([res, ...expenses]);
      toast.success("Expense logged successfully");
      setAddOpen(false);

      // Reset
      setAmount("");
      setDescription("");
      setCategory(EXPENSE_CATEGORIES[0]);
    } catch (err) {
      toast.error("Failed to log expense");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = filterCategory === "All" || e.category === filterCategory;
    const matchesSearch = (e.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate stats for Pie Chart
  const categoryTotals = expenses.reduce((acc: Record<string, number>, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const pieData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat]
  }));

  const totalExpenseVal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Running Costs" 
        description="Monitor ingredient purchases, staff payroll, rent, utilities, and daily kitchen operational costs."
        category="Kitchen Expenses"
        actions={
          <button 
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Log Expense
          </button>
        }
      />

      {/* Grid of chart and list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart Analysis */}
        <div className="lg:col-span-1">
          <ChartCard 
            title="Expenses by Category" 
            description="Operational costs distribution breakdown"
            height={300}
          >
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No expense records logged</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: "10px", color: "#a1a1aa" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Expenses List & Filter Toolbar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search raw catalog by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState 
              title="No Expenses Recorded" 
              description="Log your daily kitchen operational costs to populate analytics charts."
              icon={Wallet}
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold bg-card/50">
                      <th className="p-4">Category</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Expense Date</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-border hover:bg-muted/50 text-foreground transition-colors">
                        <td className="p-4 font-bold text-foreground">{exp.category}</td>
                        <td className="p-4 text-muted-foreground max-w-xs truncate">{exp.description || "N/A"}</td>
                        <td className="p-4 text-muted-foreground">{formatDate(exp.expense_date)}</td>
                        <td className="p-4 text-right font-bold text-rose-500">{formatCurrency(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Log Kitchen Expense"
        maxWidth="sm"
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
              form="add-expense-form"
              disabled={submitLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save expense record"
              )}
            </button>
          </>
        }
      >
        <form id="add-expense-form" onSubmit={handleRecordExpense} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            >
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Amount Spent (₹)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Expense Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              placeholder="e.g. Electric bill, Paneer stock"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
