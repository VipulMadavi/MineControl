"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Re-export the raw primitives in case callers need finer control.
const AlertDialogRoot = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogClose = AlertDialogPrimitive.Close;

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Accessible confirmation modal built on Base UI's AlertDialog (no light
 * dismiss — the user must choose). Controlled via `open` / `onOpenChange`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
          )}
        />
        <AlertDialogPrimitive.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl outline-none",
            "flex flex-col gap-2 transition-all duration-200",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
          )}
        >
          <AlertDialogPrimitive.Title className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </AlertDialogPrimitive.Description>
          )}
          <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <AlertDialogClose
              render={
                <Button variant="outline" className="h-10 px-4 text-sm font-semibold">
                  {cancelLabel}
                </Button>
              }
            />
            <Button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={cn(
                "h-10 px-4 text-sm font-semibold text-white",
                destructive
                  ? "bg-rose-600/90 hover:bg-rose-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              )}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogRoot>
  );
}

export { AlertDialogRoot, AlertDialogTrigger, AlertDialogClose };
