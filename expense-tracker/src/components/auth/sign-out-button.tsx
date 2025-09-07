"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button className="text-sm underline" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  )
}

