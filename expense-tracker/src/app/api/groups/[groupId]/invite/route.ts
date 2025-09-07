import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const InviteSchema = z.object({ email: z.string().email() })

export async function POST(req: Request, context: { params: Promise<{ groupId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { groupId } = await context.params
  const membership = await prisma.membership.findFirst({ where: { groupId, userId: session.user.id } })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Only OWNER or ADMIN can invite
  if (!['OWNER','ADMIN'].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const email = parsed.data.email
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    await prisma.membership.upsert({
      where: { userId_groupId: { userId: user.id, groupId } },
      update: {},
      create: { userId: user.id, groupId, role: "MEMBER" },
    })
    return NextResponse.json({ status: "added", userId: user.id })
  }

  // In a full implementation, we'd create an Invitation model with token.
  const fakeLink = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/join/${groupId}`
  return NextResponse.json({ status: "invited", link: fakeLink })
}
