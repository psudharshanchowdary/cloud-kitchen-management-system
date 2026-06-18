import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getColors = (val: string) => {
    const s = val.toLowerCase();
    switch (s) {
      // Order & Item Statuses
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "accepted":
      case "ordered":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "preparing":
      case "cooking":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "ready":
      case "packed":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "out for delivery":
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      case "delivered":
      case "present":
      case "received":
      case "active":
      case "paid":
      case "in stock":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "cancelled":
      case "absent":
      case "failed":
      case "out of stock":
      case "inactive":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "late":
      case "warning":
      case "running low":
      case "low stock":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
        getColors(status),
        className
      )}
    >
      {status}
    </span>
  );
}
