import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const CreateGroupSchema = z.object({ name: z.string().min(1).max(100) })

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      currency: process.env.CURRENCY || "PKR",
      memberships: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  })

  return NextResponse.json(group)
}
