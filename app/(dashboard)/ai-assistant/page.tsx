"use client";

import { useState } from "react";
import { queryAssistant } from "@/actions/ai-assistant";
import { PageHeader } from "@/components/shared/page-header";
import { Sparkles, Send, ChefHat, User, ArrowRight, CornerDownLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";

const suggestions = [
  { text: "Give me today's summary", desc: "Operations & sales checklist" },
  { text: "Compare today with yesterday", desc: "Daily gross billings analytics" },
  { text: "Which chef performed best?", desc: "Kitchen staff order tallies" },
  { text: "What inventory is low?", desc: "Procurement stock alerts" },
  { text: "What should be purchased tomorrow?", desc: "Recommended reorder quantities" },
  { text: "Why are orders delayed?", desc: "Workload bottleneck diagnostics" },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI-powered Business Intelligence Assistant for Queen's Cloud Kitchen. I can analyze raw orders, daily staff attendance, kitchen prep metrics, and stock sheets to answer questions. Try selecting a query below or type your own!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    const userMsg = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await queryAssistant(textToSend);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I encountered an error analyzing operations. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 h-[82vh] flex flex-col justify-between">
      <PageHeader 
        title="AI Business Assistant" 
        description="Ask operational questions, analyze kitchen rush trends, and get stock procurement forecasts."
        category="Artificial Intelligence"
      />

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-card border border-border rounded-2xl p-6 overflow-y-auto space-y-4 scrollbar-thin">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === "assistant";
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-2xl ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center border font-bold text-xs ${
                isAssistant 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-muted text-foreground border-border"
              }`}>
                {isAssistant ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                isAssistant 
                  ? "bg-background border-border text-foreground" 
                  : "bg-emerald-500 text-black border-transparent font-medium"
              }`}>
                {/* Render simple markdown lines */}
                {msg.content.split("\n").map((line: string, i: number) => {
                  if (line.startsWith("###")) {
                    return <h3 key={i} className="text-sm font-bold text-foreground mb-2 pt-2 first:pt-0">{line.replace("###", "").trim()}</h3>;
                  }
                  if (line.startsWith("*")) {
                    return <p key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500 mb-1.5">{line.replace("*", "").trim()}</p>;
                  }
                  return <p key={i} className="mb-2 last:mb-0">{line}</p>;
                })}
              </div>
            </motion.div>
          );
        })}
        {loading && (
          <div className="flex gap-3 max-w-lg mr-auto">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="p-4 bg-background border border-border text-muted-foreground rounded-2xl text-xs flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
              <span>Analyzing kitchen ledger datasets...</span>
            </div>
          </div>
        )}
      </div>

      {/* Query Suggestions Box (Only visible when user has no input/recent convo is starting) */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {suggestions.map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => handleSubmit(s.text)}
              className="text-left p-3 bg-card border border-border hover:border-emerald-500/30 rounded-xl hover:bg-card/60 transition-all text-xs card-hover"
            >
              <span className="block font-bold text-foreground truncate">{s.text}</span>
              <span className="block text-[10px] text-muted-foreground truncate mt-0.5">{s.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(input)}
          placeholder="Ask AI about best performing chef, today's revenue, or what to purchase..."
          className="w-full pl-4 pr-16 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-all shadow-inner"
        />
        <button
          onClick={() => handleSubmit(input)}
          disabled={loading || !input.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-muted disabled:text-muted-foreground text-black rounded-lg transition-all active:scale-95"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
