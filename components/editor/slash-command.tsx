"use client"

import { Extension, type Editor } from "@tiptap/react"
import { ReactRenderer } from "@tiptap/react"
import Suggestion from "@tiptap/suggestion"
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code2,
  Quote,
  Minus,
  Type,
} from "lucide-react"

// ── Command definitions ────────────────────────────────────────────────────
export interface SlashCommand {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

const COMMANDS: SlashCommand[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 size={16} />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 size={16} />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 size={16} />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List size={16} />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered size={16} />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Task List",
    description: "Checklist with checkboxes",
    icon: <CheckSquare size={16} />,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Code Block",
    description: "Block of code with syntax highlighting",
    icon: <Code2 size={16} />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Blockquote",
    description: "Indented quote",
    icon: <Quote size={16} />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus size={16} />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Paragraph",
    description: "Plain body text",
    icon: <Type size={16} />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
]

// ── Slash menu UI ──────────────────────────────────────────────────────────
interface SlashMenuProps {
  items: SlashCommand[]
  command: (item: SlashCommand) => void
}

export interface SlashMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }: SuggestionKeyDownProps) {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === "Enter") {
          if (items[selectedIndex]) command(items[selectedIndex])
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div
        role="listbox"
        aria-label="Slash command menu"
        style={{
          background: "#FFFEFA",
          border: "1px solid #E2DDD5",
          borderRadius: 10,
          boxShadow:
            "0 4px 24px rgba(28,27,25,0.12), 0 1px 4px rgba(28,27,25,0.06)",
          padding: "4px 4px",
          minWidth: 240,
          maxHeight: 320,
          overflowY: "auto",
          zIndex: 9999,
        }}
        className="note-list-scroll"
      >
        {items.map((item, i) => (
          <button
            key={item.title}
            role="option"
            aria-selected={i === selectedIndex}
            onClick={() => command(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "7px 10px",
              background: i === selectedIndex ? "#F3EFE8" : "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: i === selectedIndex ? "#E8E4DD" : "#F0EDE8",
                borderRadius: 6,
                color: "#5A5650",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <span>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#1C1B19",
                  lineHeight: 1.3,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {item.title}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#9A9590",
                  lineHeight: 1.3,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    )
  }
)
SlashMenu.displayName = "SlashMenu"

// ── Tiptap Extension ───────────────────────────────────────────────────────
export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        command({ editor, range, props }) {
          // Delete the slash + query text, then run the block command
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        items({ query }: { query: string }) {
          const q = query.toLowerCase().trim()
          if (!q) return COMMANDS
          return COMMANDS.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.description.toLowerCase().includes(q)
          )
        },
        render() {
          let component: ReactRenderer<SlashMenuRef, SlashMenuProps>
          let unmount: (() => void) | null = null

          return {
            onStart(props: SuggestionProps<SlashCommand>) {
              component = new ReactRenderer(SlashMenu, {
                props: {
                  items: props.items,
                  command: (item: SlashCommand) => props.command(item),
                },
                editor: props.editor,
              })

              unmount = props.mount(component.element as HTMLElement)
            },

            onUpdate(props: SuggestionProps<SlashCommand>) {
              component.updateProps({
                items: props.items,
                command: (item: SlashCommand) => props.command(item),
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
