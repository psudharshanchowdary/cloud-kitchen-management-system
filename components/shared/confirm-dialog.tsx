"use client";

import { Modal } from "@/components/shared/modal";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-sm font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-lg",
              variant === "danger"
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10"
                : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/10"
            )}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </div>
    </Modal>
  );
}
