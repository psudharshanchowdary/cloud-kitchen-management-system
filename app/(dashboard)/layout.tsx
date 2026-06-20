"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

const routePermissions: Record<string, string[]> = {
  "/dashboard": ["Owner", "Operations Manager", "Head Chef", "Chef", "Kitchen Assistant", "Packing Staff", "Inventory Manager", "Delivery Driver"],
  "/orders": ["Owner", "Operations Manager", "Head Chef"],
  "/kitchen": ["Owner", "Operations Manager", "Head Chef", "Chef", "Kitchen Assistant"],
  "/packing": ["Owner", "Operations Manager", "Packing Staff"],
  "/menu": ["Owner", "Operations Manager", "Head Chef"],
  "/inventory": ["Owner", "Operations Manager", "Inventory Manager"],
  "/suppliers": ["Owner", "Operations Manager", "Inventory Manager"],
  "/staff": ["Owner", "Operations Manager"],
  "/attendance": ["Owner", "Operations Manager", "Head Chef"],
  "/expenses": ["Owner", "Operations Manager"],
  "/analytics": ["Owner"],
  "/ai-assistant": ["Owner"],
  "/reports": ["Owner", "Operations Manager", "Inventory Manager"],
  "/delivery": ["Owner", "Operations Manager"],
  "/supplier-logistics": ["Owner", "Operations Manager", "Inventory Manager"],
  "/settings": ["Owner", "Operations Manager", "Head Chef", "Chef", "Kitchen Assistant", "Inventory Manager", "Packing Staff", "Delivery Driver"],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Verify route permissions
  const isAuthorized = Object.entries(routePermissions).every(([route, allowedRoles]) => {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return allowedRoles.includes(user.role);
    }
    return true;
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 mb-6 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">403 - Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          You are not authorized to view the page at <code className="text-rose-400 font-mono bg-muted px-1.5 py-0.5 rounded border border-border text-xs">{pathname}</code>.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Your current role is: <span className="font-bold text-foreground capitalize">{user.role}</span>.
        </p>
        <Link 
          href="/dashboard"
          className="mt-8 px-5 py-2.5 bg-card hover:bg-muted text-foreground font-semibold text-xs rounded-xl border border-border transition-all active:scale-95 shadow-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 md:pb-0 pb-16">
        {/* TopbarHeader */}
        <Topbar />

        {/* Dynamic Pages viewport scroll area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav - Mobile */}
      <MobileNav />
    </div>
  );
}
