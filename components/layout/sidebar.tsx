"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";
import { 
  LayoutDashboard, ShoppingBag, ChefHat, Menu as MenuIcon, 
  Package, Users, CalendarDays, Wallet, Truck, Box, 
  BarChart3, Sparkles, FileText, Settings, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Complete list of navigation items
const allNavItems = [
  { name: "Kitchen Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["Owner", "Operations Manager", "Head Chef", "Chef", "Kitchen Assistant", "Packing Staff", "Inventory Manager", "Delivery Driver"] },
  { name: "Orders", href: "/orders", icon: ShoppingBag, roles: ["Owner", "Operations Manager", "Head Chef"] },
  { name: "Kitchen Queue", href: "/kitchen", icon: ChefHat, roles: ["Owner", "Operations Manager", "Head Chef", "Chef", "Kitchen Assistant"] },
  { name: "Packing", href: "/packing", icon: Box, roles: ["Owner", "Operations Manager", "Packing Staff"] },
  { name: "Menu Manager", href: "/menu", icon: MenuIcon, roles: ["Owner", "Operations Manager", "Head Chef"] },
  { name: "Inventory", href: "/inventory", icon: Package, roles: ["Owner", "Operations Manager", "Inventory Manager"] },
  { name: "Suppliers & POs", href: "/suppliers", icon: Truck, roles: ["Owner", "Operations Manager", "Inventory Manager"] },
  { name: "Team Members", href: "/staff", icon: Users, roles: ["Owner", "Operations Manager"] },
  { name: "Attendance", href: "/attendance", icon: CalendarDays, roles: ["Owner", "Operations Manager", "Head Chef"] },
  { name: "Running Costs", href: "/expenses", icon: Wallet, roles: ["Owner", "Operations Manager"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["Owner"] },
  { name: "Daily Kitchen Briefing", href: "/ai-assistant", icon: Sparkles, roles: ["Owner"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["Owner", "Operations Manager", "Inventory Manager"] },
  { name: "Supplier Deliveries", href: "/supplier-logistics", icon: Package, roles: ["Owner", "Operations Manager", "Inventory Manager"] },
  { name: "Delivery Operations", href: "/delivery", icon: Truck, roles: ["Owner", "Operations Manager"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["Owner", "Operations Manager", "Head Chef", "Chef", "Kitchen Assistant", "Inventory Manager", "Packing Staff", "Delivery Driver"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logout);
  const { sidebarOpen, toggleSidebar } = useUIStore();

  if (!user) return null;

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.success) {
      logoutUser();
      toast.success("Logged out successfully");
      router.push("/login");
    } else {
      toast.error("Failed to log out");
    }
  };

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 relative z-30",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-bold shrink-0">
            👑
          </div>
          {sidebarOpen && (
            <span className="font-bold text-sm text-foreground tracking-wide truncate">
              Queen's Kitchen
            </span>
          )}
        </div>
        
        {/* Toggle Collapse */}
        <button 
          onClick={toggleSidebar}
          className="h-6 w-6 rounded-md bg-muted hover:bg-accent flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-all absolute -right-3 top-5"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105", isActive ? "text-emerald-500" : "text-muted-foreground")} />
              {sidebarOpen && <span className="truncate">{item.name}</span>}
              {!sidebarOpen && (
                <div className="absolute left-16 bg-popover text-popover-foreground text-xs py-1.5 px-3 rounded-lg border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session Bottom Area */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className={cn("flex items-center gap-3 overflow-hidden", sidebarOpen ? "px-2" : "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground shrink-0 uppercase border border-border">
            {user.name.charAt(0)}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          )}
          {sidebarOpen && (
            <button 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {!sidebarOpen && (
          <button 
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center text-muted-foreground hover:text-rose-500 py-2 rounded-xl hover:bg-muted transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
