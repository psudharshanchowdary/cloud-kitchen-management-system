"use client";

import { useAccessibility } from "@/components/accessibility-provider";
import { PageHeader } from "@/components/shared/page-header";
import { ArrowLeft, ZoomIn, Eye, Sparkles, Check, Table, Layout, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AccessibilitySettingsPage() {
  const {
    textSize,
    density,
    highContrast,
    setTextSize,
    setDensity,
    setHighContrast,
    scaleFactor,
  } = useAccessibility();

  const textSizes = [
    { value: "small", label: "Small (90%)", description: "Recommended for compact screens and high information density" },
    { value: "normal", label: "Normal (100%)", description: "Standard system font scale" },
    { value: "medium", label: "Medium (110%)", description: "Improved readability for medium displays" },
    { value: "large", label: "Large (125%)", description: "Larger sizing for relaxed reading" },
    { value: "extra-large", label: "Extra Large (140%)", description: "Maximum visibility for high accessibility needs" },
  ];

  const densities = [
    { value: "compact", label: "Compact View", description: "Denser tables, smaller margins, and reduced padding for maximum information visibility" },
    { value: "normal", label: "Normal View", description: "Default standard layout spacings" },
    { value: "comfortable", label: "Comfortable View", description: "Generous paddings, wider margins, and increased row heights for a relaxed UI feel" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Settings &gt; Accessibility</span>
      </div>

      <PageHeader
        title="Accessibility Settings"
        description="Customize typography scaling, layout densities, and contrast themes to optimize your workspace console."
        category="Accessibility"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls Section */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Text Size Control */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <ZoomIn className="h-5 w-5 text-emerald-500" /> Text Scaling System
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Adjust typography size across all sidebar items, page titles, tables, forms, charts, and notifications.
            </p>
            
            <div className="space-y-3 pt-2">
              {textSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setTextSize(size.value as any)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    textSize === size.value
                      ? "bg-muted border-emerald-500/30 text-foreground ring-1 ring-emerald-500/25"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{size.label}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{size.description}</p>
                  </div>
                  {textSize === size.value && (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Density Control */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <Layout className="h-5 w-5 text-emerald-500" /> Layout Density
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scale card spacing, table row heights, form padding, and general grid gaps for a compact or cozy workspace experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {densities.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDensity(d.value as any)}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between h-36 ${
                    density === d.value
                      ? "bg-muted border-emerald-500/30 text-foreground ring-1 ring-emerald-500/25"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">{d.label}</h4>
                    <p className="text-[9px] text-muted-foreground leading-normal">{d.description}</p>
                  </div>
                  {density === d.value && (
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center self-end mt-2">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-500" /> Contrast Mode
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Increases the luminance ratio between borders, backgrounds, inputs, and texts to maximize readable contrast ratios.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                  highContrast
                    ? "bg-muted border-emerald-500/30 text-foreground ring-1 ring-emerald-500/25"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground">High Contrast Mode</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Toggle thick borders, high-luminance text colors, and visible outline rings.</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={() => {}} // Controlled by button click
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${highContrast ? "bg-emerald-500" : "bg-muted border border-border"}`}>
                    <div
                      className={`absolute top-1 left-1 bg-white dark:bg-zinc-950 w-4 h-4 rounded-full transition-transform ${
                        highContrast ? "translate-x-5" : ""
                      }`}
                    />
                  </div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Live Preview Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 glow-sm sticky top-24 space-y-4">
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" /> Live Interface Preview
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Observe how the current configuration scale multiplier (<span className="font-mono text-emerald-500 font-bold">{(scaleFactor * 100).toFixed(0)}%</span>) affects standard component blocks.
            </p>

            <div className="space-y-4 pt-4 border-t border-border">
              {/* Preview 1: Heading & Metadata */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Typography Scale</span>
                <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">Order #QCK-1092</h1>
                <p className="text-xs text-muted-foreground">Created today at 12:45 PM &middot; Priority: <span className="text-rose-500 font-bold">High</span></p>
              </div>

              {/* Preview 2: Form & Button */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Inputs & Controls</span>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-foreground uppercase tracking-wide">Assign Courier Driver</label>
                  <select className="w-full px-3 py-2 bg-background border border-border text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option>Rajesh Kumar (Available)</option>
                    <option>Suresh Pillai (Offline)</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-2 px-3 bg-emerald-500 text-black font-semibold text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-sm">
                    Accept Order
                  </button>
                  <button className="py-2 px-3 bg-muted border border-border text-foreground font-medium text-xs rounded-xl hover:bg-accent transition-colors">
                    Reject
                  </button>
                </div>
              </div>

              {/* Preview 3: Table and Grid Rows */}
              <div className="pt-2 border-t border-border/50">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Table Rows & Grid Spacing</span>
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold text-[10px]">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border text-foreground">
                        <td className="py-2 px-3 font-semibold">Paneer Butter Masala</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">x2</td>
                        <td className="py-2 px-3 text-right font-bold">₹560</td>
                      </tr>
                      <tr className="text-foreground">
                        <td className="py-2 px-3 font-semibold">Butter Naan</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">x4</td>
                        <td className="py-2 px-3 text-right font-bold">₹160</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preview 4: Tooltip Alert */}
              <div className="pt-2 border-t border-border/50">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Popups & Messages</span>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-semibold">Warning: Kitchen Station B is currently operating at maximum order capacity limit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
