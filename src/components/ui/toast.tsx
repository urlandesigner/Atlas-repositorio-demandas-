"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastVariant = "success" | "default"

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
  leaving?: boolean
}

interface ToastContextValue {
  toast: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const DEFAULT_DURATION = 2800

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, leaving: true } : item)))
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 180)
  }, [])

  const toast = useCallback<ToastContextValue["toast"]>(
    (message, options) => {
      const id = (counter.current += 1)
      const variant = options?.variant ?? "default"
      setToasts((prev) => [...prev, { id, message, variant }])
      window.setTimeout(() => dismiss(id), options?.duration ?? DEFAULT_DURATION)
    },
    [dismiss]
  )

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        role="region"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-[0_8px_24px_rgba(15,23,42,0.18)]",
              item.leaving
                ? "animate-out fade-out-0 slide-out-to-bottom-2 duration-150"
                : "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
            )}
          >
            {item.variant === "success" ? (
              <span className="flex size-4 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : null}
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
