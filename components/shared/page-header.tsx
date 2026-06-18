import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  category?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  category,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border mb-6", className)}>
      <div className="space-y-1">
        {category && (
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">
            {category}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
