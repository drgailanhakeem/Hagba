"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"

export interface ContextMenuItem {
  /** "separator" draws a divider; otherwise a clickable row */
  type?: "item" | "separator"
  label?: string
  icon?: LucideIcon
  danger?: boolean
  disabled?: boolean
  onSelect?: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
  ariaLabel?: string
  minWidth?: number
}

/**
 * A minimal right-click context menu — white background, soft shadow, rounded
 * corners, 13px font. Closes on outside click, Escape, or scroll. Auto-flips
 * to stay inside the viewport.
 */
export function ContextMenu({ x, y, items, onClose, ariaLabel = "Context menu", minWidth = 168 }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  // Clamp to viewport after measuring the rendered size.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const pad = 8
    let left = x
    let top = y
    if (left + width + pad > window.innerWidth) left = window.innerWidth - width - pad
    if (top + height + pad > window.innerHeight) top = window.innerHeight - height - pad
    setPos({ left: Math.max(pad, left), top: Math.max(pad, top) })
  }, [x, y])

  // Dismiss on outside interaction. Attached on the next tick so the same
  // right-click that opened the menu can't immediately close it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    const id = setTimeout(() => {
      window.addEventListener("mousedown", onClose)
      window.addEventListener("scroll", onClose, true)
      window.addEventListener("resize", onClose)
      window.addEventListener("keydown", onKey)
    }, 0)
    return () => {
      clearTimeout(id)
      window.removeEventListener("mousedown", onClose)
      window.removeEventListener("scroll", onClose, true)
      window.removeEventListener("resize", onClose)
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={ariaLabel}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        zIndex: 9998,
        background: "#FFFFFF",
        border: "1px solid #E2DDD5",
        borderRadius: 9,
        boxShadow: "0 8px 28px rgba(28,27,25,0.16), 0 1px 4px rgba(28,27,25,0.06)",
        padding: 4,
        minWidth,
        fontFamily: "system-ui, sans-serif",
        animation: "fadeIn 0.1s ease",
      }}
    >
      {items.map((item, i) => {
        if (item.type === "separator") {
          return <div key={`sep-${i}`} style={{ height: 1, background: "#EDE9E2", margin: "4px 0" }} aria-hidden="true" />
        }
        const Icon = item.icon
        const color = item.danger ? "#C0392B" : "#1C1B19"
        const hover = item.danger ? "#FBECEA" : "#F3EFE8"
        return (
          <button
            key={item.label ?? i}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect?.()
              onClose()
            }}
            className="flex items-center gap-2.5 w-full text-left rounded-md"
            style={{
              padding: "7px 10px",
              fontSize: 13,
              color: item.disabled ? "#B8B4AC" : color,
              background: "transparent",
              cursor: item.disabled ? "default" : "pointer",
              opacity: item.disabled ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) (e.currentTarget as HTMLElement).style.background = hover
            }}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
