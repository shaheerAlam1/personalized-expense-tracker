"use client"

import Link from "next/link"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/groups",
    })
    setLoading(false)
    if (res?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/groups")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

        <div className="space-y-3">
          <Link
            href="/api/auth/signin"
            className="inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 w-full justify-center"
          >
            Sign in with GitHub
          </Link>

          <div className="text-center text-sm text-muted-foreground">or</div>

          <form onSubmit={onCredentials} className="space-y-3">
            <div>
              <label className="text-sm">Email</label>
              <input
                type="email"
                className="w-full h-9 border rounded-md px-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm">Password</label>
              <input
                type="password"
                className="w-full h-9 border rounded-md px-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              {loading ? "Signing in…" : "Sign in with Email"}
            </button>
          </form>

          <div className="text-xs text-muted-foreground">
            Don’t have an account? Use the form below to create one, then sign in.
          </div>
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}

function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    setBusy(false)
    if (res.ok) setMsg("Account created. You can now sign in.")
    else setMsg("Failed to register. Maybe email already in use.")
  }

  return (
    <form onSubmit={onRegister} className="space-y-2 border-t pt-4 mt-4">
      <div className="font-medium">Create an account</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          className="w-full h-9 border rounded-md px-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          className="w-full h-9 border rounded-md px-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full h-9 border rounded-md px-2 md:col-span-2"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      {msg && <div className="text-xs text-muted-foreground">{msg}</div>}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"
      >
        {busy ? "Creating…" : "Sign up"}
      </button>
    </form>
  )
}
