"use client";

import { useEffect, useState } from "react";
import { getActivityLogsList } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatTime } from "@/lib/utils";
import { User, Shield, Key, ListFilter, ClipboardList, Moon, Sun, Sliders } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const list = await getActivityLogsList();
        // Sort logs descending
        setLogs(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Settings & Audit" 
        description="Manage your user profile, interface theme configs, and check recent activity audit logs."
        category="Configuration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Theme */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Profile card */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-500" /> Active Profile
            </h3>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold text-foreground uppercase text-lg border border-border">
                {user.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">{user.name}</h4>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{user.role}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Email Address:</span>
                <span className="text-foreground font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact Phone:</span>
                <span className="text-foreground font-medium">{user.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Portal Status:</span>
                <span className="text-emerald-500 font-bold">Active</span>
              </div>
            </div>
          </div>

          {/* Theme setting card */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <Moon className="h-5 w-5 text-emerald-500" /> Interface Preference
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Toggle dark and light modes for the console console windows.</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  theme === "light"
                    ? "bg-muted text-emerald-500 border-emerald-500/20"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Sun className="h-4 w-4" /> Light Mode
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  theme === "dark"
                    ? "bg-muted text-emerald-500 border-emerald-500/20"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Moon className="h-4 w-4" /> Dark Mode
              </button>
            </div>
          </div>

          {/* Accessibility Settings Card */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-500" /> Accessibility Settings
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Configure global text size scaling, compact or comfortable layout spacing densities, and high contrast options.
            </p>
            <Link
              href="/settings/accessibility"
              className="w-full flex items-center justify-center py-2.5 px-4 bg-muted hover:bg-accent border border-border text-foreground rounded-xl text-xs font-semibold transition-all"
            >
              Open Accessibility Controls
            </Link>
          </div>

        </div>

        {/* Audit Logs list */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 glow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-500" /> Security Audit Trail
              </h3>
              <p className="text-xs text-muted-foreground">Chronological list of recent security actions and portal events</p>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : logs.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-12">No recent audit logs available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold">
                    <th className="pb-3 pr-2">Event Timestamp</th>
                    <th className="pb-3 px-2">Operator</th>
                    <th className="pb-3 px-2">Designation</th>
                    <th className="pb-3 px-2">Action type</th>
                    <th className="pb-3 pl-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border text-foreground">
                      <td className="py-3 pr-2 text-muted-foreground font-mono text-[10px]">
                        {formatDate(log.created_at)} {formatTime(log.created_at)}
                      </td>
                      <td className="py-3 px-2 font-bold text-foreground">{log.user_name}</td>
                      <td className="py-3 px-2 text-muted-foreground capitalize">{log.role.toLowerCase()}</td>
                      <td className="py-3 px-2">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground font-bold uppercase tracking-wider">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-muted-foreground leading-normal max-w-xs truncate">{log.details || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
