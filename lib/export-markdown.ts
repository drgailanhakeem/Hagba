// ── Note → Markdown export ───────────────────────────────────────────────────
// Converts the editor's stored HTML into a reasonable Markdown approximation
// and triggers a browser download as a .md file. Runs client-side only.

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Best-effort HTML → Markdown for the rich-text bodies this app produces. */
export function htmlToMarkdown(html: string): string {
  if (!html) return ""

  // Use the DOM to walk the tree when available; fall back to regex stripping.
  if (typeof document === "undefined") {
    return decodeEntities(html.replace(/<[^>]+>/g, "")).trim()
  }

  const container = document.createElement("div")
  container.innerHTML = html

  function inline(node: Node): string {
    let out = ""
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent ?? ""
        return
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return
      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()
      const inner = inline(el)
      switch (tag) {
        case "strong":
        case "b":
          out += `**${inner}**`
          break
        case "em":
        case "i":
          out += `*${inner}*`
          break
        case "code":
          out += `\`${inner}\``
          break
        case "a":
          out += `[${inner}](${el.getAttribute("href") ?? ""})`
          break
        case "br":
          out += "\n"
          break
        default:
          out += inner
      }
    })
    return out
  }

  const lines: string[] = []

  function block(el: HTMLElement) {
    const tag = el.tagName.toLowerCase()
    switch (tag) {
      case "h1": lines.push(`# ${inline(el)}`, ""); break
      case "h2": lines.push(`## ${inline(el)}`, ""); break
      case "h3": lines.push(`### ${inline(el)}`, ""); break
      case "h4": lines.push(`#### ${inline(el)}`, ""); break
      case "p": lines.push(inline(el), ""); break
      case "blockquote":
        inline(el).split("\n").forEach((l) => lines.push(`> ${l}`))
        lines.push("")
        break
      case "pre": {
        const codeEl = el.querySelector("code")
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] ?? ""
        lines.push("```" + lang, (codeEl?.textContent ?? el.textContent ?? "").replace(/\n$/, ""), "```", "")
        break
      }
      case "ul":
        el.querySelectorAll(":scope > li").forEach((li) => {
          const isTask = (li as HTMLElement).getAttribute("data-type") === "taskItem"
          if (isTask) {
            const checked = (li as HTMLElement).getAttribute("data-checked") === "true"
            lines.push(`- [${checked ? "x" : " "}] ${inline(li)}`)
          } else {
            lines.push(`- ${inline(li)}`)
          }
        })
        lines.push("")
        break
      case "ol":
        el.querySelectorAll(":scope > li").forEach((li, i) => lines.push(`${i + 1}. ${inline(li)}`))
        lines.push("")
        break
      case "hr": lines.push("---", ""); break
      default:
        if (el.textContent?.trim()) lines.push(inline(el), "")
    }
  }

  container.childNodes.forEach((n) => {
    if (n.nodeType === Node.ELEMENT_NODE) block(n as HTMLElement)
    else if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) lines.push(n.textContent.trim(), "")
  })

  return decodeEntities(lines.join("\n")).replace(/\n{3,}/g, "\n\n").trim()
}

/** Sanitize a note title into a filename-safe slug. */
function slugify(title: string): string {
  return (title.trim() || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled"
}

/** Download a note as a Markdown file (title as H1 + converted body). */
export function downloadNoteAsMarkdown(title: string, html: string): void {
  const body = htmlToMarkdown(html)
  const heading = title.trim() || "Untitled"
  const md = `# ${heading}\n\n${body}\n`
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${slugify(title)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
