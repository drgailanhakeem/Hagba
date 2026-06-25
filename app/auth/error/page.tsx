import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"

export default function AuthErrorPage() {
  return (
    <AuthShell
      title="Something went wrong"
      subtitle="We couldn't complete your request."
    >
      <p className="text-sm leading-relaxed text-[#787470]">
        The authentication link may have expired or already been used. Please try
        signing in again.
      </p>
      <Link href="/auth/login" className="auth-btn-primary mt-6 inline-flex justify-center">
        Back to sign in
      </Link>
    </AuthShell>
  )
}
