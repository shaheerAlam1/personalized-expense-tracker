import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CreateGroupDialog from "@/components/groups/create-group-dialog"
import Link from "next/link"

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)
  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId: session!.user!.id } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your Groups</h1>
        <CreateGroupDialog />
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <li key={g.id} className="border rounded-md p-4 hover:bg-accent">
            <Link href={`/groups/${g.id}`} className="font-medium">
              {g.name}
            </Link>
            <div className="text-sm text-muted-foreground">Currency: {g.currency}</div>
          </li>
        ))}
        {groups.length === 0 && (
          <li className="text-sm text-muted-foreground">No groups yet. Create one to get started.</li>
        )}
      </ul>
    </div>
  )
}
