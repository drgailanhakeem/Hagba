"use client"

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type As = any
import { useState } from "react"
import { Check, Copy } from "lucide-react"

const LANGUAGES = [
  "auto", "javascript", "typescript", "python", "rust", "go",
  "bash", "css", "html", "json", "sql", "yaml", "markdown",
]

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false)

  const language: string = node.attrs.language || "auto"

  const handleCopy = async () => {
    const code = node.textContent
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback
    }
  }

  return (
    <NodeViewWrapper
      as="div"
      className="code-block-wrapper"
      style={{ position: "relative", margin: "1.2em 0" }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#161618",
          borderRadius: "8px 8px 0 0",
          padding: "6px 12px 6px 10px",
          borderBottom: "1px solid #2C2C30",
        }}
      >
        {/* Language selector */}
        <select
          contentEditable={false}
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          aria-label="Code language"
          style={{
            background: "transparent",
            border: "none",
            color: "#8A8A8F",
            fontSize: 11,
            fontFamily: "'Geist Mono', 'SF Mono', monospace",
            cursor: "pointer",
            outline: "none",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang} style={{ background: "#1C1C1E", color: "#E5E5EA" }}>
              {lang}
            </option>
          ))}
        </select>

        {/* Copy button */}
        <button
          contentEditable={false}
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: copied ? "#4CAF82" : "#6E6E73",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            padding: "2px 0",
            transition: "color 0.15s",
          }}
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre
        style={{
          background: "#1C1C1E",
          borderRadius: "0 0 8px 8px",
          margin: 0,
          padding: "14px 16px",
          overflowX: "auto",
        }}
      >
        <NodeViewContent
          as={"code" as As}
          style={{
            fontFamily: "'Geist Mono', 'SF Mono', 'Menlo', monospace",
            fontSize: 13,
            lineHeight: 1.65,
            color: "#E5E5EA",
            display: "block",
            whiteSpace: "pre",
          }}
        />
      </pre>
    </NodeViewWrapper>
  )
}
