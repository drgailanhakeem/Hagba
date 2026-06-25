"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X } from "lucide-react"

const AVAILABLE_TAGS = [
  { label: "Work",        color: "bg-amber-100",   textColor: "text-amber-700"   },
  { label: "Personal",   color: "bg-amber-100",   textColor: "text-amber-700"   },
  { label: "Ideas",      color: "bg-rose-100",    textColor: "text-rose-700"    },
  { label: "Books",      color: "bg-emerald-100", textColor: "text-emerald-700" },
  { label: "Dev",        color: "bg-violet-100",  textColor: "text-violet-700"  },
  { label: "Design",     color: "bg-violet-100",  textColor: "text-violet-700"  },
  { label: "Travel",     color: "bg-emerald-100", textColor: "text-emerald-700" },
  { label: "Reference",  color: "bg-sky-100",     textColor: "text-sky-700"     },
]

export interface CapturedNote {
  title: string
  tags: { label: string; color: string; textColor: string }[]
}

interface QuickCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (note: CapturedNote) => void
}

export function QuickCaptureModal({ isOpen, onClose, onCapture }: QuickCaptureModalProps) {
  const [title, setTitle] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Drive enter/exit animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      // Focus after the browser has painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus())
      })
    } else {
      setVisible(false)
    }
  }, [isOpen])

  // Reset state each time it opens
  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setSelectedTags([])
    }
  }, [isOpen])

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim()
    if (!trimmed) return
    onCapture({
      title: trimmed,
      tags: AVAILABLE_TAGS.filter((t) => selectedTags.includes(t.label)),
    })
    onClose()
  }, [title, selectedTags, onCapture, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === "Escape") {
        onClose()
      }
    },
    [handleSubmit, onClose]
  )

  const toggleTag = useCallback((label: string) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    )
  }, [])

  if (!isOpen && !visible) return null

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick capture"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "20vh",
        backgroundColor: "rgba(28, 28, 30, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: visible ? "captureIn 0.18s ease" : "captureOut 0.14s ease forwards",
      }}
    >
      {/* Modal card */}
      <div
        style={{
          width: 520,
          maxWidth: "calc(100vw - 32px)",
          backgroundColor: "#FDFCFA",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(28,28,30,0.22), 0 4px 16px rgba(28,28,30,0.10)",
          border: "1px solid #E8E4DC",
          overflow: "hidden",
          animation: visible ? "modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : undefined,
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px 14px 18px",
            borderBottom: selectedTags.length > 0 ? "1px solid #EAE6E0" : "none",
          }}
        >
          {/* Inbox indicator dot */}
          <div
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#D97B45",
              flexShrink: 0,
            }}
          />

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought…"
            aria-label="Note title"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontFamily: "'iA Writer Quattro S', 'Georgia', serif",
              fontSize: 17,
              color: "#1C1B19",
              caretColor: "#D97B45",
            }}
          />

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: 6,
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              color: "#B8B4AC",
              flexShrink: 0,
              transition: "color 0.1s",
            }}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {/* Tag chips */}
        <div style={{ padding: "10px 18px 12px" }}>
          <p
            style={{
              fontSize: 11,
              color: "#B8B4AC",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Tags
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {AVAILABLE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.label)
              return (
                <button
                  key={tag.label}
                  onClick={() => toggleTag(tag.label)}
                  aria-pressed={isSelected}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 500,
                    border: isSelected ? "1.5px solid transparent" : "1.5px solid #E2DDD5",
                    backgroundColor: isSelected ? undefined : "transparent",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                  className={isSelected ? `${tag.color} ${tag.textColor}` : ""}
                  data-unselected={!isSelected ? "true" : undefined}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 18px 12px",
            borderTop: "1px solid #EAE6E0",
          }}
        >
          <span style={{ fontSize: 11, color: "#C8C4BC", fontFamily: "system-ui, sans-serif" }}>
            Sends to Inbox
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <kbd
              style={{
                fontSize: 10,
                color: "#9A9590",
                background: "#EDE9E2",
                border: "1px solid #D8D4CC",
                borderRadius: 4,
                padding: "1px 6px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Esc
            </kbd>
            <span style={{ fontSize: 11, color: "#C8C4BC", fontFamily: "system-ui, sans-serif" }}>to dismiss</span>
            <kbd
              style={{
                fontSize: 10,
                color: "#9A9590",
                background: "#EDE9E2",
                border: "1px solid #D8D4CC",
                borderRadius: 4,
                padding: "1px 6px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              ↵
            </kbd>
            <span style={{ fontSize: 11, color: "#C8C4BC", fontFamily: "system-ui, sans-serif" }}>to capture</span>
          </div>
        </div>
      </div>
    </div>
  )
}
