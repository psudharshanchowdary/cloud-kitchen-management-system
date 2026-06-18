"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  height?: string | number;
}

export function ChartCard({
  title,
  description,
  children,
  loading = false,
  className,
  height = 320,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-card border border-border rounded-2xl p-6 glow-sm relative overflow-hidden",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-base font-bold text-foreground leading-none mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div 
        className="w-full relative flex items-center justify-center" 
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : null}
        
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
