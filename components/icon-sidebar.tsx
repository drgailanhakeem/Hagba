"use client"

import {
  Inbox,
  FileText,
  CircleCheck,
  Tag,
  Search,
  Settings,
  LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { id: "inbox",  icon: Inbox,       label: "Inbox"  },
  { id: "notes",  icon: FileText,    label: "Notes"  },
  { id: "todos",  icon: CircleCheck, label: "To-Dos" },
  { id: "tags",   icon: Tag,         label: "Tags"   },
  { id: "search", icon: Search,      label: "Search" },
] as const

type NavId = (typeof NAV_ITEMS)[number]["id"]

interface IconSidebarProps {
  active: NavId
  onSelect: (id: NavId) => void
  inboxCount?: number
  onOpenSettings?: () => void
  settingsOpen?: boolean
  onSignOut?: () => void
}

export function IconSidebar({
  active,
  onSelect,
  inboxCount = 0,
  onOpenSettings,
  settingsOpen = false,
  onSignOut,
}: IconSidebarProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col items-center h-full py-4 gap-1"
      style={{ width: 56, backgroundColor: "#1C1C1E", flexShrink: 0 }}
    >
      {/* App mark — "H" lettermark for Hagba */}
      <div
        className="mb-4 flex items-center justify-center w-9 h-9 rounded-xl select-none"
        style={{ backgroundColor: "#D97B45" }}
        aria-label="Hagba"
      >
        <span
          aria-hidden="true"
          style={{
            color: "#FAF9F7",
            fontSize: 17,
            fontWeight: 700,
            fontFamily: "'Georgia', serif",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          H
        </span>
      </div>

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = active === id
          const showBadge = id === "inbox" && inboxCount > 0

          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-label={showBadge ? `${label}, ${inboxCount} unprocessed` : label}
              aria-current={isActive ? "page" : undefined}
              className="icon-btn flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                position: "relative",
                color: isActive ? "#E5E1DA" : "#6E6E73",
                backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" />

              {/* Badge */}
              {showBadge && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: "#D97B45",
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "system-ui, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    lineHeight: 1,
                    boxShadow: "0 0 0 1.5px #1C1C1E",
                  }}
                >
                  {inboxCount > 99 ? "99+" : inboxCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom group — Settings + Sign out */}
      <div className="mt-auto flex flex-col items-center gap-1">
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          aria-current={settingsOpen ? "page" : undefined}
          className="icon-btn flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            color: settingsOpen ? "#E5E1DA" : "#6E6E73",
            backgroundColor: settingsOpen ? "rgba(255,255,255,0.08)" : "transparent",
          }}
        >
          <Settings size={20} strokeWidth={settingsOpen ? 2 : 1.75} aria-hidden="true" />
        </button>

        <button
          onClick={onSignOut}
          aria-label="Sign out"
          className="icon-btn flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ color: "#6E6E73" }}
        >
          <LogOut size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
