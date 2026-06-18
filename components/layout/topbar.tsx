"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { getNotificationsList, markNotificationAsRead } from "@/actions/settings";
import { logoutAction } from "@/actions/auth";
import { clockIn, clockOut, getAttendanceToday } from "@/actions/attendance";
import { cn } from "@/lib/utils";
import { Bell, LogOut, Sun, Moon, Power, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function Topbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logout);
  const { notifications, setNotifications, markRead } = useNotificationStore();
  
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Sync attendance state on load
  useEffect(() => {
    if (!user) return;
    const checkAttendance = async () => {
      try {
        const attendance = await getAttendanceToday();
        const myRecord = attendance.find(a => a.staff_id === user.id || a.staff_name === user.name);
        if (myRecord) {
          setClockedIn(!!myRecord.clock_in && !myRecord.clock_out);
        }
      } catch (err) {
        console.error("Attendance sync error", err);
      }
    };
    checkAttendance();
  }, [user]);

  // Load notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const list = await getNotificationsList();
        // Display only unread notifications or last 5
        setNotifications(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.error("Notifications fetch error", err);
      }
    };
    fetchNotifs();
  }, [setNotifications]);

  if (!user) return null;

  const handleClockToggle = async () => {
    setClockLoading(true);
    try {
      if (!clockedIn) {
        const res = await clockIn(user.id);
        setClockedIn(true);
        toast.success(`Clocked in successfully at ${res.clock_in}`);
      } else {
        const res = await clockOut(user.id);
        setClockedIn(false);
        toast.success(`Clocked out successfully at ${res.clock_out}. Hours worked: ${res.working_hours}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Attendance update failed");
    } finally {
      setClockLoading(false);
    }
  };

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

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      markRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search/Breadcrumb placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Portal</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs font-semibold text-emerald-500 capitalize">{user.role}</span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4">
        {/* Clock In / Out Quick Button */}
        <button
          onClick={handleClockToggle}
          disabled={clockLoading}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
            clockedIn
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-muted text-muted-foreground border-border hover:bg-accent hover:text-foreground"
          )}
        >
          <Power className={cn("h-3.5 w-3.5", clockedIn ? "text-emerald-500" : "text-zinc-500")} />
          {clockedIn ? "Clocked In" : "Clock In"}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-[10px] text-black font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl p-2 z-50">
              <div className="flex justify-between items-center p-2 border-b border-border mb-2">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-[10px] text-muted-foreground py-6">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all",
                        n.is_read
                          ? "bg-muted/40 border-transparent text-muted-foreground"
                          : "bg-muted border-border text-foreground"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider",
                          n.type === "CRITICAL" && "text-rose-500",
                          n.type === "WARNING" && "text-amber-500",
                          n.type === "SUCCESS" && "text-emerald-500",
                          n.type === "INFO" && "text-blue-500"
                        )}>
                          {n.type}
                        </span>
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[9px] text-emerald-500 hover:underline shrink-0"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-muted-foreground block mt-1">
                        {new Date(n.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric", hour12: true })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile avatar info / Log out */}
        <button
          onClick={handleLogout}
          className="p-2 bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
