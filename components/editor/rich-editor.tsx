"use client"

import "./editor.css"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { createLowlight, common } from "lowlight"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { useCallback, useEffect, useImperativeHandle, forwardRef } from "react"
import { CodeBlockView } from "./code-block-view"
import { SlashCommandExtension } from "./slash-command"

const lowlight = createLowlight(common)

export interface RichEditorRef {
  getWordCount: () => number
  getTextContent: () => string
}

interface RichEditorProps {
  initialContent?: string
  onUpdate?: (html: string, text: string) => void
  placeholder?: string
}

export const RichEditor = forwardRef<RichEditorRef, RichEditorProps>(
  ({ initialContent, onUpdate, placeholder = "Start writing… or type / for commands" }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // Disable the built-in code block — we use CodeBlockLowlight instead
          codeBlock: false,
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: "task-item",
          },
        }),
        CodeBlockLowlight.extend({
          addNodeView() {
            return ReactNodeViewRenderer(CodeBlockView)
          },
        }).configure({ lowlight }),
        SlashCommandExtension,
      ],
      content: initialContent || "<p></p>",
      editorProps: {
        attributes: {
          class: "bear-editor",
          spellcheck: "true",
        },
      },
      onUpdate({ editor }) {
        onUpdate?.(editor.getHTML(), editor.getText())
      },
      immediatelyRender: false,
    })

    // Update content when note changes (different note selected)
    useEffect(() => {
      if (!editor) return
      const currentHtml = editor.getHTML()
      const newContent = initialContent || "<p></p>"
      if (currentHtml !== newContent) {
        editor.commands.setContent(newContent)
      }
    }, [initialContent, editor])

    useImperativeHandle(ref, () => ({
      getWordCount() {
        if (!editor) return 0
        const text = editor.getText()
        return text.split(/\s+/).filter(Boolean).length
      },
      getTextContent() {
        return editor?.getText() ?? ""
      },
    }))

    return (
      <EditorContent
        editor={editor}
        style={{ minHeight: "60vh" }}
      />
    )
  }
)

RichEditor.displayName = "RichEditor"
