"use client";

import { Calendar } from "lucide-react";

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  customStart?: string;
  onCustomStartChange?: (val: string) => void;
  customEnd?: string;
  onCustomEndChange?: (val: string) => void;
  className?: string;
}

const PRESETS = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "Last 3 Months",
  "Last 6 Months",
  "Last 12 Months",
  "Custom"
];

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  customStart = "",
  onCustomStartChange,
  customEnd = "",
  onCustomEndChange,
  className = ""
}: PeriodSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Presets Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin whitespace-nowrap">
        {PRESETS.map((preset) => {
          const isActive = selectedPeriod === preset;
          return (
            <button
              key={preset}
              onClick={() => onPeriodChange(preset)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-[0.98] ${
                isActive
                  ? "bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                  : "bg-card hover:bg-muted/80 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Custom Date Picker Inputs */}
      {selectedPeriod === "Custom" && onCustomStartChange && onCustomEndChange && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card border border-border rounded-2xl max-w-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Custom Range:</span>
          </div>

          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => onCustomStartChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">to</span>
            <div className="flex-1">
              <input
                type="date"
                value={customEnd}
                onChange={(e) => onCustomEndChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
