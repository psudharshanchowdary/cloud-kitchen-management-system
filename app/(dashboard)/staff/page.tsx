"use client";

import { useEffect, useState } from "react";
import { getStaffList, createStaffMember, updateStaffMember } from "@/actions/staff";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";
import { Plus, Search, Mail, Phone, Calendar, User, X, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/auth-store";

export default function StaffPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  // Add Staff Modal
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<any>(USER_ROLES.CHEF);
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await getStaffList();
        setStaff(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }

    setSubmitLoading(true);
    try {
      const data = {
        name,
        email,
        phone,
        role,
        salary: Number(salary),
        joining_date: joiningDate,
        status: "Active" as any,
        user_id: "" // auto-generated
      };

      const res = await createStaffMember(data);
      setStaff([...staff, res]);
      toast.success(`${res.name} added to staff roster`);
      setAddOpen(false);

      // Reset
      setName("");
      setEmail("");
      setPhone("");
      setRole(USER_ROLES.CHEF);
      setSalary("");
    } catch (err) {
      toast.error("Failed to add staff member");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const updated = await updateStaffMember(id, { status: newStatus as any });
      setStaff(staff.map(s => s.id === id ? updated : s));
      toast.success(`Staff member set to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesRole = filterRole === "All" || s.role === filterRole;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-8 relative min-h-[80vh]">
      <PageHeader 
        title="Team Members" 
        description="Oversee cloud kitchen staff, assign roles, and monitor rosters."
        category="Kitchen Crew"
        actions={
          <button 
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Team Member
          </button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setFilterRole("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterRole === "All"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            All Roles
          </button>
          {Object.values(USER_ROLES).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterRole === role
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of cards */}
      {loading ? (
        <TableSkeleton />
      ) : filteredStaff.length === 0 ? (
        <EmptyState 
          title="No Staff Found" 
          description="Register your chefs, managers, and packing staff to begin scheduling shifts."
          icon={Plus}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border rounded-2xl p-5 glow-sm card-hover flex flex-col justify-between ${
                member.status === "Active" ? "border-border" : "border-border opacity-60"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground uppercase border border-border">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground block">{member.name}</h4>
                      <span className="text-[10px] text-muted-foreground block capitalize">
                        {member.role === "Owner" ? "Business Owner" : member.role.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Joined: {formatDate(member.joining_date)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Monthly Salary</span>
                  <span className="font-bold text-foreground">
                    {member.role === "Owner" ? "Business Profit Share Owner" : formatCurrency(member.salary)}
                  </span>
                </div>

                {member.role === "Owner" && currentUser?.role !== "Owner" ? (
                  <span className="text-[10px] text-muted-foreground italic font-medium px-2 py-1 bg-background border border-border rounded-lg">
                    Protected (Owner)
                  </span>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(member.id, member.status)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold text-[10px] transition-colors ${
                      member.status === "Active"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                    }`}
                  >
                    {member.status === "Active" ? "Suspend member" : "Activate member"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Team Member"
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
              form="add-staff-form"
              disabled={submitLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save & Assign Portal"
              )}
            </button>
          </>
        }
      >
        <form id="add-staff-form" onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              placeholder="e.g. Sanjay Kapoor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                placeholder="e.g. chef@queenskitchen.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                placeholder="e.g. 9840123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => {
                  const val = e.target.value;
                  setRole(val);
                  if (val === "Owner") {
                    setSalary("0");
                  }
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              >
                {Object.values(USER_ROLES)
                  .filter(r => r !== "Owner" || currentUser?.role === "Owner")
                  .map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                required
                disabled={role === "Owner"}
                value={role === "Owner" ? "0" : salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={role === "Owner" ? "Profit Share" : "e.g. 45000"}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Joining Date</label>
            <input
              type="date"
              required
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
