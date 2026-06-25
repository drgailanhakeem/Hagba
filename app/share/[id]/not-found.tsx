import Link from "next/link"

export default function ShareNotFound() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: "#FAF9F7" }}
    >
      <div className="text-center" style={{ maxWidth: 380 }}>
        <span
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#D97B45",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 20,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 18,
          }}
        >
          H
        </span>
        <h1
          style={{
            fontFamily: "'iA Writer Quattro S', 'Georgia', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#1C1B19",
            marginBottom: 8,
          }}
        >
          Note not available
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#787470",
            lineHeight: 1.5,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 20,
          }}
        >
          This note is private or no longer shared. Ask the owner for an updated link.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#FFFFFF",
            background: "#D97B45",
            borderRadius: 8,
            textDecoration: "none",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Go to Hagba
        </Link>
      </div>
    </div>
  )
}
