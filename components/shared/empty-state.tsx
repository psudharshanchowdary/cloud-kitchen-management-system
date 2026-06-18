import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/10",
        className
      )}
    >
      <div className="p-4 bg-muted border border-border rounded-full text-muted-foreground mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {action && action}
    </div>
  );
}
