"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AuthShell } from "@/components/auth/auth-shell"

type Tab = "signin" | "signup"

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("signin")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchTab(next: Tab) {
    setTab(next)
    setError(null)
    setNotice(null)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is disabled, a session is returned immediately.
    if (data.session) {
      router.push("/")
      router.refresh()
      return
    }

    setLoading(false)
    setNotice("Check your email to confirm your account, then sign in.")
    setTab("signin")
  }

  return (
    <AuthShell
      title={tab === "signin" ? "Welcome back" : "Create your account"}
      subtitle={
        tab === "signin"
          ? "Sign in to continue to your notes and tasks."
          : "Start capturing notes and organizing your day."
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex rounded-lg bg-[#F0EDE8] p-1">
        <button
          type="button"
          onClick={() => switchTab("signin")}
          aria-pressed={tab === "signin"}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === "signin"
              ? "bg-[#FAF9F7] text-[#1C1B19] shadow-sm"
              : "text-[#787470] hover:text-[#2C2A27]"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchTab("signup")}
          aria-pressed={tab === "signup"}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === "signup"
              ? "bg-[#FAF9F7] text-[#1C1B19] shadow-sm"
              : "text-[#787470] hover:text-[#2C2A27]"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form
        onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#2C2A27]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="auth-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[#2C2A27]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete={tab === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tab === "signin" ? "••••••••" : "At least 6 characters"}
            className="auth-input"
          />
        </div>

        {tab === "signup" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="repeat-password" className="text-sm font-medium text-[#2C2A27]">
              Confirm password
            </label>
            <input
              id="repeat-password"
              type="password"
              required
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-[#C0492B] bg-[#F8E8E2] rounded-md px-3 py-2" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm text-[#1C5D3A] bg-[#DCF0E4] rounded-md px-3 py-2" role="status">
            {notice}
          </p>
        )}

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading
            ? tab === "signin"
              ? "Signing in…"
              : "Creating account…"
            : tab === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </AuthShell>
  )
}
