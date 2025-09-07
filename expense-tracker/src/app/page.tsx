import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const isAuthed = Boolean(session?.user?.id)
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">Umrah Trip Tracker</h1>
        <p className="text-muted-foreground">Share expenses with your group and settle up easily.</p>
        <div className="space-x-3">
          {isAuthed ? (
            <Link href="/groups" className="inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/signin" className="inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90">
              Sign in with GitHub
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
