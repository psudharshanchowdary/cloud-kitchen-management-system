"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingBag, ChefHat, Package, Settings, Box, Truck } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Custom tabs based on role
  const tabs = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ...(user.role === "Owner" || user.role === "Operations Manager" || user.role === "Head Chef"
      ? [{ name: "Orders", href: "/orders", icon: ShoppingBag }] 
      : []),
    ...(user.role === "Owner" || user.role === "Operations Manager" || user.role === "Head Chef" || user.role === "Chef" || user.role === "Kitchen Assistant"
      ? [{ name: "Kitchen Queue", href: "/kitchen", icon: ChefHat }] 
      : []),
    ...(user.role === "Owner" || user.role === "Operations Manager" || user.role === "Inventory Manager"
      ? [{ name: "Inventory", href: "/inventory", icon: Package }] 
      : []),
    ...(user.role === "Owner" || user.role === "Operations Manager" || user.role === "Packing Staff"
      ? [{ name: "Packing", href: "/packing", icon: Box }] 
      : []),
    ...(user.role === "Owner" || user.role === "Operations Manager" || user.role === "Inventory Manager"
      ? [{ name: "Supplier Deliveries", href: "/supplier-logistics", icon: Package }] 
      : []),
    ...(user.role === "Owner" || user.role === "Operations Manager"
      ? [{ name: "Delivery Ops", href: "/delivery", icon: Truck }] 
      : []),
    { name: "Settings", href: "/settings", icon: Settings }
  ].filter((t, index, self) => self.findIndex(o => o.href === t.href) === index); // Deduplicate

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-4 z-30 pb-safe">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
              isActive 
                ? "text-emerald-500" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium truncate w-full text-center">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
