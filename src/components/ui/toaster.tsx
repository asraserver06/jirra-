"use client";

import { useToast } from "./use-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border text-sm transition-all duration-300 animate-in slide-in-from-bottom-5",
            t.variant === "destructive" &&
              "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200",
            t.variant === "success" &&
              "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200",
            (!t.variant || t.variant === "default") &&
              "bg-card text-card-foreground border-border"
          )}
        >
          {t.variant === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
          {t.variant === "destructive" && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
          {(!t.variant || t.variant === "default") && <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}

          <div className="flex-1">
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90 mt-0.5">{t.description}</div>}
          </div>

          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 p-1 opacity-60 hover:opacity-100 transition rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
