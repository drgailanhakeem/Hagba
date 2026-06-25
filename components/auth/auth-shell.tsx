import type React from "react"

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#1C1C1E] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D97B45] text-xl font-semibold text-[#FAF9F7]">
            H
          </div>
          <h1 className="text-2xl font-semibold text-[#FAF9F7]">Hagba</h1>
        </div>

        <div className="rounded-2xl bg-[#FAF9F7] p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-balance text-[#1C1B19]">{title}</h2>
            {subtitle && (
              <p className="mt-1.5 text-sm leading-relaxed text-pretty text-[#787470]">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
