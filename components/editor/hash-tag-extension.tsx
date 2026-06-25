"use client"

import { Mark, mergeAttributes, Extension } from "@tiptap/react"
import { ReactRenderer } from "@tiptap/react"
import Suggestion from "@tiptap/suggestion"
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import { PluginKey } from "@tiptap/pm/state"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { getTagColor, type TagEntry } from "@/lib/tags"

const HashTagPluginKey = new PluginKey("hashTagSuggestion")

// ── HashTag Mark ────────────────────────────────────────────────────────────
// Renders #word as a colored inline pill that does not interrupt reading flow.

export const HashTagMark = Mark.create({
  name: "hashTag",

  addAttributes() {
    return {
      tag: { default: null },
      color: { default: "amber" },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-hash-tag]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { color, ...rest } = HTMLAttributes
    return [
      "span",
      mergeAttributes(rest, {
        "data-hash-tag": "",
        "data-color": color ?? "amber",
      }),
      0,
    ]
  },

  // Marks are inclusive — typing at the end extends the mark
  inclusive: false,
})

// ── Autocomplete dropdown ───────────────────────────────────────────────────

interface TagSuggestProps {
  items: TagEntry[]
  query: string
  command: (item: TagEntry | string) => void
}

export interface TagSuggestRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export const TagSuggestMenu = forwardRef<TagSuggestRef, TagSuggestProps>(
  ({ items, query, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }: SuggestionKeyDownProps) {
        const total = items.length + (query.length > 0 ? 1 : 0)
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i - 1 + total) % total)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % total)
          return true
        }
        if (event.key === "Enter") {
          const isNewTag = selectedIndex === items.length
          if (isNewTag && query.length > 0) {
            command(query)
          } else if (items[selectedIndex]) {
            command(items[selectedIndex])
          }
          return true
        }
        return false
      },
    }))

    const showCreateNew = query.length > 0

    if (!items.length && !showCreateNew) return null

    return (
      <div
        role="listbox"
        aria-label="Tag suggestions"
        style={{
          background: "#FFFEFA",
          border: "1px solid #E2DDD5",
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(28,27,25,0.11), 0 1px 3px rgba(28,27,25,0.06)",
          padding: "4px",
          minWidth: 180,
          maxHeight: 260,
          overflowY: "auto",
          zIndex: 9999,
        }}
        className="note-list-scroll"
      >
        {items.map((item, i) => {
          const color = getTagColor(item.displayLabel)
          const isSelected = i === selectedIndex
          return (
            <button
              key={item.label}
              role="option"
              aria-selected={isSelected}
              onClick={() => command(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 8px",
                background: isSelected ? "#F3EFE8" : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 6,
              }}
            >
              {/* Color dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: color.dot,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              {/* Tag label */}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1C1B19",
                  fontFamily: "system-ui, sans-serif",
                  flex: 1,
                }}
              >
                #{item.displayLabel}
              </span>
              {/* Note count */}
              <span
                style={{
                  fontSize: 11,
                  color: "#B8B4AC",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {item.noteCount}
              </span>
            </button>
          )
        })}

        {/* "Create new tag" option */}
        {showCreateNew && (
          <button
            role="option"
            aria-selected={selectedIndex === items.length}
            onClick={() => command(query)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 8px",
              background: selectedIndex === items.length ? "#F3EFE8" : "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: 6,
              borderTop: items.length > 0 ? "1px solid #EDE9E2" : "none",
              marginTop: items.length > 0 ? 2 : 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "1.5px dashed #B8B4AC",
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: 13,
                color: "#787470",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Create{" "}
              <strong style={{ color: "#1C1B19", fontWeight: 500 }}>
                #{query}
              </strong>
            </span>
          </button>
        )}
      </div>
    )
  }
)
TagSuggestMenu.displayName = "TagSuggestMenu"

// ── Hash-tag suggestion extension ──────────────────────────────────────────
// Triggered by typing # in the editor.
// onTagCreated is called whenever a new or existing tag is committed.

export function buildHashTagExtension(
  existingTags: TagEntry[],
  onTagCreated: (label: string) => void
) {
  return Extension.create({
    name: "hashTagSuggestion",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          pluginKey: HashTagPluginKey,
          char: "#",
          allowSpaces: false,
          startOfLine: false,

          items({ query }: { query: string }) {
            const q = query.toLowerCase()
            return existingTags.filter((t) =>
              t.label.includes(q) || t.displayLabel.toLowerCase().includes(q)
            )
          },

          command({ editor, range, props }) {
            const label: string =
              typeof props === "string" ? props : (props as TagEntry).displayLabel
            const color = getTagColor(label)

            editor
              .chain()
              .focus()
              .deleteRange(range)
              // Insert the tag as styled text then a space
              .insertContent([
                {
                  type: "text",
                  marks: [
                    {
                      type: "hashTag",
                      attrs: { tag: label, color: color.id },
                    },
                  ],
                  text: `#${label}`,
                },
                { type: "text", text: " " },
              ])
              .run()

            onTagCreated(label)
          },

          render() {
            let component: ReactRenderer<TagSuggestRef, TagSuggestProps>
            let unmount: (() => void) | null = null

            return {
              onStart(props: SuggestionProps<TagEntry>) {
                component = new ReactRenderer(TagSuggestMenu, {
                  props: {
                    items: props.items,
                    query: props.query,
                    command: (item: TagEntry | string) => props.command(item),
                  },
                  editor: props.editor,
                })
                unmount = props.mount(component.element as HTMLElement)
              },

              onUpdate(props: SuggestionProps<TagEntry>) {
                component.updateProps({
                  items: props.items,
                  query: props.query,
                  command: (item: TagEntry | string) => props.command(item),
                })
              },

              onKeyDown(props: SuggestionKeyDownProps) {
                if (props.event.key === "Escape") {
                  unmount?.()
                  return true
                }
                return component.ref?.onKeyDown(props) ?? false
              },

              onExit() {
                unmount?.()
                component.destroy()
              },
            }
          },
        }),
      ]
    },
  })
}
