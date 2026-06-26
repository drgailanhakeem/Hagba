// ── Tag color palette ──────────────────────────────────────────────────────
// Each entry: { bg, text, dot } — warm Bear palette

export interface TagColor {
  id: string
  bg: string        // background for the pill
  text: string      // text color
  dot: string       // solid color for the dot in the sidebar
  bgClass: string   // legacy Tailwind class for NoteTag (note-list-panel)
  textClass: string
}

export const TAG_COLORS: TagColor[] = [
  { id: "amber",   bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", bgClass: "bg-amber-100",   textClass: "text-amber-700"   },
  { id: "sky",     bg: "#E0F2FE", text: "#0C4A6E", dot: "#38BDF8", bgClass: "bg-sky-100",     textClass: "text-sky-700"     },
  { id: "emerald", bg: "#D1FAE5", text: "#065F46", dot: "#34D399", bgClass: "bg-emerald-100", textClass: "text-emerald-700" },
  { id: "rose",    bg: "#FFE4E6", text: "#9F1239", dot: "#FB7185", bgClass: "bg-rose-100",    textClass: "text-rose-700"    },
  { id: "violet",  bg: "#EDE9FE", text: "#4C1D95", dot: "#A78BFA", bgClass: "bg-violet-100",  textClass: "text-violet-700"  },
  { id: "orange",  bg: "#FFEDD5", text: "#7C2D12", dot: "#FB923C", bgClass: "bg-orange-100",  textClass: "text-orange-700"  },
  { id: "teal",    bg: "#CCFBF1", text: "#134E4A", dot: "#2DD4BF", bgClass: "bg-teal-100",    textClass: "text-teal-700"    },
  { id: "pink",    bg: "#FCE7F3", text: "#831843", dot: "#F472B6", bgClass: "bg-pink-100",    textClass: "text-pink-700"    },
]

// Deterministically assign a color to a tag label
export function getTagColor(label: string): TagColor {
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  }
  return TAG_COLORS[hash % TAG_COLORS.length]
}

// Resolve a stored NoteTag background class (e.g. "bg-amber-100") back to its
// palette entry, so a tag's persisted color drives the sidebar dot + pills.
export function colorByBgClass(bgClass: string | undefined): TagColor | undefined {
  if (!bgClass) return undefined
  return TAG_COLORS.find((c) => c.bgClass === bgClass)
}

// ── Global tag registry ─────────────────────────────────────────────────────
// Keyed by lowercase label. Managed in page.tsx via React state and passed down.

export interface TagEntry {
  label: string          // canonical (lowercase) label
  displayLabel: string   // user-facing, may be renamed
  colorId: string        // key into TAG_COLORS
  noteCount: number
}

export function buildTagRegistry(
  notes: { tags: { label: string; color?: string }[] }[],
): Map<string, TagEntry> {
  const map = new Map<string, TagEntry>()
  for (const note of notes) {
    for (const tag of note.tags) {
      const key = tag.label.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.noteCount++
      } else {
        // Prefer the persisted color; fall back to the deterministic one.
        const color = colorByBgClass(tag.color) ?? getTagColor(tag.label)
        map.set(key, {
          label: key,
          displayLabel: tag.label,
          colorId: color.id,
          noteCount: 1,
        })
      }
    }
  }
  return map
}

export function colorById(id: string): TagColor {
  return TAG_COLORS.find((c) => c.id === id) ?? TAG_COLORS[0]
}
