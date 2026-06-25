"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  User,
  Paintbrush,
  Timer,
  ShieldAlert,
  X,
  Check,
  Camera,
  Loader2,
  LogOut,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react"
import type { UserSettings } from "@/lib/db"

const ACCENTS: { id: string; label: string; hex: string }[] = [
  { id: "amber", label: "Amber", hex: "#D97B45" },
  { id: "blue", label: "Blue", hex: "#2F6FED" },
  { id: "green", label: "Green", hex: "#3DAA6E" },
  { id: "red", label: "Red", hex: "#C0392B" },
  { id: "pink", label: "Rose", hex: "#D9457B" },
  { id: "graphite", label: "Graphite", hex: "#4B5563" },
]

type CategoryId = "profile" | "appearance" | "pomodoro" | "account"

const CATEGORIES: { id: CategoryId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Paintbrush },
  { id: "pomodoro", label: "Pomodoro", icon: Timer },
  { id: "account", label: "Account", icon: ShieldAlert },
]

interface SettingsModalProps {
  open: boolean
  settings: UserSettings
  email: string
  onChange: (next: UserSettings) => void
  onClose: () => void
  onUploadAvatar: (file: File) => Promise<void>
  onSignOut: () => void
  onDeleteAccount: () => Promise<void>
  avatarUploading?: boolean
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

function Stepper({
  value,
  min,
  max,
  onChange,
  accent,
  label,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  accent: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Decrease ${label}`}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: "#EDE9E2",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
          color: "#2C2A27",
          lineHeight: 1,
        }}
      >
        −
      </button>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#1C1B19",
          fontFamily: "system-ui, sans-serif",
          width: 44,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
        <span style={{ fontSize: 11, color: "#9A9590", marginLeft: 2 }}>m</span>
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`Increase ${label}`}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: accent,
          border: "none",
          cursor: "pointer",
          fontSize: 16,
          color: "#FFFFFF",
          lineHeight: 1,
        }}
      >
        +
      </button>
    </div>
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
  email,
  onChange,
  onClose,
  onUploadAvatar,
  onSignOut,
  onDeleteAccount,
  avatarUploading = false,
}: SettingsModalProps) {
  const [category, setCategory] = useState<CategoryId>("profile")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  // Reset the delete confirmation whenever the modal opens/closes or tab changes
  useEffect(() => {
    setConfirmDelete(false)
  }, [open, category])

  const set = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      onChange({ ...settings, [key]: value })
    },
    [settings, onChange],
  )

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (file) await onUploadAvatar(file)
    },
    [onUploadAvatar],
  )

  if (!open) return null

  const accent = settings.accentColor
  const initial = (settings.displayName.trim().charAt(0) || email.charAt(0) || "H").toUpperCase()

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
            {/* PROFILE */}
            {category === "profile" && (
              <div className="flex flex-col">
                <div className="flex items-center gap-4" style={{ padding: "16px 0 6px" }}>
                  {/* Avatar with upload */}
                  <button
                    onClick={() => fileRef.current?.click()}
                    aria-label="Upload profile photo"
                    className="relative flex items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: settings.avatarUrl ? "transparent" : accent,
                      color: "#FAF9F7",
                      fontSize: 26,
                      fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                      flexShrink: 0,
                      border: "none",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    {settings.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.avatarUrl || "/placeholder.svg"}
                        alt="Your profile photo"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      initial
                    )}
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-center"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(28,27,25,0.42)",
                        opacity: avatarUploading ? 1 : 0,
                        transition: "opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.opacity = avatarUploading ? "1" : "0")
                      }
                    >
                      {avatarUploading ? (
                        <Loader2 size={20} className="animate-spin" color="#FFFFFF" />
                      ) : (
                        <Camera size={20} color="#FFFFFF" />
                      )}
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="sr-only"
                    aria-hidden="true"
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1B19" }}>
                      {settings.displayName || "Your name"}
                    </p>
                    <p style={{ fontSize: 13, color: "#9A9590" }}>{email}</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{
                        fontSize: 12.5,
                        color: accent,
                        fontWeight: 600,
                        marginTop: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {settings.avatarUrl ? "Change photo" : "Upload photo"}
                    </button>
                  </div>
                </div>

                <div style={{ height: 12 }} />
                <SectionTitle>Profile</SectionTitle>
                <Row title="Display name" description="Shown in the sidebar and greetings.">
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    aria-label="Display name"
                    placeholder="Your name"
                    style={textInputStyle}
                  />
                </Row>
                <Row title="Email" description="Tied to your account. Read-only.">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    aria-label="Email"
                    style={{ ...textInputStyle, color: "#9A9590", cursor: "not-allowed" }}
                  />
                </Row>
              </div>
            )}

            {/* APPEARANCE */}
            {category === "appearance" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Editor</SectionTitle>
                <Row title="Font size" description="Body text size in the note editor.">
                  <Segmented
                    ariaLabel="Editor font size"
                    accent={accent}
                    value={settings.fontSize}
                    onChange={(v) => set("fontSize", v)}
                    options={[
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ]}
                  />
                </Row>
                <Row title="Editor font" description="Typeface used for writing notes.">
                  <Segmented
                    ariaLabel="Editor font"
                    accent={accent}
                    value={settings.editorFont}
                    onChange={(v) => set("editorFont", v)}
                    options={[
                      { value: "serif", label: "Serif" },
                      { value: "sans", label: "Sans" },
                    ]}
                  />
                </Row>

                <div style={{ height: 18 }} />
                <SectionTitle>Sidebar accent</SectionTitle>
                <p style={{ fontSize: 12.5, color: "#9A9590", margin: "2px 0 12px", lineHeight: 1.45 }}>
                  Sets the active highlight color in the left sidebar.
                </p>
                <div className="flex items-center gap-3" style={{ paddingBottom: 8 }}>
                  {ACCENTS.map((a) => {
                    const isActive = settings.accentColor.toLowerCase() === a.hex.toLowerCase()
                    return (
                      <button
                        key={a.id}
                        onClick={() => set("accentColor", a.hex)}
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
                          boxShadow: isActive ? `0 0 0 2px #FAF9F7, 0 0 0 4px ${a.hex}` : "none",
                        }}
                      >
                        {isActive && <Check size={16} strokeWidth={3} color="#FFFFFF" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* POMODORO */}
            {category === "pomodoro" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Durations</SectionTitle>
                <Row title="Focus" description="Length of each focus session.">
                  <Stepper
                    label="focus duration"
                    accent={accent}
                    min={5}
                    max={90}
                    value={settings.pomodoroFocus}
                    onChange={(v) => set("pomodoroFocus", v)}
                  />
                </Row>
                <Row title="Short break" description="Break after each focus session.">
                  <Stepper
                    label="short break"
                    accent={accent}
                    min={1}
                    max={30}
                    value={settings.pomodoroShortBreak}
                    onChange={(v) => set("pomodoroShortBreak", v)}
                  />
                </Row>
                <Row title="Long break" description="Break after four focus sessions.">
                  <Stepper
                    label="long break"
                    accent={accent}
                    min={5}
                    max={60}
                    value={settings.pomodoroLongBreak}
                    onChange={(v) => set("pomodoroLongBreak", v)}
                  />
                </Row>

                <div style={{ height: 18 }} />
                <SectionTitle>Sound</SectionTitle>
                <Row title="Chime on session end" description="Play a soft chime when a timer completes.">
                  <button
                    onClick={() => set("soundEnabled", !settings.soundEnabled)}
                    className="flex items-center gap-2"
                    aria-pressed={settings.soundEnabled}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    {settings.soundEnabled ? (
                      <Volume2 size={16} style={{ color: accent }} />
                    ) : (
                      <VolumeX size={16} style={{ color: "#B8B4AC" }} />
                    )}
                    <Toggle
                      label="Sound"
                      accent={accent}
                      checked={settings.soundEnabled}
                      onChange={(v) => set("soundEnabled", v)}
                    />
                  </button>
                </Row>
              </div>
            )}

            {/* ACCOUNT */}
            {category === "account" && (
              <div className="flex flex-col">
                <div style={{ height: 10 }} />
                <SectionTitle>Session</SectionTitle>
                <div style={{ height: 8 }} />
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-2.5 rounded-lg"
                  style={{
                    padding: "10px 14px",
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#2C2A27",
                    background: "#F0EDE8",
                    border: "1px solid #E2DDD5",
                    cursor: "pointer",
                    width: "fit-content",
                  }}
                >
                  <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
                  Sign out
                </button>

                <div style={{ height: 28 }} />
                <SectionTitle>Danger zone</SectionTitle>
                <div
                  style={{
                    marginTop: 10,
                    border: "1px solid #EAD4CF",
                    background: "#FCF4F2",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#A03325" }}>
                    Delete account
                  </p>
                  <p style={{ fontSize: 12.5, color: "#B06A5E", marginTop: 4, lineHeight: 1.5 }}>
                    Permanently delete your account and all notes, tasks, and projects. This cannot be
                    undone.
                  </p>

                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2"
                      style={{
                        marginTop: 12,
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        background: "#C0392B",
                        border: "none",
                        borderRadius: 7,
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                      Delete account
                    </button>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#A03325", marginBottom: 10 }}>
                        Are you absolutely sure?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={deleting}
                          onClick={async () => {
                            setDeleting(true)
                            try {
                              await onDeleteAccount()
                            } finally {
                              setDeleting(false)
                            }
                          }}
                          className="flex items-center gap-2"
                          style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#FFFFFF",
                            background: "#C0392B",
                            border: "none",
                            borderRadius: 7,
                            cursor: deleting ? "not-allowed" : "pointer",
                            opacity: deleting ? 0.7 : 1,
                          }}
                        >
                          {deleting ? (
                            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                          )}
                          {deleting ? "Deleting…" : "Yes, delete everything"}
                        </button>
                        <button
                          disabled={deleting}
                          onClick={() => setConfirmDelete(false)}
                          style={{
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#5E5A55",
                            background: "#FAF9F7",
                            border: "1px solid #E2DDD5",
                            borderRadius: 7,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
