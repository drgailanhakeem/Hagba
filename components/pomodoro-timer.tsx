"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, X } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────
type Phase = "idle" | "focus" | "short-break" | "long-break"

export interface TimerSettings {
  focusMins: number
  shortBreakMins: number
  longBreakMins: number
  soundEnabled: boolean
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
  soundEnabled: true,
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function phaseTotal(phase: Phase, settings: TimerSettings): number {
  if (phase === "focus") return settings.focusMins * 60
  if (phase === "short-break") return settings.shortBreakMins * 60
  if (phase === "long-break") return settings.longBreakMins * 60
  return settings.focusMins * 60
}

// Soft chime using the Web Audio API
function playChime(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8)

    const freqs = [523.25, 659.25, 783.99] // C5 E5 G5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = freq
      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 1.6)
    })

    setTimeout(() => ctx.close(), 2500)
  } catch {
    // AudioContext not available — silently skip
  }
}

// ── Ring SVG ─────────────────────────────────────────────────────────────
interface RingProps {
  progress: number   // 0–1, fraction of time elapsed
  phase: Phase
  size?: number
  strokeWidth?: number
}

function ProgressRing({ progress, phase, size = 28, strokeWidth = 2.5 }: RingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - progress)

  const trackColor = "rgba(0,0,0,0.08)"
  const ringColor =
    phase === "focus"
      ? "#E85D4A"
      : phase === "short-break" || phase === "long-break"
      ? "#3DAA6E"
      : "#C8C4BC"

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ flexShrink: 0, transform: "rotate(-90deg)" }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
      />
    </svg>
  )
}

// ── Notification banner ───────────────────────────────────────────────────
interface BannerProps {
  message: string
  onDismiss: () => void
}

function NotificationBanner({ message, onDismiss }: BannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 72,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1C1B19",
        color: "#FAF9F7",
        borderRadius: 10,
        padding: "10px 18px",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 300,
        animation: "fadeInUp 0.25s ease",
        whiteSpace: "nowrap",
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#9A9590", padding: 0, display: "flex", alignItems: "center",
        }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
interface PomodoroTimerProps {
  noteTitle: string
  /** Durations + sound, synced from the user's global settings */
  timerSettings?: TimerSettings
}

export function PomodoroTimer({ noteTitle, timerSettings }: PomodoroTimerProps) {
  const settings = timerSettings ?? DEFAULT_SETTINGS
  const [phase, setPhase] = useState<Phase>("idle")
  const [secondsLeft, setSecondsLeft] = useState(settings.focusMins * 60)
  const [running, setRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)  // completed focus sessions
  const [focusLabel, setFocusLabel] = useState("")
  const [showHover, setShowHover] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Total seconds for current phase
  const totalSeconds = phase === "idle"
    ? settings.focusMins * 60
    : phaseTotal(phase, settings)

  const progress = phase === "idle" ? 0 : 1 - secondsLeft / totalSeconds

  // Clock tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          handleSessionEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, phase, settings, sessionCount])

  function handleSessionEnd() {
    setRunning(false)
    playChime(settings.soundEnabled)

    if (phase === "focus") {
      const newCount = sessionCount + 1
      setSessionCount(newCount)
      const isLong = newCount % 4 === 0
      const nextPhase: Phase = isLong ? "long-break" : "short-break"
      const mins = isLong ? settings.longBreakMins : settings.shortBreakMins
      const msg = `Focus session complete! Take a ${mins} min ${isLong ? "long " : ""}break.`
      setNotification(msg)
      setPhase(nextPhase)
      setSecondsLeft(phaseTotal(nextPhase, settings))
    } else {
      // Break ended → back to idle/focus ready
      setNotification("Break over. Ready to focus?")
      setPhase("idle")
      setSecondsLeft(settings.focusMins * 60)
      setFocusLabel("")
    }
  }

  function startTimer() {
    if (phase === "idle") {
      setPhase("focus")
      setSecondsLeft(settings.focusMins * 60)
      setFocusLabel(noteTitle)
    }
    setRunning(true)
  }

  function pauseTimer() {
    setRunning(false)
  }

  function resetTimer() {
    setRunning(false)
    clearInterval(intervalRef.current!)
    setPhase("idle")
    setSecondsLeft(settings.focusMins * 60)
    setFocusLabel("")
  }

  // Keep the idle countdown in sync with the user's focus duration setting
  useEffect(() => {
    if (phase === "idle") setSecondsLeft(settings.focusMins * 60)
  }, [settings.focusMins, phase])

  // ── Colors & labels per phase ────────────────────────────────────────
  const isBreak = phase === "short-break" || phase === "long-break"
  const ringColor = isBreak ? "#3DAA6E" : "#E85D4A"
  const phaseLabel =
    phase === "idle" ? "Focus"
    : phase === "focus" ? "Focus"
    : phase === "short-break" ? "Break"
    : "Long Break"

  return (
    <>
      {/* ── Widget ── */}
      <div
        ref={containerRef}
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
        style={{ position: "relative", display: "flex", alignItems: "center", gap: 7 }}
      >
        {/* Reset button — shows on hover when active */}
        {(running || phase !== "idle") && showHover && (
          <button
            onClick={resetTimer}
            aria-label="Reset timer"
            title="Reset timer"
            className="icon-btn flex items-center justify-center"
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "#B8B4AC",
              animation: "fadeIn 0.15s ease",
            }}
          >
            <RotateCcw size={12} strokeWidth={2} />
          </button>
        )}

        {/* Ring + time + play/pause */}
        <button
          onClick={running ? pauseTimer : startTimer}
          aria-label={running ? "Pause focus timer" : (phase === "idle" ? "Start focus timer" : "Resume timer")}
          title={running ? "Pause" : (phase === "idle" ? `Start ${settings.focusMins} min focus` : "Resume")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            padding: "3px 7px 3px 5px",
            borderRadius: 20,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F0EDE8" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none" }}
        >
          <ProgressRing progress={progress} phase={phase} size={22} strokeWidth={2.5} />

          {/* Time or idle label */}
          <span
            style={{
              fontSize: 12,
              fontFamily: "system-ui, 'SF Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              color: phase === "idle" ? "#B8B4AC" : isBreak ? "#3DAA6E" : "#E85D4A",
              fontWeight: 500,
              letterSpacing: "0.02em",
              minWidth: 38,
              lineHeight: 1,
            }}
          >
            {phase === "idle" ? phaseLabel : formatTime(secondsLeft)}
          </span>

          {/* Play / Pause icon */}
          {running
            ? <Pause size={11} strokeWidth={2.5} style={{ color: ringColor, flexShrink: 0 }} />
            : <Play  size={11} strokeWidth={2.5} style={{ color: "#B8B4AC", flexShrink: 0 }} fill={phase !== "idle" ? "#B8B4AC" : "none"} />
          }
        </button>

        {/* Focus label under the widget */}
        {focusLabel && phase === "focus" && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 10,
              color: "#B8B4AC",
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 160,
              pointerEvents: "none",
            }}
          >
            Focusing on: {focusLabel}
          </div>
        )}
      </div>

      {/* ── Notification banner ── */}
      {notification && (
        <NotificationBanner
          message={notification}
          onDismiss={() => setNotification(null)}
        />
      )}
    </>
  )
}
