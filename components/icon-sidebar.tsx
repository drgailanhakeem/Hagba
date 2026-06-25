"use client"

import { useState } from "react"
import {
  Home,
  FileText,
  Tag,
  Search,
  Settings,
  PenLine,
} from "lucide-react"

const NAV_ITEMS = [
  { id: "inbox",    icon: Home,      label: "Inbox"    },
  { id: "notes",    icon: FileText,  label: "Notes"    },
  { id: "tags",     icon: Tag,       label: "Tags"     },
  { id: "search",   icon: Search,    label: "Search"   },
] as const

type NavId = (typeof NAV_ITEMS)[number]["id"]

interface IconSidebarProps {
  active: NavId
  onSelect: (id: NavId) => void
}

export function IconSidebar({ active, onSelect }: IconSidebarProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col items-center h-full py-4 gap-1"
      style={{ width: 56, backgroundColor: "#1C1C1E", flexShrink: 0 }}
    >
      {/* App mark */}
      <div className="mb-4 flex items-center justify-center w-9 h-9 rounded-xl"
           style={{ backgroundColor: "#D97B45" }}>
        <PenLine size={16} strokeWidth={2} style={{ color: "#FAF9F7" }} aria-hidden="true" />
      </div>

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="icon-btn flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                color: isActive ? "#E5E1DA" : "#6E6E73",
                backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {/* Settings at bottom */}
      <button
        aria-label="Settings"
        className="icon-btn flex items-center justify-center w-10 h-10 rounded-xl mt-auto"
        style={{ color: "#6E6E73" }}
      >
        <Settings size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </nav>
  )
}
