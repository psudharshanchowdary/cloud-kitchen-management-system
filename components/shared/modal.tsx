"use client";

import React, { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  className?: string;
}

const maxWidthMap = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
  className,
}: ModalProps) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "relative bg-card border border-border shadow-2xl rounded-2xl w-full flex flex-col overflow-hidden max-h-[90vh] z-10",
              maxWidthMap[maxWidth],
              className
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card shrink-0">
                <div className="text-base font-bold text-foreground">{title}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Sticky Footer */}
            {footer && (
              <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/30 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
