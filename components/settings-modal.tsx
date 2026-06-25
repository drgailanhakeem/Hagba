"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  User,
  Paintbrush,
  Type,
  Timer,
  Keyboard,
  Info,
  X,
  Check,
} from "lucide-react"

// ── Settings model ──────────────────────────────────────────────────────────
export interface Settings {
  name: string
  email: string
  startupView: "inbox" | "notes" | "todos"
  accent: string
  editorFontSize: "small" | "medium" | "large"
  lineSpacing: "compact" | "normal" | "relaxed"
  spellcheck: boolean
  showWordCount: boolean
  confirmDelete: boolean
  pomodoroFocus: number
  pomodoroBreak: number
}

export const DEFAULT_SETTINGS: Settings = {
  name: "Gailan Hakeem",
  email: "hello@hagba.app",
  startupView: "notes",
  accent: "#D97B45",
  editorFontSize: "medium",
  lineSpacing: "normal",
  spellcheck: true,
  showWordCount: true,
  confirmDelete: true,
  pomodoroFocus: 25,
  pomodoroBreak: 5,
}

const ACCENTS: { id: string; label: string; hex: string }[] = [
  { id: "amber", label: "Amber", hex: "#D97B45" },
  { id: "blue", label: "Blue", hex: "#2F6FED" },
  { id: "green", label: "Green", hex: "#3DAA6E" },
  { id: "red", label: "Red", hex: "#C0392B" },
  { id: "pink", label: "Rose", hex: "#D9457B" },
  { id: "graphite", label: "Graphite", hex: "#4B5563" },
]

type CategoryId =
  | "general"
  | "appearance"
  | "editor"
  | "pomodoro"
  | "shortcuts"
  | "about"

const CATEGORIES: { id: CategoryId; label: string; icon: typeof User }[] = [
  { id: "general", label: "General", icon: User },
  { id: "appearance", label: "Appearance", icon: Paintbrush },
  { id: "editor", label: "Editor", icon: Type },
  { id: "pomodoro", label: "Focus Timer", icon: Timer },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "about", label: "About", icon: Info },
]

interface SettingsModalProps {
  open: boolean
  settings: Settings
  onChange: (next: Settings) => void
  onClose: () => void
  onReset: () => void
}

// ── Small reusable primitives ───────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  accent,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  accent: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        padding: 2,
        flexShrink: 0,
        backgroundColor: checked ? accent : "#D8D4CC",
        transition: "background-color 0.15s ease",
        display: "flex",
        justifyContent: checked ? "flex-end" : "flex-start",
        alignItems: "center",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transition: "transform 0.15s ease",
        }}
      />
    </button>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  accent,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  accent: string
  ariaLabel: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-1 rounded-lg"
      style={{ background: "#E8E4DC", padding: 3 }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            style={{
              fontSize: 12.5,
              fontFamily: "system-ui, sans-serif",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#1C1B19" : "#787470",
              background: isActive ? "#FAF9F7" : "transparent",
              boxShadow: isActive ? "0 1px 2px rgba(28,27,25,0.1)" : "none",
              border: "none",
              borderRadius: 6,
              padding: "5px 12px",
              cursor: "pointer",
              transition: "background-color 0.12s ease, color 0.12s ease",
            }}
          >
            {isActive && (
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: accent,
                  marginRight: 6,
                  verticalAlign: "middle",
                }}
              />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Row({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-6 py-3.5"
      style={{ borderBottom: "1px solid #EDE9E2" }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13.5, color: "#1C1B19", fontWeight: 500 }}>{title}</p>
        {description && (
          <p style={{ fontSize: 12.5, color: "#9A9590", marginTop: 2, lineHeight: 1.45 }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.07em",
        color: "#B8B4AC",
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        marginBottom: 2,
        marginTop: 4,
      }}
    >
      {children}
    </h3>
  )
}

const textInputStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "#1C1B19",
  background: "#FAF9F7",
  border: "1px solid #E2DDD5",
  borderRadius: 7,
  padding: "7px 10px",
  fontFamily: "system-ui, sans-serif",
  outline: "none",
  width: 220,
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function SettingsModal({
  open,
  settings,
  onChange,
  onClose,
  onReset,
}: SettingsModalProps) {
  const [category, setCategory] = useState<CategoryId>("general")
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [open, onClose])

  const set = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      onChange({ ...settings, [key]: value })
    },
    [settings, onChange],
  )

  if (!open) return null

  const accent = settings.accent

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(28,27,25,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "captureIn 0.15s ease",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="flex overflow-hidden"
        style={{
          width: "100%",
          maxWidth: 760,
          height: "100%",
          maxHeight: 560,
          background: "#FAF9F7",
          borderRadius: 16,
          boxShadow: "0 24px 70px rgba(28,27,25,0.45)",
          animation: "modalSlideIn 0.18s ease",
        }}
      >
        {/* Left rail */}
        <nav
          aria-label="Settings categories"
          className="flex flex-col"
          style={{
            width: 196,
            flexShrink: 0,
            background: "#F0EDE8",
            borderRight: "1px solid #E2DDD5",
            padding: "18px 10px",
          }}
        >
          <p
            className="uppercase px-2"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "#9A9590",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Settings
          </p>
          <div className="flex flex-col gap-0.5">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const isActive = id === category
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  aria-current={isActive ? "true" : undefined}
                  className="icon-btn flex items-center gap-2.5 rounded-lg text-left"
                  style={{
                    padding: "8px 10px",
                    fontSize: 13,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#1C1B19" : "#5E5A55",
                    background: isActive ? "#E4E0D9" : "transparent",
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.9}
                    style={{ color: isActive ? accent : "#9A9590", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  {label}
                </button>
              )
            })}
          </div>

          <button
            onClick={onReset}
            className="icon-btn mt-auto flex items-center justify-center rounded-lg"
            style={{
              padding: "8px 10px",
              fontSize: 12.5,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
              color: "#9A9590",
              background: "transparent",
              border: "1px solid #E2DDD5",
            }}
          >
            Reset to defaults
          </button>
        </nav>

        {/* Content */}
        <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 22px", borderBottom: "1px solid #E2DDD5" }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1C1B19" }}>
              {CATEGORIES.find((c) => c.id === category)?.label}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="icon-btn flex items-center justify-center rounded-lg"
              style={{ width: 30, height: 30, color: "#9A9590", background: "transparent" }}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {/* Scroll body */}
          <div
            className="flex-1 overflow-y-auto editor-scroll"
            style={{ padding: "10px 22px 22px" }}
          >
            {/* GENERAL */}
            {category === "general" && (
              <div className="flex flex-col">
                <div className="flex items-center gap-3.5" style={{ padding: "16px 0 6px" }}>
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-center"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: accent,
                      color: "#FAF9F7",
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                      flexShrink: 0,
                    }}
                  >
                    {settings.name.trim().charAt(0).toUpperCase() || "H"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1B19" }}>
                      {settings.name || "Your name"}
                    </p>
                    <p style={{ fontSize: 13, color: "#9A9590" }}>{settings.email}</p>
                  </div>
                </div>

                <div style={{ height: 12 }} />
                <SectionTitle>Profile</SectionTitle>
                <Row title="Display name" description="Shown across your workspace.">
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => set("name", e.target.value)}
                    aria-label="Display name"
                    style={textInputStyle}
                  />
                </Row>
                <Row title="Email" description="Used for account and sync.">
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => set("email", e.target.value)}
                    aria-label="Email"
                    style={textInputStyle}
                  />
                </Row>

                <div style={{ height: 18 }} />
                <SectionTitle>Behavior</SectionTitle>
                <Row title="Startup view" description="Where Hagba opens each session.">
                  <Segmented
                    ariaLabel="Startup view"
                    accent={accent}
                    value={settings.startupView}
                    onChange={(v) => set("startupView", v)}
                    options={[
                      { value: "inbox", label: "Inbox" },
                      { value: "notes", label: "Notes" },
                      { value: "todos", label: "To-Dos" },
                    ]}
                  />
                </Row>
                <Row
                  title="Confirm before deleting"
                  description="Ask for confirmation when removing notes or tasks."
                >
                  <Toggle
                    label="Confirm before deleting"
                    accent={accent}
                    checked={settings.confirmDelete}
                    onChange={(v) => set("confirmDelete", v)}
                  />
                </Row>
              </div>
            )}

            {/* APPEARANCE */}
            {category === "appearance" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Accent color</SectionTitle>
                <p style={{ fontSize: 12.5, color: "#9A9590", margin: "2px 0 12px", lineHeight: 1.45 }}>
                  Applies to highlights, the focus ring, and the editor caret.
                </p>
                <div className="flex items-center gap-3" style={{ paddingBottom: 8 }}>
                  {ACCENTS.map((a) => {
                    const isActive = settings.accent.toLowerCase() === a.hex.toLowerCase()
                    return (
                      <button
                        key={a.id}
                        onClick={() => set("accent", a.hex)}
                        aria-label={a.label}
                        aria-pressed={isActive}
                        title={a.label}
                        className="flex items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: a.hex,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: isActive
                            ? `0 0 0 2px #FAF9F7, 0 0 0 4px ${a.hex}`
                            : "none",
                          transition: "box-shadow 0.12s ease",
                        }}
                      >
                        {isActive && (
                          <Check size={16} strokeWidth={3} color="#FFFFFF" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div style={{ height: 20 }} />
                <SectionTitle>Preview</SectionTitle>
                <div
                  style={{
                    marginTop: 8,
                    border: "1px solid #E2DDD5",
                    borderRadius: 10,
                    padding: 16,
                    background: "#FFFEFA",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'iA Writer Quattro S', Georgia, serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#1C1B19",
                      marginBottom: 6,
                    }}
                  >
                    A calm place to think
                  </p>
                  <p
                    style={{
                      fontFamily: "'iA Writer Quattro S', Georgia, serif",
                      fontSize: 14,
                      color: "#2C2A27",
                      lineHeight: 1.6,
                    }}
                  >
                    Capture a thought, then{" "}
                    <span style={{ color: accent, fontWeight: 600 }}>highlight</span> what matters.
                  </p>
                  <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#FAF9F7",
                        background: accent,
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      Accent
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: accent,
                        border: `1px solid ${accent}`,
                        borderRadius: 999,
                        padding: "3px 10px",
                      }}
                    >
                      Outline
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* EDITOR */}
            {category === "editor" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Typography</SectionTitle>
                <Row title="Font size" description="Text size in the note editor.">
                  <Segmented
                    ariaLabel="Editor font size"
                    accent={accent}
                    value={settings.editorFontSize}
                    onChange={(v) => set("editorFontSize", v)}
                    options={[
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ]}
                  />
                </Row>
                <Row title="Line spacing" description="Vertical rhythm of long-form prose.">
                  <Segmented
                    ariaLabel="Line spacing"
                    accent={accent}
                    value={settings.lineSpacing}
                    onChange={(v) => set("lineSpacing", v)}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "normal", label: "Normal" },
                      { value: "relaxed", label: "Relaxed" },
                    ]}
                  />
                </Row>

                <div style={{ height: 18 }} />
                <SectionTitle>Writing</SectionTitle>
                <Row title="Spellcheck" description="Underline misspelled words while typing.">
                  <Toggle
                    label="Spellcheck"
                    accent={accent}
                    checked={settings.spellcheck}
                    onChange={(v) => set("spellcheck", v)}
                  />
                </Row>
                <Row title="Word count" description="Show live word count in the editor footer.">
                  <Toggle
                    label="Word count"
                    accent={accent}
                    checked={settings.showWordCount}
                    onChange={(v) => set("showWordCount", v)}
                  />
                </Row>
              </div>
            )}

            {/* POMODORO */}
            {category === "pomodoro" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Focus Timer</SectionTitle>
                <Row title="Focus length" description="Minutes per focus session.">
                  <Segmented
                    ariaLabel="Focus length"
                    accent={accent}
                    value={String(settings.pomodoroFocus)}
                    onChange={(v) => set("pomodoroFocus", Number(v))}
                    options={[
                      { value: "15", label: "15m" },
                      { value: "25", label: "25m" },
                      { value: "50", label: "50m" },
                    ]}
                  />
                </Row>
                <Row title="Break length" description="Minutes per short break.">
                  <Segmented
                    ariaLabel="Break length"
                    accent={accent}
                    value={String(settings.pomodoroBreak)}
                    onChange={(v) => set("pomodoroBreak", Number(v))}
                    options={[
                      { value: "5", label: "5m" },
                      { value: "10", label: "10m" },
                      { value: "15", label: "15m" },
                    ]}
                  />
                </Row>
              </div>
            )}

            {/* SHORTCUTS */}
            {category === "shortcuts" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Keyboard shortcuts</SectionTitle>
                <div style={{ height: 6 }} />
                {[
                  { keys: ["⌘", "K"], action: "Quick capture" },
                  { keys: ["⌘", "N"], action: "New note" },
                  { keys: ["⌘", "F"], action: "Search notes" },
                  { keys: ["⌘", ","], action: "Open settings" },
                  { keys: ["Esc"], action: "Close dialog" },
                  { keys: ["/"], action: "Slash command menu" },
                  { keys: ["#"], action: "Insert a tag" },
                ].map((s) => (
                  <div
                    key={s.action}
                    className="flex items-center justify-between"
                    style={{ padding: "10px 0", borderBottom: "1px solid #EDE9E2" }}
                  >
                    <span style={{ fontSize: 13.5, color: "#2C2A27" }}>{s.action}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          style={{
                            background: "#EDE9E2",
                            border: "1px solid #D8D4CC",
                            borderRadius: 5,
                            padding: "2px 7px",
                            fontSize: 12,
                            color: "#5E5A55",
                            fontFamily: "system-ui, sans-serif",
                            minWidth: 22,
                            textAlign: "center",
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ABOUT */}
            {category === "about" && (
              <div className="flex flex-col items-center" style={{ padding: "32px 0", textAlign: "center" }}>
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: accent,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      color: "#FAF9F7",
                      fontSize: 30,
                      fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    H
                  </span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#1C1B19" }}>Hagba</p>
                <p style={{ fontSize: 13, color: "#9A9590", marginTop: 2 }}>Version 1.0.0</p>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "#787470",
                    marginTop: 16,
                    maxWidth: 320,
                    lineHeight: 1.6,
                  }}
                >
                  A calm space to capture thoughts, focus, and get things done. Notes, tasks, and
                  tags in one quiet place.
                </p>
                <p style={{ fontSize: 12, color: "#B8B4AC", marginTop: 24 }}>
                  Crafted with care · {new Date().getFullYear()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
